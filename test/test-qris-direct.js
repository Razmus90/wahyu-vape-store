// test-qris-direct.js
// Test Midtrans QRIS API directly (Core API /charge)
// Run: node test-qris-direct.js
// NO changes to project files - TEST ONLY

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env from project root
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('No .env file found');
    return;
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

loadEnv();

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const serverKey = isProduction
  ? (process.env.MIDTRANS_SERVER_KEY || '')
  : (process.env.SANDBOX_MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY || '');

console.log('=== Midtrans QRIS API Test ===');
console.log('Environment:', isProduction ? 'PRODUCTION' : 'SANDBOX');
console.log('Server key present:', !!serverKey);
console.log('');

if (!serverKey) {
  console.error('ERROR: No server key found');
  process.exit(1);
}

// Create Basic Auth header (server_key:)
const auth = Buffer.from(serverKey + ':').toString('base64');

const apiUrl = isProduction
  ? 'https://api.midtrans.com/v2/charge'
  : 'https://api.sandbox.midtrans.com/v2/charge';

const orderId = 'QRIS-DIRECT-' + Date.now();

const payload = JSON.stringify({
  payment_type: 'qris',
  transaction_details: {
    order_id: orderId,
    gross_amount: 10000,
  },
  customer_details: {
    first_name: 'Test',
    last_name: 'QRIS',
    email: 'test@example.com',
    phone: '08111222333',
  },
});

console.log('Endpoint:', apiUrl);
console.log('Order ID:', orderId);
console.log('Payload:', payload);
console.log('');
console.log('Sending request...');
console.log('');

const url = new URL(apiUrl);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Basic ' + auth,
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = https.request(options, (res) => {
  console.log('Response Status:', res.statusCode, res.statusMessage);
  console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
  console.log('');

  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response Body:');
    try {
      const result = JSON.parse(data);
      console.log(JSON.stringify(result, null, 2));
      console.log('');

      if (result.status_code === '201' || res.statusCode === 200 || res.statusCode === 201) {
        console.log('✓ SUCCESS!');
        console.log('Transaction ID:', result.transaction_id);
        console.log('Status:', result.transaction_status);
        console.log('Payment Type:', result.payment_type);
        if (result.qr_string) {
          console.log('QR String (first 50 chars):', result.qr_string.substring(0, 50) + '...');
        }
        if (result.actions) {
          console.log('Actions:');
          result.actions.forEach(a => console.log('  -', a.name, ':', a.url || a.message || ''));
        }
        console.log('');
        console.log('TEST PASSED');
      } else {
        console.log('✗ FAILED!');
        console.log('Status Code:', result.status_code);
        console.log('Status Message:', result.status_message);
        console.log('');
        if (result.status_code === '402') {
          console.log('REASON: Payment channel not activated in Midtrans dashboard.');
          console.log('FIX: Go to Midtrans sandbox dashboard → Settings → Payment Methods → Activate QRIS');
        }
        console.log('');
        console.log('TEST FAILED');
        process.exit(1);
      }
    } catch (e) {
      console.log('Raw response:', data);
      console.log('');
      console.log('TEST FAILED - Invalid JSON');
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('✗ Request failed:', err.message);
  console.log('');
  console.log('TEST FAILED');
  process.exit(1);
});

req.write(payload);
req.end();
