const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

test.describe('Settings screen', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
    await app.launch();
  });

  test('navigate to settings, screen is active', async () => {
    await app.navTo('settings');
    expect(await app.activeScreen()).toBe('settings');
  });

  test('age band pill updates localStorage profile', async ({ page }) => {
    await app.navTo('settings');
    await app.clickSettingPill('age-band-pills', '40-54');
    const settings = await app.localStorage('wk_settings');
    expect(settings.userProfile.age_band).toBe('40-54');
  });

  test('fitness level pill updates localStorage profile', async ({ page }) => {
    await app.navTo('settings');
    await app.clickSettingPill('fitness-pills', 'advanced');
    const settings = await app.localStorage('wk_settings');
    expect(settings.userProfile.fitness_level).toBe('advanced');
  });

  test('floor work toggle changes class on click', async ({ page }) => {
    await app.navTo('settings');
    const toggle = page.locator('#floor-work-toggle');
    const classBefore = await toggle.getAttribute('class');
    await toggle.click();
    const classAfter = await toggle.getAttribute('class');
    expect(classBefore).not.toBe(classAfter);
  });

  test('mobility limit pills support multi-select', async ({ page }) => {
    await app.navTo('settings');
    await page.click('#mobility-pills .pill[data-value="knees"]');
    await page.click('#mobility-pills .pill[data-value="shoulders"]');
    const settings = await app.localStorage('wk_settings');
    expect(settings.userProfile.mobility_limits).toContain('knees');
    expect(settings.userProfile.mobility_limits).toContain('shoulders');
  });

  test('goals pills enforce max 3 selections', async ({ page }) => {
    await app.navTo('settings');
    await page.click('#goal-pills .pill[data-value="weight-loss"]');
    await page.click('#goal-pills .pill[data-value="cardio-fitness"]');
    await page.click('#goal-pills .pill[data-value="strength"]');
    await page.click('#goal-pills .pill[data-value="mobility"]');
    const settings = await app.localStorage('wk_settings');
    const goals = settings.userGoals || [];
    expect(goals.length).toBeLessThanOrEqual(3);
    expect(goals).not.toContain('mobility');
  });

  test('sound toggle updates localStorage', async ({ page }) => {
    await app.navTo('settings');
    const settingsBefore = await app.localStorage('wk_settings');
    const soundBefore = settingsBefore ? settingsBefore.soundEnabled : true;
    await page.click('#set-sound');
    const settingsAfter = await app.localStorage('wk_settings');
    expect(settingsAfter.soundEnabled).not.toBe(soundBefore);
  });

  test('voice toggle updates localStorage', async ({ page }) => {
    await app.navTo('settings');
    const settingsBefore = await app.localStorage('wk_settings');
    const voiceBefore = settingsBefore ? settingsBefore.voiceEnabled : true;
    await page.click('#set-voice');
    const settingsAfter = await app.localStorage('wk_settings');
    expect(settingsAfter.voiceEnabled).not.toBe(voiceBefore);
  });

  test('theme swatch sets data-theme on html element', async ({ page }) => {
    await app.navTo('settings');
    await page.click('.theme-swatch[data-theme="midnight"]');
    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBe('midnight');
  });

  test('font size A+ changes font scale on root element', async ({ page }) => {
    await app.navTo('settings');
    const sizeBefore = await page.evaluate(() =>
      getComputedStyle(document.documentElement).fontSize
    );
    await page.click('.fs-up');
    const sizeAfter = await page.evaluate(() =>
      getComputedStyle(document.documentElement).fontSize
    );
    expect(sizeAfter).not.toBe(sizeBefore);
  });

  test('units toggle sets units in localStorage', async ({ page }) => {
    await app.navTo('settings');
    await page.click('#units-pills .pill[data-value="imperial"]');
    const settings = await app.localStorage('wk_settings');
    expect(settings.units).toBe('imperial');
  });

  test('profile count element exists and shows a number', async ({ page }) => {
    await app.navTo('settings');
    const el = page.locator('#profile-count');
    await expect(el).toBeVisible();
    const text = await el.textContent();
    expect(text).toMatch(/\d/);
  });

  test('age band pill 18-39 updates profile correctly', async ({ page }) => {
    await app.navTo('settings');
    await app.clickSettingPill('age-band-pills', '18-39');
    const settings = await app.localStorage('wk_settings');
    expect(settings.userProfile.age_band).toBe('18-39');
  });

  test('fitness level beginner updates profile correctly', async ({ page }) => {
    await app.navTo('settings');
    await app.clickSettingPill('fitness-pills', 'beginner');
    const settings = await app.localStorage('wk_settings');
    expect(settings.userProfile.fitness_level).toBe('beginner');
  });

  test('all settings persist after reload', async ({ page }) => {
    await app.navTo('settings');
    await app.clickSettingPill('age-band-pills', '55-69');
    await app.clickSettingPill('fitness-pills', 'intermediate');
    await page.click('.theme-swatch[data-theme="forest"]');
    await page.click('#units-pills .pill[data-value="imperial"]');

    // Reload
    await page.reload();
    await page.waitForSelector('#setup.active', { timeout: 10000 });
    await app.navTo('settings');

    const settings = await app.localStorage('wk_settings');
    expect(settings.userProfile.age_band).toBe('55-69');
    expect(settings.userProfile.fitness_level).toBe('intermediate');

    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBe('forest');

    expect(settings.units).toBe('imperial');
  });
});
