import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:4173';
await mkdir('artifacts/responsive', { recursive: true });
const browser = await chromium.launch({ headless: true });
const issues = [];
const jwt = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: 'ui-test' })).toString('base64url'), 'ui-test'].join('.');
const assetOrigin = 'https://media.proppost-fixtures.invalid';
const imageUrl = `${assetOrigin}/property.svg`;
const logoUrl = `${assetOrigin}/logo.svg`;
const agentUrl = `${assetOrigin}/agent.svg`;
const images = {
  '/property.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" fill="#a6cad6"/><rect x="0" y="500" width="900" height="200" fill="#77a568"/><rect x="100" y="240" width="700" height="310" fill="#f3e7cf"/><path d="M65 260 L450 80 L835 260" fill="#594536"/><rect x="410" y="350" width="140" height="200" fill="#514f4e"/><rect x="185" y="330" width="150" height="100" fill="#436b82"/><rect x="640" y="330" width="110" height="100" fill="#436b82"/></svg>',
  '/logo.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="130"><rect width="360" height="130" rx="12" fill="#102f33"/><text x="180" y="77" text-anchor="middle" font-family="Arial" font-size="42" font-weight="bold" fill="#ffffff">TEST AGENCY</text></svg>',
  '/agent.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#ddedea"/><circle cx="80" cy="58" r="30" fill="#b18b70"/><path d="M20 160 C20 90 140 90 140 160" fill="#415e68"/></svg>'
};
const fixtureProperty = {
  id: 7, title: 'Spacious Three-Bedroom Townhouse With Landscaped Courtyard, Secure Parking and Exceptional Natural Light', price: 1850000, currency: 'ZAR', listing_type: 'sale',
  status: 'available', location_city: 'Kimberley', location_area: 'New Park',
  bedrooms: 3, bathrooms: 2, parking: 2, floor_size_m2: 140, short_description: 'Test home',
  images: [{ id: 1, property_id: 7, image_url: imageUrl, sort_order: 0, is_hero: true }], amenities: [], created_at: '2026-10-01', updated_at: '2026-10-01'
};
const routes = {
  '/api/properties': [fixtureProperty],
  '/api/properties/7/full': { ...fixtureProperty, defaults: { defaultSelectedImages: [imageUrl], defaultAmenitiesToShow: [], defaultHeadline: fixtureProperty.title, defaultCaption: 'Explore this townhouse' } },
  '/api/agents': [{
    id: 8, full_name: 'Sam Example', email: 'sam@example.invalid',
    cellphone_number: '082 000 0000', whatsapp_number: '27820000000',
    profile_photo_url: agentUrl, role_optional: 'Property Consultant'
  }],
  '/api/branding': [{
    id: 9, company_name: 'Test Agency', logo_url: logoUrl,
    primary_color_hex: '#126d62', secondary_color_hex: '#263d40',
    accent_color_hex: '#143c47', background_color_hex: '#ffffff',
    heading_font_family: 'Arial', body_font_family: 'Arial',
    website_url: 'example.invalid', default_cta_text: 'Book a viewing'
  }],
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
  await page.route(`${assetOrigin}/**`, async route => {
    const pathname = new URL(route.request().url()).pathname;
    const body = images[pathname];
    return route.fulfill({ status: body ? 200 : 404, body: body || 'Missing fixture', headers: {
      'content-type': 'image/svg+xml',
      'access-control-allow-origin': '*',
      'cross-origin-resource-policy': 'cross-origin'
    } });
  });
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
  // Property Marketing Studio: verify the three panels render without page overflow.
  await page.getByRole('button', { name: /^Create(?: post)?$/ }).first().click();
  await page.getByRole('heading', { name: 'Live branded draft' }).waitFor();
  await page.getByRole('heading', { name: 'Property details' }).waitFor();
  const flyer = page.locator('[data-testid="flyer-canvas"]');
  await page.getByLabel('Flyer layout').selectOption('classic');
  if (await flyer.getAttribute('data-layout') !== 'classic') issues.push(`${width}px: changing flyer layout did not update canvas`);
  await page.getByLabel('Preview format').selectOption('4:5');
  if (await flyer.getAttribute('data-format') !== '4:5') issues.push(`${width}px: changing format did not update canvas`);
  await page.getByLabel('Agency logo').uncheck();
  await page.getByLabel('Agent details').uncheck();
  await page.screenshot({ path: `artifacts/responsive/studio-${width}.png`, fullPage: true });
  const studioWidth = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  if (studioWidth.scroll > studioWidth.client + 1) issues.push(`${width}px: studio overflows horizontally by ${studioWidth.scroll - studioWidth.client}px`);
  if (width === 1440) {
    // Choose a real fixture through the guided flow. Then verify every format is a real download.
    await page.getByRole('button', { name: /Instagram.*Stories, Reels/i }).click();
    await page.getByRole('button', { name: /Post \(4:5\)/i }).click();
    await page.getByRole('button', { name: /Spacious Three-Bedroom Townhouse/i }).click();
    await page.getByText(/Spacious Three-Bedroom Townhouse/).first().waitFor();
    await page.getByLabel('Agency logo').check();
    await page.getByLabel('Agent details').check();
    await page.getByRole('button', { name: 'Select agent' }).click();
    await page.getByRole('button', { name: /Sam Example/i }).click();
    const flyer = page.locator('[data-testid="flyer-canvas"]');
    await flyer.getByAltText('Test Agency logo').waitFor();
    await flyer.getByAltText('Selected property').waitFor();
    await flyer.getByText('Sam Example').waitFor();
    for (const format of ['PNG', 'JPEG', 'PDF']) {
      const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
      await page.getByRole('button', { name: `Download flyer as ${format}` }).click();
      const download = await downloadPromise.catch(async error => {
        const status = await page.locator('[role="status"]').allTextContents();
        throw new Error(`No ${format} download: ${error.message}; UI status: ${status.join(' | ')}`);
      });
      const filename = download.suggestedFilename();
      const expected = format === 'JPEG' ? '.jpg' : `.${format.toLowerCase()}`;
      if (!filename.endsWith(expected)) issues.push(`Unexpected ${format} filename: ${filename}`);
      const failure = await download.failure();
      if (failure) issues.push(`${format} download failed: ${failure}`);
      const path = await download.path();
      const data = await (await import('node:fs/promises')).readFile(path);
      if (data.length < 100) issues.push(`${format} download unexpectedly small`);
      if (format === 'PNG' && (data[0] !== 137 || data.readUInt32BE(16) !== 1080 || data.readUInt32BE(20) !== 1350)) issues.push('PNG dimensions or signature incorrect');
      if (format === 'JPEG' && (data[0] !== 255 || data[1] !== 216)) issues.push('JPEG signature incorrect');
      if (format === 'PDF' && !data.subarray(0, 8).toString().startsWith('%PDF-1.4')) issues.push('PDF header incorrect');
    }
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
