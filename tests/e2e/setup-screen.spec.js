const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

const SILENT = { wk_settings: JSON.stringify({ soundEnabled: false, voiceEnabled: false }) };

test.describe('Setup screen', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
    await app.launch({ localStorage: SILENT });
  });

  // ── Workout type pills ──────────────────────────────

  for (const type of ['strength', 'hiit', 'conditioning', 'functional', 'yoga', 'isohiit']) {
    test(`select workout type: ${type}`, async ({ page }) => {
      await app.selectType(type);
      const selected = await page.locator('#type-pills .pill.selected').getAttribute('data-value');
      expect(selected).toBe(type);
    });
  }

  // ── Yoga UI group visibility ────────────────────────

  test('yoga style group appears when yoga is selected', async ({ page }) => {
    await app.selectType('yoga');
    const yogaGroup = page.locator('#yoga-style-group');
    await expect(yogaGroup).toBeVisible();
  });

  test('yoga style group hides for non-yoga type', async ({ page }) => {
    await app.selectType('yoga');
    await app.selectType('strength');
    const yogaGroup = page.locator('#yoga-style-group');
    await expect(yogaGroup).toBeHidden();
  });

  // ── Duration pills ─────────────────────────────────

  for (const dur of ['15', '20', '30', '45', '60']) {
    test(`select duration: ${dur} min`, async ({ page }) => {
      await app.selectDuration(dur);
      const selected = await page.locator('#duration-pills .pill.selected').getAttribute('data-value');
      expect(selected).toBe(dur);
    });
  }

  // ── Intensity pills ────────────────────────────────

  for (const intensity of ['light', 'moderate', 'high']) {
    test(`select intensity: ${intensity}`, async ({ page }) => {
      await app.selectIntensity(intensity);
      const selected = await page.locator('#intensity-pills .pill.selected').getAttribute('data-value');
      expect(selected).toBe(intensity);
    });
  }

  // ── Sets pills ─────────────────────────────────────

  for (const sets of ['1', '2', '3', '4']) {
    test(`select sets: ${sets}`, async ({ page }) => {
      await app.selectSets(sets);
      const selected = await page.locator('#sets-pills .pill.selected').getAttribute('data-value');
      expect(selected).toBe(sets);
    });
  }

  // ── Focus pills cycle states ───────────────────────

  test('focus pill cycles include → increase → exclude', async ({ page }) => {
    // First click: include → increase
    await app.cycleFocus('upper');
    let pill = page.locator('#focus-pills .pill[data-region="upper"]');
    await expect(pill).toHaveClass(/fs-increase/);

    // Second click: increase → exclude
    await app.cycleFocus('upper');
    await expect(pill).toHaveClass(/fs-exclude/);

    // Third click: exclude → include
    await app.cycleFocus('upper');
    await expect(pill).toHaveClass(/fs-include/);
  });

  // ── Equipment section re-renders on type change ────

  test('selecting a type re-renders equipment section', async ({ page }) => {
    await app.selectType('strength');
    const equipGroup = page.locator('#equipment-group');
    await expect(equipGroup).toBeVisible();
  });
});
