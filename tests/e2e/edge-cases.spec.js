const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

test.describe('Error states and boundary conditions', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
  });

  test('generate with all focus regions excluded shows error', async ({ page }) => {
    await app.launch();
    await app.selectType('strength');
    await app.selectDuration('20');
    // Exclude all focus regions by cycling each to 'exclude'
    const regions = ['upper', 'upper_push', 'upper_pull', 'lower', 'core', 'full_body', 'posterior'];
    await page.evaluate((regionList) => {
      regionList.forEach(region => {
        focusState[region] = 'exclude';
      });
      // Update pill UI
      if (typeof saveFocus === 'function') saveFocus();
      if (typeof renderFocusPills === 'function') renderFocusPills();
    }, regions);
    await app.generate();
    const error = await app.genError();
    expect(error).toBeTruthy();
    expect(error.toLowerCase()).toContain('exclude');
  });

  test('generate with very short duration (15min) still succeeds', async ({ page }) => {
    await app.launch();
    await app.selectType('strength');
    await app.selectDuration('15');
    await app.generate();
    const isPreview = await app.isPreviewVisible();
    expect(isPreview).toBe(true);
    const count = await app.exerciseCount();
    expect(count).toBeGreaterThan(0);
  });

  test('generate with 60min duration succeeds with more exercises', async ({ page }) => {
    await app.launch();
    await app.selectType('strength');
    await app.selectDuration('60');
    await app.generate();
    const isPreview = await app.isPreviewVisible();
    expect(isPreview).toBe(true);
    const count = await app.exerciseCount();
    expect(count).toBeGreaterThan(5);
  });

  test('workout exercise count is reasonable for 30min session (5-40)', async ({ page }) => {
    await app.launch();
    await app.selectType('strength');
    await app.selectDuration('30');
    await app.generate();
    const count = await app.exerciseCount();
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(40);
  });

  test('cooldown section exists in every generated non-yoga workout', async ({ page }) => {
    await app.launch();
    await app.selectType('strength');
    await app.selectDuration('30');
    await app.generate();
    const workoutData = await app.workout();
    const cooldownEntries = workoutData.filter(w => w.section === 'cooldown');
    expect(cooldownEntries.length).toBeGreaterThan(0);
  });

  test('warmup section exists in every generated non-yoga workout', async ({ page }) => {
    await app.launch();
    await app.selectType('hiit');
    await app.selectDuration('20');
    await app.generate();
    const workoutData = await app.workout();
    const warmupEntries = workoutData.filter(w => w.section === 'warmup');
    expect(warmupEntries.length).toBeGreaterThan(0);
  });

  test('localStorage corruption does not crash the app', async ({ page }) => {
    await app.launch({
      localStorage: { wk_settings: '{{{broken json not valid!!!' }
    });
    // App should still load setup screen without crashing
    const screen = await app.activeScreen();
    expect(screen).toBe('setup');
  });

  test('rapid double-generate does not cause errors', async ({ page }) => {
    await app.launch();
    await app.selectType('strength');
    await app.selectDuration('20');

    // Collect any page errors
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Fire two generates rapidly
    await Promise.all([
      page.evaluate(() => generateWorkout()),
      page.evaluate(() => generateWorkout()),
    ]);

    // Wait for either preview or error to settle
    await page.waitForTimeout(1000);
    await Promise.race([
      page.waitForSelector('#preview.active', { timeout: 3000 }),
      page.waitForSelector('#gen-error:not(:empty)', { timeout: 3000 }),
    ]).catch(() => {});

    // No uncaught JS errors should have occurred
    expect(errors.length).toBe(0);
  });
});
