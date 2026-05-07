'use strict';

function workoutToJSON(w) {
  const warmup = w.entries.filter(e => e.section === 'warmup').map(e => ({
    name: e.exercise.name, cat: e.exercise.cat, workSec: e.workSec, restSec: e.restSec, muscles: e.exercise.muscles
  }));
  const main = w.entries.filter(e => e.section === 'main').map(e => ({
    name: e.exercise.name, cat: e.exercise.cat, setIdx: e.setIdx, workSec: e.workSec, restSec: e.restSec,
    intensity: e.intensity, muscles: e.exercise.muscles, equipment: e.exercise.equip, diff: e.exercise.diff,
    single_sided: e.single_sided, reps_or_sec: e.workSec === 0 ? (e._programReps || repTarget(e.exercise.diff)) : e.workSec + 's'
  }));
  const cooldown = w.entries.filter(e => e.section === 'cooldown').map(e => ({
    name: e.exercise.name, cat: e.exercise.cat, workSec: e.workSec, restSec: e.restSec, muscles: e.exercise.muscles
  }));
  const yoga = w.entries.filter(e => e.section === 'yoga').map(e => ({
    name: e.exercise.name, cat: e.exercise.cat || '', workSec: e.workSec, restSec: e.restSec,
    phase: e.yogaPhase || '', single_sided: !!e.single_sided
  }));

  const stats = computeStats(w.entries);
  return {
    id: w.id,
    config: w.config,
    profile: w.profile,
    equipment: w.equipment,
    warmup,
    main: main.length ? main : undefined,
    yoga: yoga.length ? yoga : undefined,
    cooldown,
    stats
  };
}

function repTarget(diff) {
  if (diff === 3) return '3-5 reps';
  if (diff === 2) return '6-8 reps';
  return '10-12 reps';
}

function computeStats(entries) {
  const warmupSec = entries.filter(e => e.section === 'warmup').reduce((a, e) => a + e.workSec + e.restSec, 0);
  const mainEntries = entries.filter(e => e.section === 'main');
  const yogaEntries = entries.filter(e => e.section === 'yoga');
  const mainSec = mainEntries.reduce((a, e) => a + (e.workSec || 0) + (e.restSec || 0), 0);
  const yogaSec = yogaEntries.reduce((a, e) => a + (e.workSec || 0) + (e.restSec || 0), 0);
  const cdSec = entries.filter(e => e.section === 'cooldown').reduce((a, e) => a + e.workSec + e.restSec, 0);

  const workEntries = mainEntries.length ? mainEntries : yogaEntries;
  const muscles = {};
  const cats = {};
  const diffs = { 1: 0, 2: 0, 3: 0 };
  const equipUsed = new Set();
  const names = new Set();

  workEntries.forEach(e => {
    if (e.exercise) {
      (e.exercise.muscles || []).forEach(m => { muscles[m] = (muscles[m] || 0) + 1; });
      const cat = e.exercise.cat || 'unknown';
      cats[cat] = (cats[cat] || 0) + 1;
      diffs[e.exercise.diff || 1] = (diffs[e.exercise.diff || 1] || 0) + 1;
      (e.exercise.equip || []).forEach(eq => equipUsed.add(eq));
      names.add(e.exercise.name);
    }
  });

  const totalWork = workEntries.reduce((a, e) => a + (e.workSec || 0), 0);
  const totalRest = workEntries.reduce((a, e) => a + (e.restSec || 0), 0);

  return {
    total_duration_sec: warmupSec + mainSec + yogaSec + cdSec,
    warmup_duration_sec: warmupSec,
    main_duration_sec: mainSec + yogaSec,
    cooldown_duration_sec: cdSec,
    unique_exercises: names.size,
    muscle_groups_hit: muscles,
    category_distribution: cats,
    avg_work_sec: workEntries.length ? Math.round(totalWork / workEntries.length) : 0,
    avg_rest_sec: workEntries.length ? Math.round(totalRest / workEntries.length) : 0,
    work_rest_ratio: totalRest > 0 ? +(totalWork / totalRest).toFixed(2) : Infinity,
    equipment_used: [...equipUsed],
    difficulty_distribution: diffs
  };
}

