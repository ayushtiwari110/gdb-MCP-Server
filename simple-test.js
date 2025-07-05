// simple-test.js - Simple test for Replit
import { spawn } from 'child_process';

async function testMCPServer() {
    console.log('🧪 Testing MCP Server in Replit...\n');

    // Start the MCP server
    const server = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle server output
    server.stdout.on('data', (data) => {
        console.log('📤 Server Response:', data.toString());
    });

    server.stderr.on('data', (data) => {
        console.log('📝 Server Log:', data.toString());
    });

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Initialize
    console.log('📡 Test 1: Initializing...');
    const initRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            clientInfo: { name: "replit-test", version: "1.0.0" }
        }
    };
    server.stdin.write(JSON.stringify(initRequest) + '\n');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: List tools
    console.log('📋 Test 2: Listing tools...');
    const listRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list"
    };
    server.stdin.write(JSON.stringify(listRequest) + '\n');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Execute simple code
    console.log('💻 Test 3: Executing Hello World...');
    const codeRequest = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
            name: "execute_cpp_code",
            arguments: {
                code: "#include <iostream>\\nusing namespace std;\\nint main() {\\n    cout << \"Hello from Replit!\" << endl;\\n    return 0;\\n}",
                input: "",
                timeLimit: 10
            }
        }
    };
    server.stdin.write(JSON.stringify(codeRequest) + '\n');

    // Wait for execution
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Clean up
    server.kill();
    console.log('✅ Test completed!');
}

testMCPServer().catch(console.error);