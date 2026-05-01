import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:5173';

const pages = [
  { name: '01-home', path: '/', title: 'Dashboard' },
  { name: '02-transactions', path: '/transactions', title: 'Transactions' },
  { name: '03-transfers', path: '/transfers', title: 'Transfers' },
  { name: '04-accounts', path: '/accounts', title: 'Accounts' },
  { name: '05-categories', path: '/categories', title: 'Categories' },
  { name: '06-tags', path: '/tags', title: 'Tags' },
  { name: '07-settings', path: '/settings', title: 'Settings' },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Switch to Testing DB
console.log('Switching to Testing DB...');
await page.goto(`${BASE_URL}/settings`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);

const testingDbBtn = page.getByRole('button', { name: 'Use Testing DB' });
const isDisabled = await testingDbBtn.getAttribute('disabled');

if (isDisabled === null) {
  console.log('Clicking "Use Testing DB"...');
  await testingDbBtn.click();
  await page.waitForTimeout(5000);
  console.log('Testing DB activated and seeded.');
} else {
  console.log('Already on Testing DB.');
}

// Screenshot each page
for (const { name, path: pagePath, title } of pages) {
  console.log(`Screenshotting ${title}...`);
  await page.goto(`${BASE_URL}${pagePath}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // On Transfers, switch to Year view to show all seeded transfers
  if (pagePath === '/transfers') {
    try {
      // Click the readOnly Month input to open the dropdown
      await page.locator('input[readonly][value="Month"]').click({ timeout: 3000 });
      await page.waitForTimeout(400);
      await page.getByRole('option', { name: 'Year' }).click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      console.log('  Switched Transfers to Year view.');
    } catch {
      console.log('  Could not switch transfers to Year view.');
    }
  }

  // On Dashboard, click the eye icon to reveal charts and balance
  if (pagePath === '/') {
    const eyeOffBtn = page.locator('svg[class*="tabler-icon-eye-off"]').first().locator('..');
    try {
      await eyeOffBtn.click({ timeout: 3000 });
      console.log('  Revealed balance/charts.');
    } catch {
      try {
        await page.locator('text=Total Balance').locator('..').locator('button').click({ timeout: 2000 });
        console.log('  Revealed balance/charts (fallback).');
      } catch {
        console.log('  Could not find eye toggle, skipping reveal.');
      }
    }
    await page.waitForTimeout(2500);
  }

  const filePath = path.join(__dirname, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Saved: ${filePath}`);
}

await browser.close();
console.log('\nDone! All screenshots saved.');
