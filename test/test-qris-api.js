// test-qris-api.js
// Test Midtrans QRIS API directly (Core API / Charge)
// Run: node test-qris-api.js

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env file from project root
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('No .env file found at project root');
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

// Get Midtrans keys
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const serverKey = isProduction
  ? (process.env.MIDTRANS_SERVER_KEY || '')
  : (process.env.SANDBOX_MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY || '');

console.log('Testing Midtrans QRIS API (Core API)...');
console.log('Environment:', isProduction ? 'PRODUCTION' : 'SANDBOX');
console.log('Server key present:', !!serverKey);
console.log('');

if (!serverKey) {
  console.error('ERROR: No server key found. Check .env file.');
  process.exit(1);
}

// Create Basic Auth header
const auth = Buffer.from(serverKey + ':').toString('base64');
const apiUrl = isProduction
  ? 'https://api.midtrans.com/v2/charge'
  : 'https://api.sandbox.midtrans.com/v2/charge';

const orderId = 'QRIS-TEST-' + Date.now();
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

console.log('Creating QRIS transaction...');
console.log('Endpoint:', apiUrl);
console.log('Order ID:', orderId);
console.log('');

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Basic ' + auth,
  },
};

const req = https.request(apiUrl, options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    try {
      const result = JSON.parse(data);
      console.log('\n✓ Response received:');
      console.log('Status:', result.status_code, result.status_message);
      console.log('Transaction ID:', result.transaction_id);
      console.log('Order ID:', result.order_id);
      console.log('Gross Amount:', result.gross_amount);
      console.log('Payment Type:', result.payment_type);
      console.log('Transaction Status:', result.transaction_status);

      if (result.qr_string) {
        console.log('\n✓ QR String received!');
        console.log('QR String (first 50 chars):', result.qr_string.substring(0, 50) + '...');
      }

      if (result.actions && result.actions.length > 0) {
        console.log('\n✓ Actions available:');
        result.actions.forEach((action) => {
          console.log('-', action.name, ':', action.method, action.url ? action.url.substring(0, 60) + '...' : '');
        });
      }

      console.log('\nTest PASSED - QRIS API works!');
    } catch (e) {
      console.error('Failed to parse response:', data);
      console.log('\nTest FAILED');
    }
  });
});

req.on('error', (err) => {
  console.error('\n✗ Request failed:', err.message);
  console.log('\nTest FAILED');
  process.exit(1);
});

req.write(payload);
req.end();
