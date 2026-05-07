const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

test.describe('Responsive layout - iPhone SE (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('setup screen renders without horizontal scrollbar and nav fits', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const app = new App(page);
    await app.launch();

    const screen = await app.activeScreen();
    expect(screen).toBe('setup');

    // Verify no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    // Verify key elements are visible
    await expect(page.locator('#type-pills')).toBeVisible();
    await expect(page.locator('#generate-btn, [onclick*="generateWorkout"]').first()).toBeVisible();
    await expect(page.locator('nav, .nav-bar, .bottom-nav').first()).toBeVisible();

    expect(errors.length).toBe(0);
  });
});

test.describe('Responsive layout - iPhone 15 Pro (393x852)', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('standard layout works', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const app = new App(page);
    await app.launch();

    const screen = await app.activeScreen();
    expect(screen).toBe('setup');

    await expect(page.locator('#type-pills')).toBeVisible();
    await expect(page.locator('#duration-pills')).toBeVisible();
    await expect(page.locator('#generate-btn, [onclick*="generateWorkout"]').first()).toBeVisible();

    expect(errors.length).toBe(0);
  });
});

test.describe('Responsive layout - iPhone 15 Pro Max (430x932)', () => {
  test.use({ viewport: { width: 430, height: 932 } });

  test('large layout works', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const app = new App(page);
    await app.launch();

    const screen = await app.activeScreen();
    expect(screen).toBe('setup');

    await expect(page.locator('#type-pills')).toBeVisible();
    await expect(page.locator('#generate-btn, [onclick*="generateWorkout"]').first()).toBeVisible();
    await expect(page.locator('nav, .nav-bar, .bottom-nav').first()).toBeVisible();

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    expect(errors.length).toBe(0);
  });
});

test.describe('Responsive layout - iPad (768x1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('tablet layout works', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const app = new App(page);
    await app.launch();

    const screen = await app.activeScreen();
    expect(screen).toBe('setup');

    await expect(page.locator('#type-pills')).toBeVisible();
    await expect(page.locator('#duration-pills')).toBeVisible();
    await expect(page.locator('#generate-btn, [onclick*="generateWorkout"]').first()).toBeVisible();

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    expect(errors.length).toBe(0);
  });
});

test.describe('Responsive layout - No JS errors across viewports', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 15 Pro', width: 393, height: 852 },
    { name: 'iPhone 15 Pro Max', width: 430, height: 932 },
    { name: 'iPad', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    test(`no JS errors on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      const app = new App(page);
      await app.launch();

      // Navigate through screens to exercise layout code
      await app.selectType('strength');
      await app.selectDuration('20');
      await app.generate();
      await app.navTo('setup');
      await app.navTo('history');
      await app.navTo('library');
      await app.navTo('settings');

      expect(errors).toEqual([]);
    });
  }
});
