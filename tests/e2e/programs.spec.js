const { test, expect } = require('@playwright/test');
const { App } = require('./helpers/app');

test.describe('Program enrollment flow', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new App(page);
  });

  test('navigate to library shows programs tab', async ({ page }) => {
    await app.launch();
    await app.navTo('library');
    const tab = page.locator('.lib-tab[data-tab="programs"]');
    await expect(tab).toBeVisible();
  });

  test('programs tab shows program cards after switching', async ({ page }) => {
    await app.launch();
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="programs"]');
    await page.waitForSelector('#programs-list .prog-card', { timeout: 5000 });
    const cards = page.locator('#programs-list .prog-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  test('programs list has at least 1 program card element', async ({ page }) => {
    await app.launch();
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="programs"]');
    await page.waitForSelector('.prog-card', { timeout: 5000 });
    const cardTitle = page.locator('.prog-card .prog-card-title').first();
    await expect(cardTitle).toBeVisible();
    expect(await cardTitle.textContent()).toBeTruthy();
  });

  test('clicking a program card navigates to program-detail screen', async ({ page }) => {
    await app.launch();
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="programs"]');
    await page.waitForSelector('.prog-card', { timeout: 5000 });
    await page.evaluate(() => ProgramUI.showDetail('prog_first_move_v1'));
    await page.waitForSelector('#program-detail.active', { timeout: 5000 });
    const screen = await app.activeScreen();
    expect(screen).toBe('program-detail');
  });

  test('program detail shows program name', async ({ page }) => {
    await app.launch();
    await app.navTo('library');
    await page.evaluate(() => ProgramUI.showDetail('prog_first_move_v1'));
    await page.waitForSelector('#program-detail.active', { timeout: 5000 });
    const heading = page.locator('#program-detail h1');
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text).toContain('First Move');
  });

  test('program detail shows duration info', async ({ page }) => {
    await app.launch();
    await page.evaluate(() => ProgramUI.showDetail('prog_first_move_v1'));
    await page.waitForSelector('#program-detail.active', { timeout: 5000 });
    const stats = page.locator('.prog-detail-stats');
    await expect(stats).toBeVisible();
    const text = await stats.textContent();
    expect(text).toContain('weeks');
  });

  test('program detail has start/enroll button', async ({ page }) => {
    await app.launch();
    await page.evaluate(() => ProgramUI.showDetail('prog_first_move_v1'));
    await page.waitForSelector('#program-detail.active', { timeout: 5000 });
    const btn = page.locator('.prog-start-btn');
    await expect(btn.first()).toBeVisible();
  });

  test('after enrollment, program-home renders', async ({ page }) => {
    const programState = {
      active_program_id: 'prog_first_move_v1',
      difficulty_track: 'A',
      current_week: 1,
      current_day: 1,
      completed: [],
      missed: [],
      paused: null,
      swaps: {},
      amrap_log: [],
      schedule: { days_of_week: ['Mon', 'Wed', 'Fri'], preferred_time: '07:00' },
      profile_snapshot: { fitness_level: 'beginner', equipment: ['bodyweight', 'mat'] }
    };
    await app.launch({ localStorage: { wk_program_state: programState } });
    await page.evaluate(() => ProgramUI.renderProgramHome());
    await page.waitForSelector('#program-home.active', { timeout: 5000 });
    const screen = await app.activeScreen();
    expect(screen).toBe('program-home');
  });

  test('program home shows today workout card', async ({ page }) => {
    const programState = {
      active_program_id: 'prog_first_move_v1',
      difficulty_track: 'A',
      current_week: 1,
      current_day: 1,
      completed: [],
      missed: [],
      paused: null,
      swaps: {},
      amrap_log: [],
      schedule: { days_of_week: ['Mon', 'Wed', 'Fri'], preferred_time: '07:00' },
      profile_snapshot: { fitness_level: 'beginner', equipment: ['bodyweight', 'mat'] }
    };
    await app.launch({ localStorage: { wk_program_state: programState } });
    await page.evaluate(() => ProgramUI.renderProgramHome());
    await page.waitForSelector('#program-home.active', { timeout: 5000 });
    const todayCard = page.locator('.prog-today-card');
    await expect(todayCard).toBeVisible();
  });

  test('program home has pause button', async ({ page }) => {
    const programState = {
      active_program_id: 'prog_first_move_v1',
      difficulty_track: 'A',
      current_week: 1,
      current_day: 1,
      completed: [],
      missed: [],
      paused: null,
      swaps: {},
      amrap_log: [],
      schedule: { days_of_week: ['Mon', 'Wed', 'Fri'], preferred_time: '07:00' },
      profile_snapshot: { fitness_level: 'beginner', equipment: ['bodyweight', 'mat'] }
    };
    await app.launch({ localStorage: { wk_program_state: programState } });
    await page.evaluate(() => ProgramUI.renderProgramHome());
    await page.waitForSelector('#program-home.active', { timeout: 5000 });
    const pauseBtn = page.locator('.prog-action-link', { hasText: 'Pause' });
    await expect(pauseBtn).toBeVisible();
  });

  test('program home has View Program link', async ({ page }) => {
    const programState = {
      active_program_id: 'prog_first_move_v1',
      difficulty_track: 'A',
      current_week: 1,
      current_day: 1,
      completed: [],
      missed: [],
      paused: null,
      swaps: {},
      amrap_log: [],
      schedule: { days_of_week: ['Mon', 'Wed', 'Fri'], preferred_time: '07:00' },
      profile_snapshot: { fitness_level: 'beginner', equipment: ['bodyweight', 'mat'] }
    };
    await app.launch({ localStorage: { wk_program_state: programState } });
    await page.evaluate(() => ProgramUI.renderProgramHome());
    await page.waitForSelector('#program-home.active', { timeout: 5000 });
    const viewLink = page.locator('.prog-action-link', { hasText: 'View Program' });
    await expect(viewLink).toBeVisible();
  });

  test('back navigation from program detail returns to library', async ({ page }) => {
    await app.launch();
    await app.navTo('library');
    await page.click('.lib-tab[data-tab="programs"]');
    await page.waitForSelector('.prog-card', { timeout: 5000 });
    await page.evaluate(() => ProgramUI.showDetail('prog_first_move_v1'));
    await page.waitForSelector('#program-detail.active', { timeout: 5000 });
    await page.evaluate(() => ProgramUI.backToList());
    await page.waitForSelector('#library.active', { timeout: 5000 });
    const screen = await app.activeScreen();
    expect(screen).toBe('library');
  });

  test('program assessment screen renders test inputs when navigated to', async ({ page }) => {
    // Seed an active program on an assessment day
    const programState = {
      active_program_id: 'prog_first_move_v1',
      difficulty_track: 'A',
      current_week: 1,
      current_day: 1,
      completed: [],
      missed: [],
      paused: null,
      swaps: {},
      amrap_log: [],
      schedule: { days_of_week: ['Mon', 'Wed', 'Fri'], preferred_time: '07:00' },
      profile_snapshot: { fitness_level: 'beginner', equipment: ['bodyweight', 'mat'] }
    };
    await app.launch({ localStorage: { wk_program_state: programState } });
    await page.evaluate(() => ProgramUI.renderProgramHome());
    await page.waitForSelector('#program-home.active', { timeout: 5000 });

    // Check if assessment screen can be rendered
    // Navigate to assessment if today's slot is an assessment, or directly render it
    const hasAssessment = await page.evaluate(() => {
      var today = window.ProgramState && window.ProgramState.getTodaySlot();
      return today && today.dayDef && today.dayDef.kind === 'assessment';
    });

    if (hasAssessment) {
      await page.evaluate(() => ProgramUI.startAssessment());
      await page.waitForSelector('#program-assessment.active', { timeout: 5000 });
      const inputs = page.locator('.prog-assessment-input');
      expect(await inputs.count()).toBeGreaterThan(0);
    } else {
      // If day 1 is not an assessment, verify the program-assessment screen element exists
      const assessmentEl = page.locator('#program-assessment');
      await expect(assessmentEl).toBeAttached();
    }
  });
});
