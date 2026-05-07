#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { loadAppModules, createEngine, DEFAULT_FOCUS } = require('./engine');
const { PROFILES, EQUIPMENT } = require('./profiles');
const { workoutToJSON, programToJSON, workoutsToMarkdown, programsToMarkdown } = require('./formatter');

// ── CLI args ─────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    count: 20,
    types: ['strength', 'hiit', 'conditioning', 'functional', 'yoga'],
    profiles: Object.keys(PROFILES),
    equipment: Object.keys(EQUIPMENT),
    durations: [20, 30, 45],
    format: 'both',
    output: path.join(__dirname, 'output'),
    seed: null,
    programs: false,
    programIds: null,
    intensities: ['light', 'moderate', 'high'],
    sets: [1, 2],
    yogaStyles: ['vinyasa', 'hatha', 'yin', 'power', 'restorative'],
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = args[i + 1];
    switch (a) {
      case '--count': opts.count = parseInt(next); i++; break;
      case '--types': opts.types = next.split(','); i++; break;
      case '--profiles': opts.profiles = next.split(','); i++; break;
      case '--equipment': opts.equipment = next.split(','); i++; break;
      case '--durations': opts.durations = next.split(',').map(Number); i++; break;
      case '--format': opts.format = next; i++; break;
      case '--output': opts.output = next; i++; break;
      case '--seed': opts.seed = parseInt(next); i++; break;
      case '--programs': opts.programs = true; break;
      case '--program-ids': opts.programIds = next.split(','); i++; break;
      case '--intensities': opts.intensities = next.split(','); i++; break;
      case '--sets': opts.sets = next.split(',').map(Number); i++; break;
      case '--yoga-styles': opts.yogaStyles = next.split(','); i++; break;
      case '--help': case '-h':
        console.log(`
Workout Audit Generator

Usage: node generate.js [options]

Options:
  --count N           Workouts per combo (default: 20)
  --types LIST        Comma-separated: strength,hiit,conditioning,functional,yoga
  --profiles LIST     Comma-separated: ${Object.keys(PROFILES).join(',')}
  --equipment LIST    Comma-separated: ${Object.keys(EQUIPMENT).join(',')}
  --durations LIST    Comma-separated minutes (default: 20,30,45)
  --intensities LIST  Comma-separated: light,moderate,high (default: all)
  --sets LIST         Comma-separated set counts (default: 1,2)
  --yoga-styles LIST  Comma-separated: vinyasa,hatha,yin,power,restorative
  --format FORMAT     json | markdown | both (default: both)
  --output DIR        Output directory (default: tools/workout-audit/output/)
  --seed N            Random seed for reproducibility
  --programs          Generate program resolutions
  --program-ids LIST  Comma-separated program IDs (default: all)
  -h, --help          Show this help
`);
        process.exit(0);
    }
  }
  return opts;
}

