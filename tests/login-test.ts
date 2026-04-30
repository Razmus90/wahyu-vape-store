import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  // Listen to network responses
  page.on('response', async response => {
    if (response.url().includes('/api/admin/login')) {
      const status = response.status();
      const body = await response.text();
      console.log(`LOGIN API: ${status} ${body}`);
    }
  });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/admin/login');

  // Wait for form to appear
  await page.waitForSelector('input[type="text"]');

  console.log('Filling credentials...');
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');

  console.log('Clicking login...');
  await page.click('button[type="submit"]');

  // Wait for navigation or error
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log(`Current URL: ${url}`);

  if (url.includes('/admin') && !url.includes('/login')) {
    console.log('SUCCESS: Redirected to admin dashboard');
  } else {
    console.log('FAIL: Still on login page or other URL');
    // Check for error message
    const errorText = await page.$eval('.text-red-400', el => el.textContent).catch(() => null);
    console.log(`Error message: ${errorText}`);
    // Take screenshot
    await page.screenshot({ path: 'login-failure.png' });
    console.log('Screenshot saved as login-failure.png');
  }

  // Check cookies
  const cookies = await context.cookies();
  console.log('Cookies:', cookies);

  // Check localStorage
  const localToken = await page.evaluate(() => localStorage.getItem('admin_token'));
  console.log(`localStorage admin_token: ${localToken ? 'present' : 'missing'}`);

  await browser.close();
})();
