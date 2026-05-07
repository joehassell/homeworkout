const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

test.describe('Library screen', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
    await app.launch();
  });

  test('navigate to library, screen is active', async () => {
    await app.navTo('library');
    expect(await app.activeScreen()).toBe('library');
  });

  test('tab navigation switches panels — exercises tab shows exercises panel', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    const exercisesPanel = page.locator('#lib-exercises');
    await expect(exercisesPanel).toBeVisible();
  });

  test('exercise library search input exists', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    const search = page.locator('#exlib-search');
    await expect(search).toBeVisible();
  });

  test('typing in search filters the exercise list', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    await page.waitForSelector('#exlib-list .exlib-item', { state: 'attached', timeout: 5000 });
    await page.fill('#exlib-search', 'squat');
    // Wait for filter to take effect
    await page.waitForTimeout(300);
    const cards = page.locator('#exlib-list .exlib-item');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = (await cards.nth(i).textContent()).toLowerCase();
      expect(text).toContain('squat');
    }
  });

  test('body region filter pills exist', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    const filters = page.locator('#exlib-body-filters .exlib-filter-pill');
    const count = await filters.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const texts = [];
    for (let i = 0; i < count; i++) {
      texts.push((await filters.nth(i).textContent()).toLowerCase());
    }
    expect(texts.some(t => t.includes('lower'))).toBe(true);
    expect(texts.some(t => t.includes('core'))).toBe(true);
    expect(texts.some(t => t.includes('push') || t.includes('upper'))).toBe(true);
  });

  test('exercise card click opens info modal', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    await page.waitForSelector('#exlib-list .exlib-item', { state: 'attached', timeout: 5000 });
    // Sections start collapsed; expand the first one to make items visible
    await page.click('#exlib-list .exlib-section-header');
    await page.click('#exlib-list .exlib-section.open .exlib-item-name');
    const modal = page.locator('#info-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('info modal has title, body, and close button', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    await page.waitForSelector('#exlib-list .exlib-item', { state: 'attached', timeout: 5000 });
    // Sections start collapsed; expand the first one to make items visible
    await page.click('#exlib-list .exlib-section-header');
    await page.click('#exlib-list .exlib-section.open .exlib-item-name');
    await page.waitForSelector('#info-modal.active', { timeout: 3000 });

    const title = page.locator('#modal-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText.length).toBeGreaterThan(0);

    const body = page.locator('#modal-body');
    await expect(body).toBeAttached();

    const closeBtn = page.locator('#info-modal .modal-close');
    await expect(closeBtn).toBeVisible();
  });

  test('info modal closes on close button click', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    await page.waitForSelector('#exlib-list .exlib-item', { state: 'attached', timeout: 5000 });
    // Sections start collapsed; expand the first one to make items visible
    await page.click('#exlib-list .exlib-section-header');
    await page.click('#exlib-list .exlib-section.open .exlib-item-name');
    await page.waitForSelector('#info-modal.active', { timeout: 3000 });
    await page.click('#info-modal .modal-close');
    await expect(page.locator('#info-modal')).not.toBeVisible({ timeout: 3000 });
  });

  test('programs tab shows program cards', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="programs"]');
    const panel = page.locator('#lib-programs');
    await expect(panel).toBeVisible();
  });

  test('equipment tab shows equipment catalog', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="equipment"]');
    const panel = page.locator('#lib-equipment');
    await expect(panel).toBeVisible();
    const catalog = page.locator('#equip-catalog');
    await expect(catalog).toBeAttached();
  });
});
