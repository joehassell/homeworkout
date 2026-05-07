const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

const SILENT = { wk_settings: JSON.stringify({ soundEnabled: false, voiceEnabled: false }) };

test.describe('Equipment picker', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
    await app.launch({ localStorage: SILENT });
  });

  // ── Presets ─────────────────────────────────────────

  test('preset "none" selects only bodyweight and mat', async ({ page }) => {
    await app.applyEquipPreset('none');
    const selected = await page.$$eval(
      '#equipment-group .equip-tier .pill.selected',
      els => els.map(e => e.dataset.value)
    );
    expect(selected).toEqual(['bodyweight', 'mat']);
  });

  test('preset "light" sets bodyweight, mat, resistance band, dumbbell', async ({ page }) => {
    await app.applyEquipPreset('light');
    const selected = await page.$$eval(
      '#equipment-group .equip-tier .pill.selected',
      els => els.map(e => e.dataset.value)
    );
    expect(selected).toContain('bodyweight');
    expect(selected).toContain('mat');
    expect(selected).toContain('resistance band');
    expect(selected).toContain('dumbbell');
  });

  test('preset "full" includes home gym equipment', async ({ page }) => {
    await app.applyEquipPreset('full');
    const selected = await page.$$eval(
      '#equipment-group .equip-tier .pill.selected',
      els => els.map(e => e.dataset.value)
    );
    expect(selected).toContain('bodyweight');
    expect(selected).toContain('mat');
    expect(selected).toContain('dumbbell');
  });

  test('preset "commercial" includes barbell', async ({ page }) => {
    // Barbell only appears in the equipment UI for strength/functional types.
    // Select strength first so the barbell pill is rendered in the DOM.
    await app.selectType('strength');
    await app.applyEquipPreset('commercial');
    const selected = await page.$$eval(
      '#equipment-group .equip-tier .pill.selected',
      els => els.map(e => e.dataset.value)
    );
    expect(selected).toContain('barbell');
  });

  // ── Individual toggle ──────────────────────────────

  test('toggling an equipment pill adds .selected', async ({ page }) => {
    await app.applyEquipPreset('none');
    await app.toggleEquipment('resistance band');
    const pill = page.locator('#equipment-group .equip-tier .pill[data-value="resistance band"]');
    await expect(pill).toHaveClass(/selected/);
  });

  test('toggling an equipment pill again removes .selected', async ({ page }) => {
    await app.applyEquipPreset('light');
    await app.toggleEquipment('mat');
    const pill = page.locator('#equipment-group .equip-tier .pill[data-value="mat"]');
    await expect(pill).not.toHaveClass(/selected/);
  });

  // ── Tier collapse / expand ─────────────────────────

  test('commercial tier starts collapsed', async ({ page }) => {
    const tier = page.locator('#equipment-commercial');
    await expect(tier).toHaveClass(/collapsed/);
  });

  test('clicking tier header toggles collapsed class', async ({ page }) => {
    const tier = page.locator('#equipment-commercial');
    const header = page.locator('#equipment-commercial .equip-tier-header');
    await expect(tier).toHaveClass(/collapsed/);
    await header.click();
    await expect(tier).not.toHaveClass(/collapsed/);
    await header.click();
    await expect(tier).toHaveClass(/collapsed/);
  });

  // ── Persistence ────────────────────────────────────

  test('equipment selection persists to localStorage wk_equipment', async ({ page }) => {
    await app.applyEquipPreset('light');
    const stored = await app.localStorage('wk_equipment');
    expect(stored).toContain('bodyweight');
    expect(stored).toContain('mat');
    expect(stored).toContain('resistance band');
  });

  test('equipment selection round-trips through reload', async ({ page }) => {
    await app.applyEquipPreset('light');
    await page.reload();
    await page.waitForSelector('#setup.active', { timeout: 10000 });
    const selected = await page.$$eval(
      '#equipment-group .equip-tier .pill.selected',
      els => els.map(e => e.dataset.value)
    );
    expect(selected).toContain('mat');
  });
});
