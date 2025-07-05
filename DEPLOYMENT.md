# 🚀 Deployment Guide for OnlineGDB MCP Server

This guide provides multiple options to deploy your MCP server publicly so you can use it with Claude and other applications.

## 📋 **Quick Deployment Options**

### 🟢 **Option 1: Railway (Recommended - Free)**

Railway is the easiest option with automatic GitHub integration.

#### Steps:
1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect and deploy

3. **Get Your URL:**
   - Railway provides a URL like: `https://your-app-name.railway.app`
   - Your MCP endpoint: `https://your-app-name.railway.app/mcp`

#### ✅ **Pros:** Free, automatic deployments, easy setup
#### ❌ **Cons:** Limited to 500 hours/month on free plan

---

### 🟢 **Option 2: Render (Free Alternative)**

#### Steps:
1. **Push to GitHub** (same as above)

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account
   - Click "New Web Service"
   - Select your repository
   - Use these settings:
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Environment:** Node

3. **Get Your URL:**
   - Render provides: `https://your-app-name.onrender.com`
   - Your MCP endpoint: `https://your-app-name.onrender.com/mcp`

#### ✅ **Pros:** Free, reliable, good performance
#### ❌ **Cons:** Spins down after 15 minutes of inactivity (free tier)

---

### 🟡 **Option 3: Heroku (Paid)**

#### Steps:
1. **Install Heroku CLI:**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Deploy:**
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

3. **Configure:**
   ```bash
   heroku config:set NODE_ENV=production
   ```

#### ✅ **Pros:** Professional, reliable, good documentation
#### ❌ **Cons:** No longer has free tier

---

### 🔵 **Option 4: DigitalOcean App Platform**

#### Steps:
1. **Push to GitHub**
2. **Create App on DigitalOcean:**
   - Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Connect GitHub repository
   - Configure:
     - **Build Command:** `npm run build`
     - **Run Command:** `npm start`

#### ✅ **Pros:** $5/month, good performance, professional
#### ❌ **Cons:** Requires payment

---

### 🟣 **Option 5: Docker + Any Cloud Provider**

#### Local Testing:
```bash
# Build and run with Docker
docker-compose up --build

# Test
curl http://localhost:3000/health
```

#### Deploy to:
- **Google Cloud Run**
- **AWS ECS/Fargate**
- **Azure Container Instances**
- **DigitalOcean Container Registry**

---

## 🛠 **Using Your Deployed Server**

### **1. For Claude Desktop**

Update your Claude configuration file:

**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "onlinegdb-cpp": {
      "transport": {
        "type": "http",
        "url": "https://your-deployed-url.com/mcp"
      }
    }
  }
}
```

### **2. For Web Applications**

```javascript
// Direct HTTP calls to your deployed server
const response = await fetch('https://your-deployed-url.com/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  })
});
```

### **3. For Other MCP Clients**

Use the HTTP transport configuration:
```json
{
  "transport": {
    "type": "http",
    "url": "https://your-deployed-url.com/mcp"
  }
}
```

---

## 🔒 **Production Security (Optional)**

### **Add API Key Authentication**

Create `.env` file:
```env
MCP_AUTH_TOKEN=your-secret-api-key-here
NODE_ENV=production
PORT=3000
```

Update your server configuration to require the token:
```json
{
  "mcpServers": {
    "onlinegdb-cpp": {
      "transport": {
        "type": "http",
        "url": "https://your-deployed-url.com/mcp",
        "headers": {
          "Authorization": "Bearer your-secret-api-key-here"
        }
      }
    }
  }
}
```

---

## 🧪 **Testing Your Deployment**

### **Health Check**
```bash
curl https://your-deployed-url.com/health
```

### **MCP Protocol Test**
```bash
curl -X POST https://your-deployed-url.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

### **Tools List**
```bash
curl -X POST https://your-deployed-url.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

---

## 📊 **Monitoring & Maintenance**

### **Logs**
- **Railway:** Dashboard → Deployments → Logs
- **Render:** Dashboard → Logs
- **Heroku:** `heroku logs --tail`

### **Health Monitoring**
All platforms provide built-in monitoring. The server includes:
- Health check endpoint: `/health`
- Automatic error handling
- Graceful shutdown

### **Updates**
- **Railway/Render:** Auto-deploy on git push
- **Docker:** Rebuild and redeploy container
- **Heroku:** `git push heroku main`

---

## 🏆 **Recommended Deployment Flow**

### **For Quick Testing:**
1. Start with **Railway** (free, instant)
2. Test with Claude Desktop
3. Verify all tools work

### **For Production:**
1. Use **DigitalOcean** or **Render Pro**
2. Add authentication
3. Set up monitoring
4. Configure custom domain

### **For Enterprise:**
1. Use **Docker** + **AWS/GCP/Azure**
2. Add load balancing
3. Set up CI/CD pipeline
4. Implement logging and metrics

---

## ⚡ **Quick Start (Railway)**

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Deploy MCP server"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main

# 2. Go to railway.app
# 3. Deploy from GitHub repo
# 4. Get your URL: https://your-app.railway.app

# 5. Test immediately:
curl https://your-app.railway.app/health
```

**Your MCP server is now live and ready to use with Claude! 🎉**
