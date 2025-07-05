// test-mcp.js - Simple MCP protocol test
import { spawn } from 'child_process';

async function testMCPProtocol() {
    console.log('🧪 Testing MCP Protocol...\n');

    const server = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    server.stderr.on('data', (data) => {
        console.log('📝 Server:', data.toString().trim());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test initialize request
    const initRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            clientInfo: { name: "test-client", version: "1.0.0" }
        }
    };

    console.log('📤 Sending initialize request...');
    server.stdin.write(JSON.stringify(initRequest) + '\n');

    // Listen for response
    server.stdout.on('data', (data) => {
        console.log('📥 Server response:', data.toString().trim());
    });

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));

    server.kill();
    console.log('✅ Test completed');
}

testMCPProtocol().catch(console.error);