// ── Main ─────────────────────────────────────────────────
function main() {
  const opts = parseArgs();
  const rootDir = path.join(__dirname, '..', '..');

  console.log('Loading app modules...');
  const app = loadAppModules(rootDir);
  console.log(`  DB: ${app.DB.length} exercises`);
  console.log(`  Programs: ${app.programs ? app.programs.PROGRAMS.length : 0}`);

  fs.mkdirSync(opts.output, { recursive: true });

  // ── Generate single workouts ───────────────────────────
  const allWorkouts = [];
  let generated = 0;
  let failed = 0;
  let seedCounter = opts.seed || 42;

  const combos = [];
  for (const type of opts.types) {
    for (const profileKey of opts.profiles) {
      for (const equipKey of opts.equipment) {
        if (type === 'yoga') {
          for (const style of opts.yogaStyles) {
            for (const dur of opts.durations) {
              combos.push({ type, profileKey, equipKey, duration: dur, intensity: 'moderate', sets: 1, yogaStyle: style });
            }
          }
        } else {
          for (const dur of opts.durations) {
            for (const intensity of opts.intensities) {
              for (const sets of opts.sets) {
                combos.push({ type, profileKey, equipKey, duration: dur, intensity, sets });
              }
            }
          }
        }
      }
    }
  }

  console.log(`\nGenerating ${combos.length} combos x ${opts.count} each = ${combos.length * opts.count} workouts...`);

  for (const combo of combos) {
    const profile = PROFILES[combo.profileKey];
    const equipArr = EQUIPMENT[combo.equipKey];
    if (!profile || !equipArr) continue;

    for (let n = 0; n < opts.count; n++) {
      const engine = createEngine(app, seedCounter++);
      const config = {
        type: combo.type,
        duration: combo.duration,
        intensity: combo.intensity,
        sets: combo.sets,
        yogaStyle: combo.yogaStyle,
        yogaExperience: profile.fitness_level === 'advanced' ? 'experienced' : profile.fitness_level === 'intermediate' ? 'some' : 'new',
      };

      const entries = engine.generateWorkout(config, equipArr, profile, [], { ...DEFAULT_FOCUS });
      if (!entries) { failed++; continue; }

      const id = `${combo.type.slice(0, 3)}-${combo.profileKey.slice(0, 3)}-${combo.equipKey}-${combo.duration}m-${combo.intensity.slice(0, 3)}-${combo.sets}s-${String(n + 1).padStart(3, '0')}`;
      const w = workoutToJSON({
        id, config, profile: { ...profile, profile_name: combo.profileKey },
        equipment: equipArr, entries
      });
      allWorkouts.push(w);
      generated++;
    }
  }

  console.log(`  Generated: ${generated}, Failed: ${failed}`);

  // ── Generate program resolutions ───────────────────────
  const allPrograms = [];
  if (opts.programs && app.programs) {
    const programList = opts.programIds
      ? app.programs.PROGRAMS.filter(p => opts.programIds.includes(p.id))
      : app.programs.PROGRAMS;

    console.log(`\nResolving ${programList.length} programs x ${opts.profiles.length} profiles x ${opts.equipment.length} equipment = ${programList.length * opts.profiles.length * opts.equipment.length} resolutions...`);

    for (const prog of programList) {
      for (const profileKey of opts.profiles) {
        for (const equipKey of opts.equipment) {
          const profile = PROFILES[profileKey];
          const equipArr = EQUIPMENT[equipKey];
          if (!profile || !equipArr) continue;

          const engine = createEngine(app, seedCounter++);
          const resolvedWeeks = engine.resolveProgram(prog, profile, equipArr);
          const result = programToJSON(prog, { ...profile, profile_name: profileKey }, equipArr, resolvedWeeks, app.DB);
          allPrograms.push(result);
        }
      }
    }
    console.log(`  Program resolutions: ${allPrograms.length}`);
  }

  // ── Write output ───────────────────────────────────────
  if (opts.format === 'json' || opts.format === 'both') {
    const jsonPath = path.join(opts.output, 'workouts.json');
    fs.writeFileSync(jsonPath, JSON.stringify(allWorkouts, null, 2));
    console.log(`\nJSON: ${jsonPath} (${(fs.statSync(jsonPath).size / 1024).toFixed(0)} KB)`);

    if (allPrograms.length) {
      const progPath = path.join(opts.output, 'programs.json');
      fs.writeFileSync(progPath, JSON.stringify(allPrograms, null, 2));
      console.log(`JSON: ${progPath} (${(fs.statSync(progPath).size / 1024).toFixed(0)} KB)`);
    }
  }

  if (opts.format === 'markdown' || opts.format === 'both') {
    const mdPath = path.join(opts.output, 'workouts.md');
    fs.writeFileSync(mdPath, workoutsToMarkdown(allWorkouts));
    console.log(`Markdown: ${mdPath}`);

    if (allPrograms.length) {
      const progMdPath = path.join(opts.output, 'programs.md');
      fs.writeFileSync(progMdPath, programsToMarkdown(allPrograms));
      console.log(`Markdown: ${progMdPath}`);
    }
  }

  // ── Summary stats ──────────────────────────────────────
  console.log('\n── Summary ──');
  const byType = {};
  allWorkouts.forEach(w => { byType[w.config.type] = (byType[w.config.type] || 0) + 1; });
  Object.entries(byType).forEach(([t, n]) => console.log(`  ${t}: ${n} workouts`));
  if (allPrograms.length) console.log(`  programs: ${allPrograms.length} resolutions`);
  console.log(`  total: ${allWorkouts.length + allPrograms.length} outputs`);
}

main();
