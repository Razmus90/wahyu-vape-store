// Debug chatService directly
require('dotenv').config({ path: __dirname + '/../.env' });

// Need to set up ts-node or just test the API endpoint
// Let's test via HTTP instead

const http = require('http');

function testChat() {
  const data = JSON.stringify({
    message: 'halo',
    sessionToken: undefined
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
      try {
        const parsed = JSON.parse(body);
        console.log('Parsed:', JSON.stringify(parsed, null, 2);
      } catch (e) {
        console.error('Failed to parse response');
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.write(data);
  req.end();
}

console.log('Testing chat API...');
testChat();
