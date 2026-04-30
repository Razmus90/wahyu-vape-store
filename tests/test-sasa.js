// Test Sasa chat flow - run with: node tests/test-sasa.js
require('dotenv').config({ path: __dirname + '/../.env' });

const { supabaseAdmin } = require('@/lib/supabase');
const { aiService } = require('@/lib/services/aiService');

async function testProductCache() {
  console.log('\n=== Testing product_cache ===');
  try {
    const { data, error, count } = await supabaseAdmin
      .from('product_cache')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('ERROR fetching products:', error.message);
      return false;
    }

    console.log(`Found ${count} products in product_cache`);
    if (data && data.length > 0) {
      console.log('Sample products:');
      data.slice(0, 3).forEach(p => {
        console.log(`  - ${p.name}: Rp${p.price}, stok ${p.stock}, ${p.klasifikasi || ''}`);
      });
      return true;
    } else {
      console.log('WARNING: product_cache is EMPTY!');
      return false;
    }
  } catch (err) {
    console.error('Exception:', err.message);
    return false;
  }
}

async function testChatSettings() {
  console.log('\n=== Testing chat_settings ===');
  try {
    const settings = await aiService.getSettings();
    if (!settings) {
      console.log('WARNING: No chat settings found!');
      return false;
    }
    console.log('Settings found:');
    console.log('  Provider:', settings.provider);
    console.log('  Model:', settings.model);
    console.log('  System prompt:', settings.system_prompt?.substring(0, 100) + '...');
    console.log('  Has API key:', !!(settings.encrypted_api_keys && Object.keys(settings.encrypted_api_keys).length > 0));
    return true;
  } catch (err) {
    console.error('ERROR:', err.message);
    return false;
  }
}

async function testGenerateResponse() {
  console.log('\n=== Testing generateResponse ===');
  try {
    const response = await aiService.generateResponse('apa saja pod yang tersedia?', 'test-session-123');
    console.log('AI Response:');
    console.log(response);
    return true;
  } catch (err) {
    console.error('ERROR:', err.message);
    return false;
  }
}

async function main() {
  console.log('=== Sasa Chat Debug Test ===');

  const hasProducts = await testProductCache();
  const hasSettings = await testChatSettings();

  if (hasProducts && hasSettings) {
    await testGenerateResponse();
  } else {
    console.log('\n=== ISSUES FOUND ===');
    if (!hasProducts) console.log('  - product_cache table is empty or missing');
    if (!hasSettings) console.log('  - chat_settings not configured');
    console.log('\nFix these issues first!');
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
