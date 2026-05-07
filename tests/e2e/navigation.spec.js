const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

test.describe('Screen-to-screen navigation', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
    await app.launch();
  });

  test('bottom nav has 4 items (Build, History, Library, Settings)', async ({ page }) => {
    const items = page.locator('#bottom-nav .nav-item');
    expect(await items.count()).toBe(4);

    const labels = [];
    for (let i = 0; i < 4; i++) {
      labels.push(await items.nth(i).locator('span').textContent());
    }
    expect(labels).toEqual(['Build', 'History', 'Library', 'Settings']);
  });

  test('clicking each nav item shows the correct screen', async ({ page }) => {
    const screens = [
      { nav: 'history', id: 'history' },
      { nav: 'library', id: 'library' },
      { nav: 'settings', id: 'settings' },
      { nav: 'setup', id: 'setup' },
    ];

    for (const { nav, id } of screens) {
      await page.click(`#bottom-nav .nav-item[data-screen="${nav}"]`);
      await page.waitForSelector(`#${id}.active`, { timeout: 5000 });
      expect(await app.activeScreen()).toBe(id);
    }
  });

  test('active nav item has .active class', async ({ page }) => {
    // On setup, Build should be active
    const buildItem = page.locator('#bottom-nav .nav-item[data-screen="setup"]');
    await expect(buildItem).toHaveClass(/active/);

    // Navigate to history
    await page.click('#bottom-nav .nav-item[data-screen="history"]');
    await page.waitForSelector('#history.active', { timeout: 5000 });
    const historyItem = page.locator('#bottom-nav .nav-item[data-screen="history"]');
    await expect(historyItem).toHaveClass(/active/);
    await expect(buildItem).not.toHaveClass(/active/);
  });

  test('nav is hidden on timer screen', async ({ page }) => {
    await app.selectType('hiit');
    await app.selectDuration('15');
    await app.generate();
    await app.startWorkout();

    const nav = page.locator('#bottom-nav');
    await expect(nav).not.toBeVisible();
  });

  test('nav is visible on setup screen', async ({ page }) => {
    const nav = page.locator('#bottom-nav');
    await expect(nav).toBeVisible();
  });
});