function programToJSON(prog, profile, equipment, resolvedWeeks, DB) {
  const allExercises = [];
  const swaps = [];
  const repProgressions = {};
  let workoutDays = 0, restDays = 0, walkDays = 0, assessmentDays = 0;

  const weeks = resolvedWeeks.map(rw => {
    const days = rw.days.map(d => {
      if (d.kind === 'rest') { restDays++; return { day: d.day, kind: 'rest' }; }
      if (d.kind === 'walk') { walkDays++; return { day: d.day, kind: 'walk', target_minutes: d.target_minutes }; }
      if (d.kind === 'assessment') {
        assessmentDays++;
        return { day: d.day, kind: 'assessment', resolved: d.resolved };
      }
      workoutDays++;
      const exercises = (d.resolved && d.resolved.exercises) ? d.resolved.exercises.map(ex => {
        const dbEntry = DB.find(e => e.name === ex.name);
        allExercises.push(ex.name);
        if (ex.original && ex.original !== ex.name) {
          swaps.push({ original: ex.original, swapped_to: ex.name, week: rw.week, day: d.day, reason: ex.needs_manual_swap ? 'no_valid_swap' : 'capability_filter' });
        }
        // Track rep progressions
        if (ex.reps) {
          if (!repProgressions[ex.name]) repProgressions[ex.name] = [];
          repProgressions[ex.name].push({ week: rw.week, reps: ex.reps });
        }
        return {
          name: ex.name, sets: ex.sets, reps: ex.reps, rest_sec: ex.rest_sec,
          swapped_from: ex.original && ex.original !== ex.name ? ex.original : undefined,
          needs_manual_swap: ex.needs_manual_swap || false,
          muscles: dbEntry ? dbEntry.muscles : [], equipment: dbEntry ? dbEntry.equip : []
        };
      }) : [];
      return {
        day: d.day, kind: d.kind,
        resolved: { title: d.resolved ? d.resolved.title : '', exercises }
      };
    });
    return { week: rw.week, theme: rw.theme, rpe_target: rw.rpe_target, deload: rw.deload, days };
  });

  // Muscle coverage per week
  const muscleCoverage = {};
  weeks.forEach(w => {
    const wk = {};
    w.days.forEach(d => {
      if (d.resolved && d.resolved.exercises) {
        d.resolved.exercises.forEach(ex => {
          (ex.muscles || []).forEach(m => { wk[m] = (wk[m] || 0) + 1; });
        });
      }
    });
    muscleCoverage['week_' + w.week] = wk;
  });

  // Exercise frequency
  const freq = {};
  allExercises.forEach(n => { freq[n] = (freq[n] || 0) + 1; });

  // Volume trend (total sets per week)
  const volumeTrend = weeks.map(w => {
    let sets = 0;
    w.days.forEach(d => {
      if (d.resolved && d.resolved.exercises) {
        d.resolved.exercises.forEach(ex => { sets += (ex.sets || 0); });
      }
    });
    return sets;
  });

  return {
    program_id: prog.id,
    program_name: prog.name,
    duration_weeks: prog.duration_weeks,
    sessions_per_week: prog.sessions_per_week,
    profile,
    equipment,
    weeks,
    program_stats: {
      total_workout_days: workoutDays,
      total_rest_days: restDays,
      total_walk_days: walkDays,
      total_assessment_days: assessmentDays,
      unique_exercises_across_program: new Set(allExercises).size,
      exercise_frequency: freq,
      muscle_coverage_per_week: muscleCoverage,
      progression_analysis: { rep_progression: repProgressions, volume_trend: volumeTrend },
      swaps_applied: swaps
    }
  };
}

