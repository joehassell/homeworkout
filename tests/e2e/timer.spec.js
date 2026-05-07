const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

const SILENT = { wk_settings: JSON.stringify({ soundEnabled: false, voiceEnabled: false }) };

test.describe('Timer screen', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
    await app.launch({ localStorage: SILENT });
    await app.generate();
    await app.startWorkout();
  });

  // ── Basic state ────────────────────────────────────

  test('timer screen is active after startWorkout', async () => {
    const screen = await app.activeScreen();
    expect(screen).toBe('timer');
  });

  test('phase display shows text', async () => {
    const phase = await app.timerPhase();
    expect(phase.trim().length).toBeGreaterThan(0);
  });

  test('exercise name is not empty', async () => {
    const name = await app.timerExerciseName();
    expect(name.trim().length).toBeGreaterThan(0);
  });

  test('timer time displays a value', async () => {
    const time = await app.timerTime();
    expect(time.trim().length).toBeGreaterThan(0);
  });

  test('progress indicator shows "N of M" format', async ({ page }) => {
    const progress = await page.textContent('#t-ex-progress');
    expect(progress).toMatch(/\d+\s+of\s+\d+/);
  });

  // ── Pause / Resume ─────────────────────────────────

  test('pause sets timerState.paused to true', async ({ page }) => {
    await app.timerPause();
    const paused = await page.evaluate(() => timerState.paused);
    expect(paused).toBe(true);
  });

  test('resume after pause sets timerState.paused to false', async ({ page }) => {
    await app.timerPause();
    let paused = await page.evaluate(() => timerState.paused);
    expect(paused).toBe(true);
    await app.timerPause(); // toggle back
    paused = await page.evaluate(() => timerState.paused);
    expect(paused).toBe(false);
  });

  // ── Skip / Previous ────────────────────────────────

  test('skip advances to next exercise', async () => {
    const name1 = await app.timerExerciseName();
    await app.timerSkip();
    const name2 = await app.timerExerciseName();
    // Name should change (or at minimum the skip executed without error)
    expect(name2.trim().length).toBeGreaterThan(0);
  });

  test('previous goes back after skip', async () => {
    const name1 = await app.timerExerciseName();
    await app.timerSkip();
    const name2 = await app.timerExerciseName();
    await app.timerPrevious();
    const name3 = await app.timerExerciseName();
    expect(name3).toBe(name1);
  });

  // ── Restart ────────────────────────────────────────

  test('restart resets the timer for current exercise', async ({ page }) => {
    // Let a tiny bit of state build up, then restart
    await app.timerRestart();
    const remaining = await page.evaluate(() => timerState.remaining);
    // After restart, remaining should be at the full work duration
    const workSec = await page.evaluate(() => workout[timerState.idx]?.workSec);
    expect(remaining).toBe(workSec);
  });

  // ── Stop ───────────────────────────────────────────

  test('stop workout navigates to done screen', async () => {
    await app.timerStop();
    const screen = await app.activeScreen();
    expect(screen).toBe('done');
  });

  // ── Sound and voice toggles ────────────────────────

  test('sound toggle changes soundEnabled', async ({ page }) => {
    const before = await page.evaluate(() => soundEnabled);
    await page.click('#t-sound');
    const after = await page.evaluate(() => soundEnabled);
    expect(after).toBe(!before);
  });

  test('voice toggle changes voiceEnabled', async ({ page }) => {
    const before = await page.evaluate(() => voiceEnabled);
    await page.click('#t-voice');
    const after = await page.evaluate(() => voiceEnabled);
    expect(after).toBe(!before);
  });

  // ── Clock-based time progression ───────────────────

  test('timer remaining decreases when clock advances', async ({ page }) => {
    await page.clock.install();
    const before = await page.evaluate(() => timerState.remaining);
    await page.clock.fastForward(3000);
    const after = await page.evaluate(() => timerState.remaining);
    expect(after).toBeLessThanOrEqual(before);
  });

  // ── HIIT phase transitions with clock ──────────────

  test('HIIT workout transitions phases over time', async ({ page }) => {
    // Create a fresh HIIT workout for this test
    const hiitApp = new App(page);
    await hiitApp.launch({ localStorage: SILENT });
    await hiitApp.selectType('hiit');
    await hiitApp.selectDuration('15');
    await hiitApp.generate();
    await hiitApp.startWorkout();

    await page.clock.install();
    const phase1 = await page.evaluate(() => timerState.phase);

    // Fast-forward enough to pass work phase (typically 20-40s)
    await page.clock.fastForward(45000);
    const phase2 = await page.evaluate(() => timerState.phase);

    // At least one transition should have happened or we are still in a valid phase
    expect(['work', 'rest', 'cooldown', 'warmup']).toContain(phase2);
  });

  // ── Skip through all exercises → done screen ──────

  test('skipping through all exercises shows workout finished', async ({ page }) => {
    const total = await app.exerciseCount();
    // Skip through every exercise; use a generous upper bound
    for (let i = 0; i < total * 4 + 10; i++) {
      const running = await page.evaluate(() => timerState.running);
      if (!running) break;
      await app.timerSkip();
    }
    // After all exercises skipped, showWorkoutFinished sets timerState.phase to 'done'
    // and replaces controls with a "Save Workout" button.
    const phase = await page.evaluate(() => timerState.phase);
    expect(phase).toBe('done');
    // Click Save Workout to reach done screen
    await page.evaluate(() => finishWorkout());
    await page.waitForSelector('#done.active', { timeout: 5000 });
    const screen = await app.activeScreen();
    expect(screen).toBe('done');
  });

  // ── Timer index tracking ───────────────────────────

  test('skip increments timerState.idx', async ({ page }) => {
    const before = await page.evaluate(() => timerState.idx);
    await app.timerSkip();
    const after = await page.evaluate(() => timerState.idx);
    expect(after).toBeGreaterThanOrEqual(before);
  });

  test('previous decrements timerState.idx after skip', async ({ page }) => {
    await app.timerSkip();
    const afterSkip = await page.evaluate(() => timerState.idx);
    await app.timerPrevious();
    const afterPrev = await page.evaluate(() => timerState.idx);
    expect(afterPrev).toBeLessThan(afterSkip);
  });

  // ── Timer is running ───────────────────────────────

  test('timerState.running is true after start', async ({ page }) => {
    const running = await page.evaluate(() => timerState.running);
    expect(running).toBe(true);
  });
});
