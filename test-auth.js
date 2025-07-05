#!/usr/bin/env node

// Test script to verify MCP server authentication
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const API_KEY = process.env.MCP_API_KEY || 'test-key';

async function testAuthentication() {
    console.log('🧪 Testing MCP Server Authentication');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const tests = [
        {
            name: 'Health Check (No Auth Required)',
            url: `${SERVER_URL}/health`,
            method: 'GET',
            headers: {},
            shouldPass: true
        },
        {
            name: 'MCP Initialize (No API Key)',
            url: `${SERVER_URL}/mcp`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    clientInfo: { name: 'test', version: '1.0.0' }
                }
            },
            shouldPass: false
        },
        {
            name: 'MCP Initialize (With API Key)',
            url: `${SERVER_URL}/mcp`,
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    clientInfo: { name: 'test', version: '1.0.0' }
                }
            },
            shouldPass: true
        },
        {
            name: 'Tools List (With API Key)',
            url: `${SERVER_URL}/mcp`,
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/list'
            },
            shouldPass: true
        },
        {
            name: 'Invalid Origin Test',
            url: `${SERVER_URL}/mcp`,
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'Origin': 'https://malicious-site.com'
            },
            body: {
                jsonrpc: '2.0',
                id: 3,
                method: 'tools/list'
            },
            shouldPass: false
        }
    ];

    for (const test of tests) {
        try {
            console.log(`\n🔍 ${test.name}`);
            
            const options = {
                method: test.method,
                headers: test.headers
            };

            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            const response = await fetch(test.url, options);
            const result = await response.json();

            if (test.shouldPass && response.ok) {
                console.log(`✅ PASS - Status: ${response.status}`);
                if (result.result) {
                    console.log(`   Result: ${JSON.stringify(result.result).substring(0, 100)}...`);
                }
            } else if (!test.shouldPass && !response.ok) {
                console.log(`✅ PASS - Correctly rejected with status: ${response.status}`);
                if (result.error) {
                    console.log(`   Error: ${result.error.message}`);
                }
            } else {
                console.log(`❌ FAIL - Expected ${test.shouldPass ? 'success' : 'failure'}, got status: ${response.status}`);
                console.log(`   Response: ${JSON.stringify(result)}`);
            }
        } catch (error) {
            console.log(`❌ ERROR - ${error.message}`);
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Test completed!');
}

// Run tests
testAuthentication().catch(console.error);