function workoutsToMarkdown(workouts) {
  let md = '# Workout Audit Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n`;
  md += `Total workouts: ${workouts.length}\n\n`;

  // Group by type
  const byType = {};
  workouts.forEach(w => {
    const t = w.config.type;
    if (!byType[t]) byType[t] = [];
    byType[t].push(w);
  });

  for (const [type, wks] of Object.entries(byType)) {
    md += `## ${type.toUpperCase()} (${wks.length} workouts)\n\n`;

    // Summary stats
    const avgDur = Math.round(wks.reduce((a, w) => a + w.stats.total_duration_sec, 0) / wks.length);
    const avgEx = Math.round(wks.reduce((a, w) => a + w.stats.unique_exercises, 0) / wks.length);
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Avg duration | ${Math.floor(avgDur / 60)}:${String(avgDur % 60).padStart(2, '0')} |\n`;
    md += `| Avg exercises | ${avgEx} |\n`;
    md += `| Avg work:rest | ${(wks.reduce((a, w) => a + w.stats.work_rest_ratio, 0) / wks.length).toFixed(2)} |\n\n`;

    // Show first 3 workouts in detail
    wks.slice(0, 3).forEach(w => {
      md += `### ${w.id}\n`;
      md += `Profile: ${w.profile.fitness_level} | Equipment: ${w.equipment.join(', ')} | Duration: ${w.config.duration}min\n\n`;
      if (w.warmup) {
        md += '**Warmup:**\n';
        w.warmup.forEach(e => { md += `- ${e.name} (${e.workSec}s)\n`; });
      }
      if (w.main) {
        md += '\n**Main:**\n';
        w.main.forEach(e => { md += `- ${e.name} [${e.cat}] — ${e.reps_or_sec} / rest ${e.restSec}s / ${e.intensity}\n`; });
      }
      if (w.yoga) {
        md += '\n**Yoga:**\n';
        w.yoga.forEach(e => { md += `- ${e.name} [${e.phase}] — ${e.workSec}s\n`; });
      }
      if (w.cooldown) {
        md += '\n**Cooldown:**\n';
        w.cooldown.forEach(e => { md += `- ${e.name} (${e.workSec}s)\n`; });
      }
      md += '\n---\n\n';
    });
    if (wks.length > 3) md += `*(${wks.length - 3} more workouts in JSON output)*\n\n`;
  }
  return md;
}

function programsToMarkdown(programs) {
  let md = '# Program Audit Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n`;
  md += `Total program resolutions: ${programs.length}\n\n`;

  programs.forEach(p => {
    md += `## ${p.program_name}\n`;
    md += `Profile: ${p.profile.fitness_level} | Equipment: ${p.equipment.join(', ')}\n`;
    md += `${p.duration_weeks} weeks, ${p.sessions_per_week}x/wk\n\n`;
    md += `| Stat | Value |\n|---|---|\n`;
    md += `| Workout days | ${p.program_stats.total_workout_days} |\n`;
    md += `| Unique exercises | ${p.program_stats.unique_exercises_across_program} |\n`;
    md += `| Swaps applied | ${p.program_stats.swaps_applied.length} |\n`;
    md += `| Volume trend | ${p.program_stats.progression_analysis.volume_trend.join(' → ')} |\n\n`;

    p.weeks.forEach(w => {
      md += `### Week ${w.week}: ${w.theme}\n`;
      w.days.forEach(d => {
        if (d.kind === 'rest') { md += `- Day ${d.day}: Rest\n`; return; }
        if (d.kind === 'walk') { md += `- Day ${d.day}: Walk ${d.target_minutes}min\n`; return; }
        if (d.kind === 'assessment') { md += `- Day ${d.day}: Assessment\n`; return; }
        md += `- Day ${d.day}: **${d.resolved.title}**\n`;
        (d.resolved.exercises || []).forEach(ex => {
          const swap = ex.swapped_from ? ` (swapped from ${ex.swapped_from})` : '';
          md += `  - ${ex.name} ${ex.sets}x${ex.reps}${swap}\n`;
        });
      });
      md += '\n';
    });
    md += '---\n\n';
  });
  return md;
}

module.exports = { workoutToJSON, programToJSON, workoutsToMarkdown, programsToMarkdown };
