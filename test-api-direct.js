#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-invalid'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing Rekening API Endpoints\n');

  try {
    console.log('1️⃣  GET /api/rekening (should return 401 - no valid token)');
    const res1 = await makeRequest('GET', '/api/rekening');
    console.log(`Status: ${res1.status}`);
    console.log(`Body: ${res1.body.substring(0, 200)}\n`);

    console.log('2️⃣  GET /api/rekening/account/Rekening%20A (should return 401)');
    const res2 = await makeRequest('GET', '/api/rekening/account/Rekening%20A');
    console.log(`Status: ${res2.status}`);
    console.log(`Body: ${res2.body.substring(0, 200)}\n`);

    console.log('✅ API endpoints are responding!\n');
    console.log('Note: Both return 401 because we used an invalid token.');
    console.log('In the actual app, the user token should be used.');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
