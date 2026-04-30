// Debug chat API - run with: node tests/debug-chat-api.js
require('dotenv').config({ path: '.env' });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testChatAPI() {
  console.log('Testing chat API at:', baseUrl + '/api/chat');

  try {
    const res = await fetch(baseUrl + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'halo', sessionToken: undefined }),
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!data.success) {
      console.error('API returned error:', data.error);
    } else {
      console.log('SUCCESS! Reply:', data.data.reply);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testChatAPI();
