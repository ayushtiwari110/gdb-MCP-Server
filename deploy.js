#!/usr/bin/env node

// Simple deployment helper script
console.log('🚀 OnlineGDB MCP Server - Deployment Helper\n');

const deploymentOptions = [
  {
    name: 'Railway (Free)',
    url: 'https://railway.app',
    steps: [
      '1. Push your code to GitHub',
      '2. Go to railway.app and connect GitHub',
      '3. Deploy from repository',
      '4. Get your URL: https://your-app.railway.app/mcp'
    ],
    recommended: true
  },
  {
    name: 'Render (Free)',
    url: 'https://render.com',
    steps: [
      '1. Push your code to GitHub',
      '2. Go to render.com and connect GitHub',
      '3. Create new web service',
      '4. Build: npm install && npm run build',
      '5. Start: npm start'
    ]
  },
  {
    name: 'DigitalOcean ($5/month)',
    url: 'https://cloud.digitalocean.com/apps',
    steps: [
      '1. Push code to GitHub',
      '2. Create app on DigitalOcean',
      '3. Connect repository',
      '4. Configure build/run commands'
    ]
  }
];

console.log('📋 Available Deployment Options:\n');

deploymentOptions.forEach((option, index) => {
  const marker = option.recommended ? '🟢 (Recommended)' : '🔵';
  console.log(`${marker} ${option.name}`);
  console.log(`   URL: ${option.url}`);
  console.log('   Steps:');
  option.steps.forEach(step => console.log(`     ${step}`));
  console.log('');
});

console.log('💡 Quick Start with Railway:');
console.log('   1. git init && git add . && git commit -m "Deploy MCP server"');
console.log('   2. Push to GitHub');
console.log('   3. Go to railway.app → Deploy from GitHub');
console.log('   4. Test: curl https://your-app.railway.app/health');
console.log('');

console.log('🔧 Configure Claude Desktop:');
console.log('   File: %APPDATA%/Claude/claude_desktop_config.json (Windows)');
console.log('   File: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)');
console.log('');
console.log('   Content:');
console.log('   {');
console.log('     "mcpServers": {');
console.log('       "onlinegdb-cpp": {');
console.log('         "transport": {');
console.log('           "type": "http",');
console.log('           "url": "https://YOUR-DEPLOYED-URL.com/mcp"');
console.log('         }');
console.log('       }');
console.log('     }');
console.log('   }');
console.log('');

console.log('🎉 Your MCP server will then be ready to use with Claude!');
console.log('📖 For detailed instructions, see DEPLOYMENT.md');
