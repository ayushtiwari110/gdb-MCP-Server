# Claude.ai MCP Server Authentication Setup

## Quick Fix for Authentication Issues

Your MCP server was failing authentication with Claude.ai because it was missing required security features. Here's how to fix it:

### 1. Generate API Key

The server now automatically generates a secure API key when starting. Look for this in the console output:

```
🔑 Generated API Key: your-32-char-hex-key-here
⚠️  Set MCP_API_KEY environment variable to use a custom key
```

### 2. Set Environment Variables

On Render.com, set these environment variables:

- `MCP_API_KEY`: Your secure API key (32+ characters)
- `NODE_ENV`: `production`
- `PORT`: `3000` (or your preferred port)

### 3. Configure Claude.ai

When adding your MCP server to Claude.ai, use this format:

```json
{
  "mcpServers": {
    "onlinegdb-cpp": {
      "transport": {
        "type": "http",
        "url": "https://gdb-mcp-server.onrender.com/mcp"
      },
      "headers": {
        "x-api-key": "your-api-key-here"
      }
    }
  }
}
```

### 4. Test the Setup

1. **Test API Key Authentication:**
   ```bash
   curl -X POST https://gdb-mcp-server.onrender.com/mcp \
     -H "Content-Type: application/json" \
     -H "x-api-key: your-api-key-here" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}'
   ```

2. **Test Without API Key (should fail):**
   ```bash
   curl -X POST https://gdb-mcp-server.onrender.com/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}'
   ```

### 5. Security Features Added

✅ **API Key Authentication** - Required x-api-key header
✅ **Origin Validation** - Prevents DNS rebinding attacks  
✅ **Secure CORS** - Removed wildcard origins
✅ **Rate Limiting** - Protection against DoS attacks
✅ **Security Headers** - Added standard security headers
✅ **Input Validation** - Sanitized inputs and session IDs
✅ **Session Management** - Proper MCP session handling

### 6. Deployment Commands

```bash
# Install new dependencies
npm install

# Build with updated security
npm run build

# Deploy to Render (commit and push)
git add .
git commit -m "Add MCP authentication and security features"
git push origin main
```

### 7. Common Issues

**"Authentication required" Error:**
- Ensure you're passing the correct API key in the `x-api-key` header
- Check that the API key matches the one shown in your server logs

**"Invalid origin" Error:**
- Make sure you're accessing from claude.ai domain
- Check CORS configuration if using custom domains

**Rate Limiting:**
- Default: 100 requests per 15 minutes per IP
- Increase limits by setting environment variables if needed

### 8. Development vs Production

**Development:**
- Allows localhost origins
- Shows detailed error messages
- Uses generated API key

**Production:**
- Enforces HTTPS
- Restricts origins to claude.ai domains
- Hides sensitive error information
- Requires custom API key via environment variable