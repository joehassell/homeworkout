const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

test.describe('History screen', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
    await app.launch();
  });

  test('navigate to history, screen is active', async () => {
    await app.navTo('history');
    expect(await app.activeScreen()).toBe('history');
  });

  test('empty state message visible when no workouts saved', async ({ page }) => {
    await app.navTo('history');
    const empty = page.locator('#hist-empty');
    await expect(empty).toBeVisible();
  });

  test('empty state has CTA button to go to setup', async ({ page }) => {
    await app.navTo('history');
    const cta = page.locator('#hist-empty button');
    await expect(cta).toBeVisible();
    await cta.click();
    expect(await app.activeScreen()).toBe('setup');
  });

  test('after generating and saving a workout, history shows at least 1 entry', async ({ page }) => {
    await app.selectType('hiit');
    await app.selectDuration('15');
    await app.generate();
    await app.startWorkout();
    await app.timerStop(); // finishWorkout → done screen
    await app.doneSave();  // doneActionSave → setup screen

    await app.navTo('history');
    // History renders entries with .hist-row class
    const entries = page.locator('#hist-list .hist-row');
    await expect(entries.first()).toBeVisible({ timeout: 5000 });
    expect(await entries.count()).toBeGreaterThanOrEqual(1);
  });

  test('heatmap container element exists', async ({ page }) => {
    await app.navTo('history');
    const heatmap = page.locator('#hist-heatmap');
    await expect(heatmap).toBeAttached();
  });

  test('stats section exists', async ({ page }) => {
    await app.navTo('history');
    const stats = page.locator('#hist-stats');
    await expect(stats).toBeAttached();
  });
});
