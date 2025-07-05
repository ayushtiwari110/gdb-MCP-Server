// Example: Function-only C++ submission with functionSignature

const functionOnlyCode = `
// Returns the sum of two integers
int sum(int a, int b) {
    return a + b;
}
`;

const functionSignature = 'int sum(int a, int b)';
const input = '5 7';

const executeFunctionOnlyRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "execute_cpp_code",
    arguments: {
      code: functionOnlyCode,
      input: input,
      timeLimit: 10,
      functionSignature: functionSignature
    }
  }
};

console.log('Function-only submission request example:');
console.log(JSON.stringify(executeFunctionOnlyRequest, null, 2));

// To use: send this request to the MCP server's stdin (see comprehensive-test.js for how to automate this)
