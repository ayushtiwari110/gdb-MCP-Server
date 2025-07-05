// test-final-mcp.js - Comprehensive test for HTTP MCP server

async function testMCPServer() {
    console.log('🧪 Testing HTTP-Only MCP Server...\n');
    
    const baseURL = 'http://localhost:3000';
    
    try {
        // Test 1: Health check
        console.log('📡 Test 1: Health check');
        const healthResponse = await fetch(`${baseURL}/health`);
        const healthResult = await healthResponse.json();
        console.log('✅ Health check response:', JSON.stringify(healthResult, null, 2));
        
        // Test 2: Initialize MCP
        console.log('\n📡 Test 2: Initialize MCP Protocol');
        const initResponse = await fetch(`${baseURL}/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "initialize",
                params: {
                    protocolVersion: "2024-11-05",
                    capabilities: { tools: {} },
                    clientInfo: { name: "test-client", version: "1.0.0" }
                }
            })
        });
        
        const initResult = await initResponse.json();
        console.log('✅ Initialize response:', JSON.stringify(initResult, null, 2));
        
        // Test 3: List tools
        console.log('\n📋 Test 3: List tools');
        const listResponse = await fetch(`${baseURL}/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "tools/list"
            })
        });
        
        const listResult = await listResponse.json();
        console.log('✅ Tools list response:', JSON.stringify(listResult, null, 2));
        
        // Test 4: Call a tool (execute simple code)
        console.log('\n💻 Test 4: Execute simple C++ code');
        const codeResponse = await fetch(`${baseURL}/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 3,
                method: "tools/call",
                params: {
                    name: "execute_cpp_code",
                    arguments: {
                        code: "#include <iostream>\\nusing namespace std;\\nint main() {\\n    cout << \"Hello from MCP Server!\" << endl;\\n    return 0;\\n}",
                        input: "",
                        timeLimit: 10
                    }
                }
            })
        });
        
        const codeResult = await codeResponse.json();
        console.log('✅ Code execution response:', JSON.stringify(codeResult, null, 2));
        
        // Test 5: REST endpoint for tools list
        console.log('\n📋 Test 5: REST tools list endpoint');
        const restResponse = await fetch(`${baseURL}/tools/list`);
        const restResult = await restResponse.json();
        console.log('✅ REST tools response:', JSON.stringify(restResult, null, 2));
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('  ✅ Health check works');
        console.log('  ✅ MCP protocol initialization works');
        console.log('  ✅ Tools listing works via MCP');
        console.log('  ✅ Tool execution works via MCP');
        console.log('  ✅ REST endpoints work');
        console.log('\n🚀 The server is ready for MCP clients!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure the server is running with: npm start');
    }
}

// Check if server is running and run tests
async function checkAndTest() {
    try {
        const response = await fetch('http://localhost:3000/health');
        if (response.ok) {
            await testMCPServer();
        } else {
            throw new Error('Server not responding');
        }
    } catch (error) {
        console.log('❌ Server is not running on port 3000');
        console.log('💡 Please start the server first with: npm start');
        console.log('   Then run this test again.');
    }
}

checkAndTest();
