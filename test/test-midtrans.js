// test-midtrans.js
// Run: node test-midtrans.js
// Simple test for Midtrans Snap without TypeScript/Next.js dependencies

const fs = require('fs');
const path = require('path');

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

// Get Midtrans keys (sandbox or production)
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const serverKey = isProduction
  ? (process.env.MIDTRANS_SERVER_KEY || '')
  : (process.env.SANDBOX_MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY || '');
const clientKey = isProduction
  ? (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
  : (process.env.SANDBOX_MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_SANDBOX_MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');

console.log('Testing Midtrans Snap...');
console.log('Environment:', isProduction ? 'PRODUCTION' : 'SANDBOX');
console.log('Server key present:', !!serverKey);
console.log('Client key present:', !!clientKey, clientKey ? `(${clientKey.substring(0, 15)}...)` : '');
console.log('');

if (!serverKey) {
  console.error('ERROR: No server key found. Check .env file.');
  process.exit(1);
}

// Create Snap instance
const midtransClient = require('midtrans-client');
const snap = new midtransClient.Snap({
  isProduction: isProduction,
  serverKey: serverKey,
  clientKey: clientKey,
});

// Test transaction
const parameter = {
  transaction_details: {
    order_id: 'TEST-' + Date.now(),
    gross_amount: 10000,
  },
  customer_details: {
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '08111222333',
  },
};

console.log('Creating test transaction...');
snap.createTransaction(parameter)
  .then((transaction) => {
    console.log('\n✓ SUCCESS! Transaction created.');
    console.log('Token:', transaction.token);
    console.log('Redirect URL:', transaction.redirect_url);
    console.log('\nTest PASSED');
  })
  .catch((err) => {
    console.error('\n✗ FAILED:', err.message || err);
    console.log('\nTest FAILED');
    process.exit(1);
  });
