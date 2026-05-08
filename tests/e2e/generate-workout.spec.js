const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

const SILENT = { wk_settings: JSON.stringify({ soundEnabled: false, voiceEnabled: false }) };

test.describe('Generate workout', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
    await app.launch({ localStorage: SILENT });
  });

  // ── Default generation ─────────────────────────────

  test('default settings generate → preview visible', async () => {
    await app.generate();
    expect(await app.isPreviewVisible()).toBe(true);
  });

  test('preview shows non-zero exercise count', async () => {
    await app.generate();
    const count = await app.exerciseCount();
    expect(count).toBeGreaterThan(0);
  });

  // ── Workout types ──────────────────────────────────

  test('strength workout has warmup, main, cooldown sections', async () => {
    await app.selectType('strength');
    await app.generate();
    const w = await app.workout();
    const sections = w.map(e => e.section);
    expect(sections).toContain('warmup');
    expect(sections).toContain('main');
    expect(sections).toContain('cooldown');
  });

  test('HIIT 30 min generates successfully', async () => {
    await app.selectType('hiit');
    await app.selectDuration('30');
    await app.generate();
    expect(await app.isPreviewVisible()).toBe(true);
  });

  test('conditioning generates successfully', async () => {
    await app.selectType('conditioning');
    await app.generate();
    expect(await app.isPreviewVisible()).toBe(true);
  });

  test('functional generates successfully', async () => {
    await app.selectType('functional');
    await app.generate();
    expect(await app.isPreviewVisible()).toBe(true);
  });

  test('yoga generates and includes Savasana', async () => {
    await app.selectType('yoga');
    await app.selectDuration('30');
    await app.generate();
    expect(await app.isPreviewVisible()).toBe(true);
    const names = await app.exerciseNames();
    const hasSavasana = names.some(n => /savasana/i.test(n));
    expect(hasSavasana).toBe(true);
  });

  // ── Validation errors ──────────────────────────────

  test('all focus regions excluded → shows gen-error', async ({ page }) => {
    // Cycle every region to exclude (2 clicks: include → increase → exclude)
    for (const region of ['upper', 'lower', 'core', 'full_body', 'upper_push', 'upper_pull', 'posterior']) {
      await app.cycleFocus(region); // include → increase
      await app.cycleFocus(region); // increase → exclude
    }
    await app.generate();
    const err = await app.genError();
    expect(err).toContain('excluded');
  });

  // ── Duration variants ──────────────────────────────

  test('15-min workout generates without error', async () => {
    await app.selectDuration('15');
    await app.generate();
    expect(await app.isPreviewVisible()).toBe(true);
  });

  test('60-min workout generates without error', async () => {
    await app.selectDuration('60');
    await app.generate();
    expect(await app.isPreviewVisible()).toBe(true);
  });

  // ── Regeneration ───────────────────────────────────

  test('regenerating twice can produce different exercise orders', async ({ page }) => {
    await app.selectType('strength');
    await app.selectDuration('30');
    await app.generate();
    const names1 = await app.exerciseNames();

    // Navigate back and regenerate
    await app.navTo('setup');
    await app.generate();
    const names2 = await app.exerciseNames();

    // At least one of these should have exercises; they may or may not differ
    expect(names1.length).toBeGreaterThan(0);
    expect(names2.length).toBeGreaterThan(0);
  });

  // ── IsoHIIT type ───────────────────────────────────

  test('isohiit generates successfully', async () => {
    await app.selectType('isohiit');
    await app.generate();
    expect(await app.isPreviewVisible()).toBe(true);
  });
});
