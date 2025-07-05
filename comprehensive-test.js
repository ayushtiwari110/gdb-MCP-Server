// comprehensive-test.js
import { spawn } from 'child_process';

class MCPTester {
  constructor() {
    this.process = null;
    this.requestId = 1;
  }

  async start() {
    return new Promise((resolve) => {
      this.process = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stderr.on('data', (data) => {
        console.log('📝 Server Log:', data.toString().trim());
      });

      // Give server time to start
      setTimeout(resolve, 1000);
    });
  }

  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      let responseData = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout after 60 seconds'));
      }, 60000);

      const dataHandler = (data) => {
        responseData += data.toString();
        try {
          const response = JSON.parse(responseData.trim());
          clearTimeout(timeout);
          this.process.stdout.off('data', dataHandler);
          resolve(response);
        } catch (e) {
          // Continue collecting data
        }
      };

      this.process.stdout.on('data', dataHandler);
      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async testCodeExecution() {
    console.log('💻 Testing C++ Code Execution with OnlineGDB...\n');

    // Test 1: Simple Hello World
    console.log('Test 1: Hello World');
    const helloCode = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from OnlineGDB!" << endl;
    return 0;
}`;

    try {
      const response1 = await this.sendRequest({
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "tools/call",
        params: {
          name: "execute_cpp_code",
          arguments: {
            code: helloCode,
            input: "",
            timeLimit: 15
          }
        }
      });

      console.log('📤 Response:', JSON.stringify(response1, null, 2));
      console.log('✅ Hello World test completed\n');

    } catch (error) {
      console.log('❌ Hello World test failed:', error.message);
    }

    // Test 2: Code with Input
    console.log('Test 2: Code with Input Processing');
    const inputCode = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << "Sum: " << (a + b) << endl;
    cout << "Product: " << (a * b) << endl;
    return 0;
}`;

    try {
      const response2 = await this.sendRequest({
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "tools/call",
        params: {
          name: "execute_cpp_code",
          arguments: {
            code: inputCode,
            input: "5 3",
            timeLimit: 15
          }
        }
      });

      console.log('📤 Response:', JSON.stringify(response2, null, 2));
      console.log('✅ Input processing test completed\n');

    } catch (error) {
      console.log('❌ Input processing test failed:', error.message);
    }

    // Test 3: Compilation Error
    console.log('Test 3: Compilation Error Handling');
    const buggyCode = `#include <iostream>
using namespace std;

int main() {
    int x = 5
    cout << x << endl;  // Missing semicolon
    return 0;
}`;

    try {
      const response3 = await this.sendRequest({
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "tools/call",
        params: {
          name: "execute_cpp_code",
          arguments: {
            code: buggyCode,
            input: "",
            timeLimit: 10
          }
        }
      });

      console.log('📤 Response:', JSON.stringify(response3, null, 2));
      console.log('✅ Error handling test completed\n');

    } catch (error) {
      console.log('❌ Error handling test failed:', error.message);
    }

    // Test 4: Solution Submission
    console.log('Test 4: Solution Submission with Multiple Test Cases');
    const solutionCode = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    cin >> n;
    vector<int> arr(n);
    
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    int maxVal = arr[0];
    for(int i = 1; i < n; i++) {
        if(arr[i] > maxVal) {
            maxVal = arr[i];
        }
    }
    
    cout << maxVal << endl;
    return 0;
}`;

    const testCases = [
      {
        input: "5\n1 3 7 2 9",
        expectedOutput: "9"
      },
      {
        input: "3\n-1 -5 -3",
        expectedOutput: "-1"
      },
      {
        input: "1\n42",
        expectedOutput: "42"
      }
    ];

    try {
      const response4 = await this.sendRequest({
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "tools/call",
        params: {
          name: "submit_solution",
          arguments: {
            problemName: "Find Maximum Element",
            code: solutionCode,
            testCases: testCases
          }
        }
      });

      console.log('📤 Response:', JSON.stringify(response4, null, 2));
      console.log('✅ Solution submission test completed\n');

    } catch (error) {
      console.log('❌ Solution submission test failed:', error.message);
    }
  }

  close() {
    if (this.process) {
      this.process.kill();
    }
  }
}

async function runComprehensiveTests() {
  const tester = new MCPTester();
  
  try {
    console.log('🚀 Starting Comprehensive MCP Server Tests...\n');
    
    await tester.start();
    console.log('✅ Server started successfully\n');

    await tester.testCodeExecution();
    
    console.log('🎉 All comprehensive tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    tester.close();
  }
}

runComprehensiveTests().catch(console.error);