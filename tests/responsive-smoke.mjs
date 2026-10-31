import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:4173';
await mkdir('artifacts/responsive', { recursive: true });
const browser = await chromium.launch({ headless: true });
const issues = [];
const jwt = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: 'ui-test' })).toString('base64url'), 'ui-test'].join('.');
const routes = {
  '/api/properties': [],
  '/api/agents': [],
  '/api/branding': [],
  '/api/amenities': [],
  '/api/history': [],
  '/api/scheduled_posts': [],
  '/api/analytics/dashboard': {
    stats: { totalProperties: 8, activeCampaigns: 3, totalLeads: 12, scheduledPosts: 2 },
    topProperties: [], leadsPerAgent: [], recentActivity: []
  }
};
async function prepare(page, failed = false) {
  await page.addInitScript(({ token }) => {
    localStorage.setItem('proppost_token', token);
    localStorage.setItem('proppost_user', JSON.stringify({ id: 100, name: 'Test Agent', email: 'testing@example.invalid', role: 'admin' }));
  }, { token: jwt });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (failed) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Unavailable test fixture' }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(routes[path] ?? []) });
  });
}
async function testWidth(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await prepare(page);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Your marketing, in one place.' }).waitFor();
  await page.screenshot({ path: `artifacts/responsive/dashboard-${width}.png`, fullPage: true });
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  if (widths.scroll > widths.client + 1) issues.push(`${width}px: document overflows horizontally by ${widths.scroll - widths.client}px`);
  if (width < 768) {
    const open = page.getByRole('button', { name: 'Open navigation' });
    if (!(await open.isVisible())) issues.push(`${width}px: mobile menu button missing`);
    await open.click();
    const navigation = page.getByRole('navigation', { name: 'Workspace sections' });
    await navigation.getByRole('button', { name: 'Agents' }).click();
    await page.getByText('Workspace / PropPost').waitFor();
    await page.waitForFunction(() => document.querySelector('[aria-label="Open navigation"]')?.getAttribute('aria-expanded') === 'false');
    await open.click();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('[aria-label="Open navigation"]')?.getAttribute('aria-expanded') === 'false');
    await open.click();
    await navigation.getByRole('button', { name: 'Dashboard' }).click();
  } else {
    const collapse = page.getByRole('button', { name: 'Collapse sidebar' });
    await collapse.click();
    if (!(await page.getByRole('button', { name: 'Expand sidebar' }).isVisible())) issues.push(`${width}px: sidebar did not collapse`);
    await page.getByRole('button', { name: 'Expand sidebar' }).click();
  }
  if (errors.length) issues.push(`${width}px: runtime errors: ${errors.join('; ')}`);
  await context.close();
}
try {
  for (const [width, height] of [[375, 812], [768, 1024], [1440, 900]]) await testWidth(width, height);
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await prepare(page, true);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('alert').getByText('Dashboard data is unavailable').waitFor();
  await page.screenshot({ path: 'artifacts/responsive/dashboard-api-error-375.png', fullPage: true });
  await context.close();
} catch (error) {
  issues.push(String(error?.stack || error));
} finally {
  await browser.close();
}
if (issues.length) {
  for (const issue of issues) console.error(issue);
  process.exitCode = 1;
} else {
  console.log('Responsive smoke test passed at 375px, 768px and 1440px, including navigation, overflow, runtime, and API failure.');
}
