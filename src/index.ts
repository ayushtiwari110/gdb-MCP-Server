#!/usr/bin/env node

import { MCPServer } from './server.js';

async function main() {
  console.log('🚀 Starting OnlineGDB MCP Server...');
  
  const port = parseInt(process.env.PORT || '3000');
  const server = new MCPServer(port);
  
  try {
    await server.start();
    console.log('✅ Server started successfully!');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});


export { MCPServer };
