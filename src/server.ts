#!/usr/bin/env node

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Schema for code execution parameters
const ExecuteCodeSchema = z.object({
  code: z.string().describe("The C++ code to execute"),
  input: z.string().optional().describe("Input data for the program"),
  timeLimit: z.number().optional().default(5).describe("Time limit in seconds"),
});

const SubmitSolutionSchema = z.object({
  problemName: z.string().describe("Name of the problem being solved"),
  code: z.string().describe("The C++ solution code"),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string()
  })).describe("Test cases to validate the solution"),
  functionSignature: z.string().optional().describe("Expected function signature if applicable")
});

const OptimizeCodeSchema = z.object({
  code: z.string().describe("The C++ code to analyze and optimize"),
  constraints: z.object({
    timeComplexity: z.string().optional().describe("Target time complexity"),
    spaceComplexity: z.string().optional().describe("Target space complexity"),
    memoryLimit: z.string().optional().describe("Memory limit (e.g., '256MB')")
  }).optional()
});

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: string;
  memoryUsage?: string;
}

class OnlineGDBExecutor {
  private browser: any = null;
  private page: any = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--enable-experimental-web-platform-features'
        ]
      });
      this.page = await this.browser.newPage();
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    }
  }

  async executeCode(code: string, input: string = "", timeLimit: number = 15): Promise<ExecutionResult> {
    try {
      await this.initialize();
      await this.page.goto('https://www.onlinegdb.com/online_c++_compiler', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      await this.page.waitForSelector('#editor_1', { timeout: 15000 });
      
      // Always select the 'Text' radio button for input mode
      await this.page.evaluate(() => {
        const textRadio = document.getElementById('input_method_text') as HTMLInputElement;
        if (textRadio) textRadio.click();
      });
      
      // Wait for ad container to be hidden and input area to be visible
      await this.page.waitForFunction(() => {
        const ad = document.getElementById('ad_unit_bottom_wrapper');
        const stdinput = document.getElementById('stdinput');
        const adHidden = ad && (ad.style.display === 'none' || ad.offsetParent === null);
        const inputVisible = stdinput && stdinput.offsetParent !== null;
        return adHidden && inputVisible;
      }, { timeout: 10000 });
      
      // Set code in Ace editor
      await this.page.evaluate((code: string) => {
        const editor = (window as any).ace?.edit('editor_1');
        if (editor) editor.setValue(code, -1);
      }, code);
      
      // If input is provided, set input in #stdinput
      if (input.trim()) {
        let inputReady = false, tries = 0;
        while (!inputReady && tries < 5) {
          try {
            await this.page.waitForSelector('#stdinput', { visible: true, timeout: 2000 });
            inputReady = true;
          } catch { 
            tries++; 
          }
        }
        
        if (!inputReady) throw new Error("Input box (#stdinput) not found after retries.");
        
        await this.page.evaluate((inputText: string) => {
          const stdinput = document.getElementById('stdinput') as HTMLTextAreaElement;
          if (stdinput) stdinput.value = inputText;
        }, input);
      }
      
      // Click the run button
      const runButton = await this.page.$('#control-btn-run');
      if (runButton) {
        await runButton.click();
      } else {
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('Enter');
        await this.page.keyboard.up('Control');
      }
      
      // Wait for output or error to appear
      let output = '';
      let error = '';
      let outputReady = false, tries = 0;
      
      while (!outputReady && tries < 30) {
        try {
          await this.page.waitForFunction(() => {
            const stdoutTab = document.querySelector('li.tab-stdout') as HTMLElement;
            const preStdout = document.querySelector('#tab-stdout pre.msg');
            const preStderr = document.querySelector('#tab-stderr pre.msg');
            const stdoutReady = stdoutTab && stdoutTab.classList.contains('active') && preStdout && preStdout.textContent && preStdout.textContent.trim().length > 0;
            const stderrReady = preStderr && preStderr.textContent && preStderr.textContent.trim().length > 0;
            return stdoutReady || stderrReady;
          }, { timeout: 1000 });
          
          output = await this.page.evaluate(() => {
            return document.querySelector('#tab-stdout pre.msg')?.textContent?.trim() || '';
          });
          
          error = await this.page.evaluate(() => {
            return document.querySelector('#tab-stderr pre.msg')?.textContent?.trim() || '';
          });
          
          outputReady = !!output || !!error;
        } catch { 
          tries++; 
        }
      }
      
      // Normalize output and error
      function normalize(str: string) {
        return (str || '').replace(/\r/g, '').replace(/\n{2,}/g, '\n').trim();
      }
      
      output = normalize(output);
      error = normalize(error);
      
      const hasError = !!error && error.length > 0;
      const hasOutput = !!output && output.length > 0;
      
      return {
        success: hasOutput && !hasError,
        output: hasOutput ? output : (hasError ? error : ''),
        error: hasError ? error : undefined,
        executionTime: undefined,
        memoryUsage: undefined
      };
      
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Execution failed: ${error?.message || 'Unknown error'}`
      };
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

class MCPServer {
  private app: express.Application;
  private executor: OnlineGDBExecutor;
  private port: number;
  private validApiKey: string;
  private allowedOrigins: string[];

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.executor = new OnlineGDBExecutor();
    this.validApiKey = process.env.MCP_API_KEY || this.generateDefaultApiKey();
    this.allowedOrigins = [
      'https://claude.ai',
      'https://chat.claude.ai',
      'https://console.claude.ai'
    ];
    
    this.setupMiddleware();
    this.setupRoutes();

    // Cleanup on exit
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  private generateDefaultApiKey(): string {
    // Generate a secure API key if none is provided
    const key = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Generated API Key:', key);
    console.log('⚠️  Set MCP_API_KEY environment variable to use a custom key');
    return key;
  }

  private authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction): void {
    // Skip authentication for health check and root endpoints
    if (req.path === '/health' || req.path === '/') {
      return next();
    }

    // Validate Origin header to prevent DNS rebinding attacks
    const origin = req.headers.origin;
    if (origin && !this.allowedOrigins.includes(origin) && !origin.match(/^https:\/\/[a-zA-Z0-9-]+\.claude\.ai$/)) {
      res.status(403).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid origin' },
        id: null
      });
      return;
    }

    // Check for API key in x-api-key header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!apiKey || apiKey !== this.validApiKey) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Authentication required' },
        id: null
      });
      return;
    }

    next();
  }

  private validateSessionId(sessionId: string): boolean {
    // Basic session ID validation - should be cryptographically secure
    return !!(sessionId && sessionId.length >= 32 && /^[a-zA-Z0-9]+$/.test(sessionId));
  }

  private setupMiddleware() {
    // Rate limiting middleware
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use(limiter);

    // Authentication middleware
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      return this.authenticateRequest(req, res, next);
    });

    // Security headers
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('ngrok-skip-browser-warning', 'true');
      next();
    });

    // CORS configuration - remove wildcard for security
    this.app.use(cors({
      origin: [
        'https://claude.ai',
        'https://chat.claude.ai',
        'https://console.claude.ai',
        /^https:\/\/[a-zA-Z0-9-]+\.claude\.ai$/,
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [])
      ],
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-Requested-With',
        'Accept',
        'Origin',
        'x-claude-request-id',
        'x-mcp-session-id'
      ],
      exposedHeaders: ['x-mcp-session-id']
    }));

    this.app.use(express.json({ limit: '2mb' }));
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        server: 'onlinegdb-cpp-executor',
        version: '1.0.0'
      });
    });

    // Home page
    this.app.get('/', (req: Request, res: Response) => {
      res.send(`
        <h1>OnlineGDB MCP Server</h1>
        <p>C++ Code Execution MCP Server is running successfully!</p>
        <h2>Authentication:</h2>
        <p>This server requires authentication via <code>x-api-key</code> header.</p>
        <h2>Available Endpoints:</h2>
        <ul>
          <li><strong>GET /</strong> - This page</li>
          <li><strong>POST /mcp</strong> - MCP protocol endpoint (requires auth)</li>
          <li><strong>GET /tools/list</strong> - List available tools (requires auth)</li>
          <li><strong>GET /health</strong> - Health check (no auth required)</li>
        </ul>
        <h2>Available Tools:</h2>
        <ul>
          <li><strong>execute_cpp_code</strong> - Execute C++ code with input</li>
          <li><strong>submit_solution</strong> - Test solutions against multiple test cases</li>
          <li><strong>optimize_code</strong> - Analyze and optimize C++ code</li>
          <li><strong>generate_test_cases</strong> - Generate test cases for problems</li>
        </ul>
      `);
    });

    // MCP protocol endpoint
    this.app.post('/mcp', async (req: Request, res: Response): Promise<void> => {
      try {
        const { jsonrpc, id, method, params } = req.body;
        
        // Validate JSON-RPC request
        if (jsonrpc !== "2.0" || !method) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32600, message: "Invalid Request" },
            id: id || null
          });
          return;
        }

        // Validate and sanitize inputs
        if (typeof method !== 'string' || method.length > 100) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32602, message: "Invalid method" },
            id: id || null
          });
          return;
        }

        // Check session ID if provided
        const sessionId = req.headers['x-mcp-session-id'] as string;
        if (sessionId && !this.validateSessionId(sessionId)) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32602, message: "Invalid session ID" },
            id: id || null
          });
          return;
        }

        let result;
        
        switch (method) {
          case 'initialize':
            result = {
              protocolVersion: "2024-11-05",
              capabilities: { 
                tools: {},
                resources: {},
                prompts: {}
              },
              serverInfo: {
                name: "onlinegdb-cpp-executor",
                version: "1.0.0"
              }
            };
            break;
            
          case 'tools/list':
            result = {
              tools: this.getToolsDefinition()
            };
            break;
            
          case 'tools/call':
            const { name, arguments: args } = params;
            if (!name) {
              res.status(400).json({
                jsonrpc: "2.0",
                error: { code: -32602, message: "Missing tool name" },
                id: id || null
              });
              return;
            }
            result = await this.handleToolCall(name, args);
            break;
            
          default:
            res.status(404).json({
              jsonrpc: "2.0",
              error: { code: -32601, message: "Method not found" },
              id: id || null
            });
            return;
        }
        
        // Add session ID to response if provided
        const responseHeaders: any = {};
        if (sessionId) {
          responseHeaders['x-mcp-session-id'] = sessionId;
        }
        
        res.set(responseHeaders).json({
          jsonrpc: "2.0",
          result: result,
          id: id || null
        });
        
      } catch (err: any) {
        // Don't leak sensitive information in error messages
        const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: errorMessage },
          id: req.body.id || null
        });
      }
    });

    // REST endpoint for tools list (for easier testing)
    this.app.get('/tools/list', (req: Request, res: Response) => {
      res.json({ tools: this.getToolsDefinition() });
    });
  }

  private getToolsDefinition() {
    return [
      {
        name: "execute_cpp_code",
        description: "Execute C++ code using OnlineGDB compiler with optional input",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The C++ code to execute"
            },
            input: {
              type: "string",
              description: "Input data for the program (optional)"
            },
            timeLimit: {
              type: "number",
              description: "Time limit in seconds (default: 5)",
              default: 5
            }
          },
          required: ["code"]
        }
      },
      {
        name: "submit_solution",
        description: "Submit and test a complete solution for a coding problem with multiple test cases",
        inputSchema: {
          type: "object",
          properties: {
            problemName: {
              type: "string",
              description: "Name of the problem being solved"
            },
            code: {
              type: "string",
              description: "The C++ solution code"
            },
            testCases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  input: { type: "string" },
                  expectedOutput: { type: "string" }
                },
                required: ["input", "expectedOutput"]
              },
              description: "Test cases to validate the solution"
            }
          },
          required: ["problemName", "code", "testCases"]
        }
      },
      {
        name: "optimize_code",
        description: "Analyze and suggest optimizations for C++ code",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The C++ code to analyze and optimize"
            }
          },
          required: ["code"]
        }
      },
      {
        name: "generate_test_cases",
        description: "Generate comprehensive test cases for a given problem description",
        inputSchema: {
          type: "object",
          properties: {
            problemDescription: {
              type: "string",
              description: "Description of the coding problem"
            },
            numTestCases: {
              type: "number",
              description: "Number of test cases to generate",
              default: 5
            }
          },
          required: ["problemDescription"]
        }
      }
    ];
  }

  public async handleToolCall(name: string, args: any) {
    try {
      switch (name) {
        case "execute_cpp_code":
          return await this.handleExecuteCode(args);
        case "submit_solution":
          return await this.handleSubmitSolution(args);
        case "optimize_code":
          return await this.handleOptimizeCode(args);
        case "generate_test_cases":
          return await this.handleGenerateTestCases(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error?.message || 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleExecuteCode(args: any) {
    const { code, input = "", timeLimit = 5 } = ExecuteCodeSchema.parse(args);
    const result = await this.executor.executeCode(code, input, timeLimit);

    let responseText = `**Execution Result:**\n`;
    responseText += `Status: ${result.success ? '✅ Success' : '❌ Failed'}\n\n`;
    
    if (result.output) {
      responseText += `**Output:**\n\`\`\`\n${result.output}\n\`\`\`\n\n`;
    }
    
    if (result.error) {
      responseText += `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
    }

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
      data: {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage
      }
    };
  }

  private async handleSubmitSolution(args: any) {
    const { problemName, code, testCases } = SubmitSolutionSchema.parse(args);
    let responseText = `**Testing Solution for: ${problemName}**\n\n`;
    let testResults: any[] = [];
    let passedTests = 0;

    for (let i = 0; i < testCases.length; i++) {
      const result = await this.executor.executeCode(code, testCases[i].input);
      const expected = testCases[i].expectedOutput.trim();
      const actual = (result.output || '').trim();
      const passed = result.success && actual === expected;
      
      if (passed) passedTests++;
      
      testResults.push({
        testNumber: i + 1,
        passed,
        input: testCases[i].input,
        expected: testCases[i].expectedOutput,
        actual: result.output || result.error || 'No output',
        error: result.error
      });
    }

    responseText += `**Test Results: ${passedTests}/${testCases.length} passed**\n\n`;
    
    testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      responseText += `${status} **Test ${result.testNumber}**\n`;
      responseText += `Input: \`${result.input.replace(/\n/g, '\\n')}\`\n`;
      responseText += `Expected: \`${result.expected.replace(/\n/g, '\\n')}\`\n`;
      responseText += `Actual: \`${result.actual.replace(/\n/g, '\\n')}\`\n\n`;
    });

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
      data: {
        problemName,
        passed: passedTests,
        total: testCases.length,
        testResults
      }
    };
  }

  private async handleOptimizeCode(args: any) {
    const { code } = OptimizeCodeSchema.parse(args);
    
    let responseText = `**Code Optimization Analysis**\n\n`;
    responseText += `**Analysis:**\n`;
    responseText += `- Code received for optimization analysis\n`;
    responseText += `- Consider using efficient algorithms and data structures\n`;
    responseText += `- Check for unnecessary loops or redundant operations\n`;
    responseText += `- Use appropriate STL containers and algorithms\n\n`;
    responseText += `**Suggestions:**\n`;
    responseText += `- Profile with different input sizes\n`;
    responseText += `- Consider space-time tradeoffs\n`;
    responseText += `- Use fast I/O for competitive programming\n`;

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
    };
  }

  private async handleGenerateTestCases(args: any) {
    const { problemDescription, numTestCases = 5 } = args;
    
    let responseText = `**Generated Test Cases**\n\n`;
    responseText += `**Problem:** ${problemDescription}\n\n`;
    responseText += `**Test Cases:**\n\n`;

    for (let i = 1; i <= numTestCases; i++) {
      responseText += `**Test Case ${i}:**\n`;
      responseText += `Input: [Generate based on problem description]\n`;
      responseText += `Expected Output: [Calculate expected result]\n`;
      responseText += `Description: ${i === 1 ? 'Minimum case' : 
                                   i === numTestCases ? 'Maximum/Edge case' : 
                                   'Normal case'}\n\n`;
    }

    responseText += `**Note:** Please manually generate actual test cases based on the problem requirements.\n`;

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
    };
  }

  private async cleanup() {
    await this.executor.cleanup();
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const httpServer = this.app.listen(this.port, () => {
        console.log(`🚀 OnlineGDB MCP Server listening on port ${this.port}`);
        console.log(`📋 Available endpoints:`);
        console.log(`   GET  http://localhost:${this.port}/`);
        console.log(`   GET  http://localhost:${this.port}/tools/list`);
        console.log(`   POST http://localhost:${this.port}/mcp`);
        console.log(`   GET  http://localhost:${this.port}/health`);
        resolve();
      });
      
      httpServer.on('error', (err: Error) => {
        console.error(`❌ Failed to start server on port ${this.port}:`, err.message);
        reject(err);
      });
    });
  }
}

export { MCPServer };
