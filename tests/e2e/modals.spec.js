const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

test.describe('Modals and overlays', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
    await app.launch();
  });

  test('info modal opens when exercise info button clicked in library', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    await page.waitForSelector('#exlib-list .exlib-item', { state: 'attached', timeout: 5000 });
    // Sections start collapsed; expand the first one to make items visible
    await page.click('#exlib-list .exlib-section-header');
    await page.click('#exlib-list .exlib-section.open .exlib-item-name');
    const modal = page.locator('#info-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('info modal shows exercise name', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    await page.waitForSelector('#exlib-list .exlib-item', { state: 'attached', timeout: 5000 });
    // Sections start collapsed; expand the first one to make items visible
    await page.click('#exlib-list .exlib-section-header');
    await page.click('#exlib-list .exlib-section.open .exlib-item-name');
    await page.waitForSelector('#info-modal.active', { timeout: 3000 });

    const title = await page.textContent('#modal-title');
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('Exercise'); // Should be replaced with actual name
  });

  test('info modal closes on close button', async ({ page }) => {
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

  test('info modal closes on background click', async ({ page }) => {
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="exercises"]');
    await page.waitForSelector('#exlib-list .exlib-item', { state: 'attached', timeout: 5000 });
    // Sections start collapsed; expand the first one to make items visible
    await page.click('#exlib-list .exlib-section-header');
    await page.click('#exlib-list .exlib-section.open .exlib-item-name');
    await page.waitForSelector('#info-modal.active', { timeout: 3000 });

    // Click the overlay backdrop (the #info-modal element itself, not the .modal-content child)
    const modal = page.locator('#info-modal');
    const box = await modal.boundingBox();
    // Click in the top-left corner of the overlay, outside the modal content
    await page.mouse.click(box.x + 5, box.y + 5);
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('timer screen has exercise elements after starting a workout', async ({ page }) => {
    await app.selectType('strength');
    await app.selectDuration('15');
    await app.generate();
    await app.startWorkout();

    const exerciseName = page.locator('#t-name');
    await expect(exerciseName).toBeVisible();
    const name = await exerciseName.textContent();
    expect(name.length).toBeGreaterThan(0);

    const phase = page.locator('#t-phase');
    await expect(phase).toBeVisible();

    const progress = page.locator('#t-ex-progress');
    await expect(progress).toBeVisible();
  });

  test('plate calculator can be opened and closed', async ({ page }) => {
    const hasPlateCalc = await page.evaluate(() => typeof openPlateCalc === 'function');
    test.skip(!hasPlateCalc, 'openPlateCalc not available');

    // Generate a strength workout to get the plate calc link
    await app.selectType('strength');
    await app.selectDuration('15');
    await app.generate();
    await app.startWorkout();

    // Open plate calculator
    await page.evaluate(() => openPlateCalc());
    const overlay = page.locator('#plate-calc-overlay');
    await expect(overlay).toBeVisible({ timeout: 3000 });

    // Close it
    await page.evaluate(() => closePlateCalc());
    await expect(overlay).not.toBeVisible({ timeout: 3000 });
  });
});
