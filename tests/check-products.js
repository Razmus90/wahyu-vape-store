// Check if product_cache has data - run: node tests/check-products.js
require('dotenv').config({ path: __dirname + '/../.env' });

async function checkProducts() {
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Checking product_cache table...\n');

  // Check if table exists by selecting
  const { data, error, count } = await supabase
    .from('product_cache')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error) {
    console.error('ERROR:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\nFIX: Run this SQL in Supabase:');
      console.log('CREATE TABLE IF NOT EXISTS product_cache (...); -- see supabase/ directory');
    }
    return;
  }

  console.log(`Found ${count} products in product_cache\n`);

  if (data && data.length > 0) {
    console.log('Sample products:');
    data.forEach((p, i) => {
      console.log(`${i+1}. ${p.name} - Rp${p.price} (stok: ${p.stock})`);
    });
  } else {
    console.log('WARNING: product_cache is EMPTY!');
    console.log('FIX: Go to /admin/products and click "Sync from Olsera"');
  }
}

checkProducts().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
