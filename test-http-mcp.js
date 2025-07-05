// test-http-mcp.js - Test HTTP MCP server
import fetch from 'node-fetch';

async function testHTTPMCP() {
    console.log('🧪 Testing HTTP MCP Server...\n');
    
    const baseURL = 'http://localhost:3000';
    
    // Test 1: Initialize
    console.log('📡 Test 1: Initialize request');
    const initResponse = await fetch(`${baseURL}/mcp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'MCP-Client/1.0.0'
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
    console.log('📥 Initialize response:', JSON.stringify(initResult, null, 2));
    
    // Test 2: List tools
    console.log('\n📋 Test 2: List tools');
    const listResponse = await fetch(`${baseURL}/mcp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'MCP-Client/1.0.0'
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/list"
        })
    });
    
    const listResult = await listResponse.json();
    console.log('📥 Tools list response:', JSON.stringify(listResult, null, 2));
    
    console.log('\n✅ HTTP MCP tests completed');
}

testHTTPMCP().catch(console.error);