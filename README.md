# OnlineGDB MCP Server for C++ Code Execution

A **HTTP-based** Model Context Protocol (MCP) server that enables AI agents to execute C++ code using OnlineGDB's online compiler. Perfect for solving Data Structures and Algorithms (DSA) problems from competitive programming sites like Codeforces, LeetCode, etc.

> **Note**: This server uses HTTP transport instead of STDIO for better reliability and easier integration.

## Features

### Core Functionality
- **Execute C++ Code**: Run C++ code with custom input using OnlineGDB compiler
- **Submit Solutions**: Test complete solutions against multiple test cases
- **Code Optimization**: Analyze code for performance improvements
- **Test Case Generation**: Generate comprehensive test cases for problems

### Agent Capabilities
- **Self-Correction**: Agent can execute code, see errors, and iterate on solutions
- **Multiple Test Cases**: Validate solutions against various inputs
- **Performance Analysis**: Get execution time and memory usage feedback
- **Error Handling**: Detailed compilation and runtime error reporting

## Installation

1. **Clone and Setup**
```bash
git clone <repository-url>
cd onlinegdb-mcp-server
npm install
```

2. **Build the Project**
```bash
npm run build
```

3. **Install Dependencies**
The server requires Puppeteer for browser automation:
```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y wget gnupg ca-certificates procps libxss1
sudo apt-get install -y libgconf-2-4 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 libdrm2 libxkbcommon0 libgtk-3-0

# On macOS (using Homebrew)
brew install chromium

# On Windows
# Puppeteer will download Chromium automatically
```

## Usage

### Starting the Server
```bash
# Build the project first
npm run build

# Start the HTTP MCP server
npm start
```

The server will start on port 3000 (or PORT environment variable) and provide:
- **HTTP MCP Protocol endpoint**: `POST /mcp`
- **REST API endpoints**: `GET /tools/list`, `GET /health`
- **Web interface**: `GET /`

### Available Tools

#### 1. execute_cpp_code
Execute C++ code with optional input:

```json
{
  "name": "execute_cpp_code",
  "arguments": {
    "code": "#include<iostream>\nusing namespace std;\nint main(){\n    int n;\n    cin >> n;\n    cout << n * 2 << endl;\n    return 0;\n}",
    "input": "5",
    "timeLimit": 5
  }
}
```

#### 2. submit_solution
Test a complete solution against multiple test cases:

```json
{
  "name": "submit_solution",
  "arguments": {
    "problemName": "Two Sum",
    "code": "C++ solution code here",
    "testCases": [
      {
        "input": "4\n2 7 11 15\n9",
        "expectedOutput": "0 1"
      },
      {
        "input": "3\n3 2 4\n6",
        "expectedOutput": "1 2"
      }
    ],
    "functionSignature": "vector<int> twoSum(vector<int>& nums, int target)"
  }
}
```

#### 3. optimize_code
Analyze code for performance improvements:

```json
{
  "name": "optimize_code",
  "arguments": {
    "code": "C++ code to analyze",
    "constraints": {
      "timeComplexity": "O(n log n)",
      "spaceComplexity": "O(1)",
      "memoryLimit": "256MB"
    }
  }
}
```

#### 4. generate_test_cases
Generate test cases for a problem:

```json
{
  "name": "generate_test_cases",
  "arguments": {
    "problemDescription": "Find the maximum subarray sum",
    "constraints": "1 ≤ n ≤ 10^5, -10^9 ≤ arr[i] ≤ 10^9",
    "numTestCases": 5
  }
}
```

## Integration with AI Agents

### Claude MCP Configuration
Add to your Claude MCP configuration (use HTTP transport instead of STDIO):

**Option 1: HTTP Transport (Recommended)**
```json
{
  "mcpServers": {
    "onlinegdb-cpp": {
      "transport": {
        "type": "http",
        "url": "http://localhost:3000/mcp"
      }
    }
  }
}
```

**Option 2: Direct HTTP calls in your MCP client**
```javascript
// Make direct HTTP requests to the MCP endpoints
fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  })
})
```

### Agent Workflow Example

1. **Problem Analysis**: Agent receives a coding problem
2. **Solution Development**: Agent writes initial C++ solution
3. **Code Execution**: Agent uses `execute_cpp_code` to test basic functionality
4. **Comprehensive Testing**: Agent uses `submit_solution` with multiple test cases
5. **Error Analysis**: If tests fail, agent analyzes errors and iterates
6. **Optimization**: Agent uses `optimize_code` to improve performance
7. **Final Validation**: Agent runs final solution against all test cases

### Example Agent Conversation

```
Human: Solve this problem: Given an array of integers, find two numbers that add up to a target sum.

Agent: I'll solve this step by step using the OnlineGDB MCP server.

First, let me implement a basic two-sum solution:

[Uses execute_cpp_code to test basic logic]

Now let me test it against multiple test cases:

[Uses submit_solution with comprehensive test cases]

The solution passed 4/5 test cases. Let me analyze the failure and optimize:

[Uses optimize_code to identify issues]

[Iterates and re-tests until all test cases pass]
```

## Code Templates

### Basic C++ Template for Competitive Programming
```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <cmath>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Your code here

    return 0;
}
```

### Function-Based Template
```cpp
#include <iostream>
#include <vector>
using namespace std;

// Function signature here
vector<int> solve(vector<int>& arr, int target) {
    // Implementation
    return {};
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Input parsing
    int n, target;
    cin >> n >> target;
    vector<int> arr(n);
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }

    // Call solution function
    vector<int> result = solve(arr, target);

    // Output formatting
    for(int i = 0; i < result.size(); i++) {
        cout << result[i];
        if(i < result.size() - 1) cout << " ";
    }
    cout << endl;

    return 0;
}
```

## Testing

### Run Comprehensive Tests
```bash
# Start the server in one terminal
npm start

# Run tests in another terminal
node test-final-mcp.js

# Or use the npm script
npm run test:mcp
```

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test MCP initialize
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}'

# Test tools list
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if port 3000 is already in use
   - Set PORT environment variable: `PORT=3001 npm start`
   - Ensure dependencies are installed: `npm install`

2. **Puppeteer Installation Fails**
   - Ensure you have the required system dependencies
   - Try `npm install puppeteer --unsafe-perm=true`

3. **OnlineGDB Not Loading**
   - Check internet connection
   - OnlineGDB might be temporarily unavailable
   - Try increasing timeout limits

4. **Code Execution Timeouts**
   - Increase `timeLimit` parameter
   - Check for
