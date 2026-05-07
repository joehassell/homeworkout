/**
 * Page-object helpers for SimpleWorkoutGen E2E tests.
 * Usage: const app = new App(page); await app.launch();
 */
const { installCapacitorMocks } = require('./capacitor-mocks');

class App {
  constructor(page) {
    this.page = page;
  }

  /** Navigate to the app, inject mocks, wait for setup screen. */
  async launch(opts = {}) {
    // Inject Capacitor mocks before any page JS runs
    await this.page.addInitScript({ content: `(${installCapacitorMocks.toString()})()` });

    // Seed localStorage if requested
    if (opts.localStorage) {
      await this.page.addInitScript((entries) => {
        for (const [k, v] of Object.entries(entries)) {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
      }, opts.localStorage);
    }

    // Seed entitlement for pro access by default (avoids paywall interference)
    if (opts.pro !== false) {
      await this.page.addInitScript(() => {
        localStorage.setItem('swg.entitlement.v1', JSON.stringify({
          tier: 'pro', source: 'test', expiresAt: null, isFounder: false
        }));
      });
    }

    await this.page.goto('/');
    await this.page.waitForSelector('#setup.active', { timeout: 10000 });
  }

  // ── Navigation ──────────────────────────────────────

  async navTo(screen) {
    await this.page.evaluate((s) => navTo(s), screen);
    await this.page.waitForSelector(`#${screen}.active`, { timeout: 5000 });
  }

  async activeScreen() {
    return this.page.evaluate(() => document.querySelector('.screen.active')?.id);
  }

  // ── Setup screen ────────────────────────────────────

  async selectType(type) {
    await this.page.click(`#type-pills .pill[data-value="${type}"]`);
  }

  async selectDuration(dur) {
    await this.page.click(`#duration-pills .pill[data-value="${dur}"]`);
  }

  async selectIntensity(val) {
    await this.page.click(`#intensity-pills .pill[data-value="${val}"]`);
  }

  async selectSets(val) {
    await this.page.click(`#sets-pills .pill[data-value="${val}"]`);
  }

  async cycleFocus(region) {
    await this.page.click(`#focus-pills .pill[data-region="${region}"]`);
  }

  async applyEquipPreset(preset) {
    await this.page.evaluate((p) => applyEquipPreset(p), preset);
  }

  async toggleEquipment(name) {
    await this.page.click(`#equipment-group .equip-tier .pill[data-value="${name}"]`);
  }

  // ── Generate ────────────────────────────────────────

  async generate() {
    await this.page.evaluate(() => generateWorkout());
    // Wait for either preview or error
    await Promise.race([
      this.page.waitForSelector('#preview.active', { timeout: 5000 }),
      this.page.waitForSelector('#gen-error:not(:empty)', { timeout: 5000 }),
    ]);
  }

  async genError() {
    return this.page.textContent('#gen-error');
  }

  async isPreviewVisible() {
    const screen = await this.activeScreen();
    return screen === 'preview';
  }

  // ── Preview ─────────────────────────────────────────

  async exerciseCount() {
    return this.page.evaluate(() => workout.length);
  }

  async exerciseNames() {
    return this.page.evaluate(() => workout.map(w => w.exercise.name));
  }

  async startWorkout() {
    await this.page.evaluate(() => startWorkout());
    await this.page.waitForSelector('#timer.active', { timeout: 5000 });
  }

  // ── Timer ───────────────────────────────────────────

  async timerPhase() {
    return this.page.textContent('#t-phase');
  }

  async timerExerciseName() {
    return this.page.textContent('#t-name');
  }

  async timerTime() {
    return this.page.textContent('#t-time');
  }

  async timerPause() {
    await this.page.click('#t-pause');
  }

  async timerSkip() {
    await this.page.evaluate(() => skipPhase());
  }

  async timerPrevious() {
    await this.page.evaluate(() => prevExercise());
  }

  async timerRestart() {
    await this.page.evaluate(() => restartExercise());
  }

  async timerStop() {
    await this.page.evaluate(() => finishWorkout());
    await this.page.waitForSelector('#done.active', { timeout: 5000 });
  }

  // ── Done screen ─────────────────────────────────────

  async doneExerciseCount() {
    return this.page.textContent('#d-exercises');
  }

  async doneSave() {
    await this.page.evaluate(() => doneActionSave());
    // doneActionSave navigates to setup; wait for it
    await this.page.waitForSelector('#setup.active', { timeout: 5000 });
  }

  // ── Capacitor mock assertions ───────────────────────

  async pluginCalls(pluginMethod) {
    return this.page.evaluate((key) => window.__capMockCalls[key] || [], pluginMethod);
  }

  async pluginCallCount(pluginMethod) {
    const calls = await this.pluginCalls(pluginMethod);
    return calls.length;
  }

  // ── Settings ────────────────────────────────────────

  async setSetting(id, value) {
    await this.page.fill(`#${id}`, String(value));
  }

  async clickSettingPill(groupId, value) {
    await this.page.click(`#${groupId} .pill[data-value="${value}"]`);
  }

  // ── Utility ─────────────────────────────────────────

  async localStorage(key) {
    return this.page.evaluate((k) => {
      const v = localStorage.getItem(k);
      try { return JSON.parse(v); } catch { return v; }
    }, key);
  }

  async workout() {
    return this.page.evaluate(() => workout);
  }
}

module.exports = { App };
