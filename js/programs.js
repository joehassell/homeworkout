/**
 * Programs — static library of multi-week training programs.
 * Sprint 8a: First Move only. Remaining 11 programs ship in Sprint 8b.
 */
(function () {
  'use strict';

  var PROGRAMS = [
    {
      id: 'prog_first_move_v1',
      slug: 'first-move-foundation',
      name: 'First Move  - 4-Week Foundation',
      short_name: 'First Move',
      cover_color: '#4CAF50',
      badge: 'TRIAL',
      is_trial_eligible: true,
      pro_required: false,
      duration_weeks: 4,
      sessions_per_week: 3,
      est_minutes_per_session: 28,
      primary_goal: 'foundation',
      secondary_goals: ['mobility', 'habit'],
      why_it_works: 'Three sessions a week is the minimum effective dose. Below that you don\'t adapt; above that you don\'t stick with it as a beginner. We rotate three full-body templates (A: squat-push, B: hinge-pull, C: full-body flow) so you see every pattern twice a week and never get redundant. Reps go up by one each week  - your nervous system catches up before the muscles complain.',
      audience: {
        fitness_level_min: 'untrained',
        fitness_level_max: 'beginner',
        age_band_ok: ['under_35', '35-54', '55-69', '70+'],
        pregnancy_safe: 'yes',
        requires_floor: true,
        contraindicated_for: []
      },
      equipment_required: ['bodyweight', 'mat'],
      equipment_optional: ['dumbbell', 'resistance band'],
      difficulty_tracks: [
        { id: 'A', label: 'Standard' }
      ],
      progression_scheme: {
        type: 'linear_reps',
        rule: '+1 rep per exercise per week, capped at top of range'
      },
      milestones: [
        {
          at_week: 1, day: 1, id: 'm_baseline', kind: 'assessment',
          tests: [
            { id: 'pushup_max', name: 'Push-Up Max (60s)', record: 'count' },
            { id: 'plank_hold', name: 'Plank Hold', record: 'time_sec' },
            { id: 'squat_max', name: 'Air Squat Max (60s)', record: 'count' },
            { id: 'sit_reach', name: 'Sit-and-Reach', record: 'cm' }
          ]
        },
        {
          at_week: 4, day: 3, id: 'm_retest', kind: 'assessment',
          tests: [
            { id: 'pushup_max', name: 'Push-Up Max (60s)', record: 'count' },
            { id: 'plank_hold', name: 'Plank Hold', record: 'time_sec' },
            { id: 'squat_max', name: 'Air Squat Max (60s)', record: 'count' },
            { id: 'sit_reach', name: 'Sit-and-Reach', record: 'cm' }
          ],
          target_rule: 'beat_baseline_by_10pct'
        }
      ],
      weeks: [
        // ── Week 1 ───────────────────────────────────────
        {
          week: 1,
          theme: 'Foundation  - learn the patterns',
          intent: 'Establish technique and build a 3\u00d7/week rhythm.',
          rpe_target: 6,
          deload: false,
          days: [
            {
              day: 1, kind: 'assessment',
              slot: {
                type: 'assessment', title: 'Baseline Assessment',
                warmup: 'standard',
                tests: [
                  { id: 'pushup_max', name: 'Push-Up Max (60s)', record: 'count' },
                  { id: 'plank_hold', name: 'Plank Hold', record: 'time_sec' },
                  { id: 'squat_max', name: 'Air Squat Max (60s)', record: 'count' },
                  { id: 'sit_reach', name: 'Sit-and-Reach', record: 'cm' }
                ]
              },
              coaching_note: 'Go all-out on each test. This is your baseline  - we\'ll retest in 4 weeks.'
            },
            { day: 2, kind: 'rest' },
            {
              day: 3, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation A  - Squat & Push',
                duration_min: 28,
                exercises: [
                  { name: 'Air Squat', sets: 3, reps: '8-10', rest_sec: 60, swap_alternatives: ['Goblet Squat', 'Box Squat', 'Sit-to-Stand from Chair', 'Heel-Elevated Squat to Box', 'Glute Bridge', 'Wall Sits'], upgrade_for_advanced: ['Goblet Squat', 'Front Squat'] },
                  { name: 'Incline Push-Ups', sets: 3, reps: '6-10', rest_sec: 60, swap_alternatives: ['Knee Push-Ups', 'Push-Ups', 'Wall Push-Ups'], upgrade_for_advanced: ['Push-Ups', 'Decline Push-Ups'] },
                  { name: 'Glute Bridge', sets: 3, reps: '12-15', rest_sec: 45, swap_alternatives: ['Single-Leg Glute Bridge', 'Sit-to-Stand from Chair'], upgrade_for_advanced: ['Single-Leg Glute Bridge', 'Hip Thrust'] },
                  { name: 'Dead Bug', sets: 3, reps: '30s', rest_sec: 30, swap_alternatives: ['Bird Dog', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Cat-Cow', sets: 2, reps: '30s', rest_sec: 15, swap_alternatives: [] }
                ]
              },
              coaching_note: 'Slow and clean reps beat fast and sloppy. Pause at the bottom of every squat.'
            },
            { day: 4, kind: 'rest' },
            {
              day: 5, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation B  - Hinge & Pull',
                duration_min: 28,
                exercises: [
                  { name: 'Romanian Deadlift', sets: 3, reps: '8-12', rest_sec: 60, swap_alternatives: ['Single-Leg RDL', 'Glute Bridge', 'Single-Leg Glute Bridge', 'Hip Hinge Stick Work', 'Standing Hip Extension', 'Sit-to-Stand from Chair'] },
                  { name: 'Inverted Row', sets: 3, reps: '8-12', rest_sec: 60, swap_alternatives: ['Doorframe Row', 'Banded Pull-Aparts', 'Dumbbell Row', 'Towel Row'], upgrade_for_advanced: ['Dumbbell Row', 'Bent-Over Barbell Row'] },
                  { name: 'Single-Leg Balance', sets: 3, reps: '20s/side', rest_sec: 30, swap_alternatives: [] },
                  { name: 'Bird Dog', sets: 3, reps: '30s', rest_sec: 30, swap_alternatives: ['Dead Bug', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Side-Lying T-Spine Rotation', sets: 2, reps: '8/side', rest_sec: 15, swap_alternatives: ['Cat-Cow', 'Standing Pallof Press'] }
                ]
              },
              coaching_note: 'On the RDL, think about pushing your hips back like you\'re closing a car door. Feel the hamstrings stretch.'
            },
            { day: 6, kind: 'walk', target_minutes: 20, coaching_note: 'Easy pace, conversational.' },
            { day: 7, kind: 'rest' }
          ]
        },
        // ── Week 2 ───────────────────────────────────────
        {
          week: 2,
          theme: 'Build consistency',
          intent: 'Add 1 rep per exercise. Same movements, building familiarity.',
          rpe_target: 6,
          deload: false,
          days: [
            {
              day: 1, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation A  - Squat & Push',
                duration_min: 28,
                exercises: [
                  { name: 'Air Squat', sets: 3, reps: '9-11', rest_sec: 60, swap_alternatives: ['Goblet Squat', 'Box Squat', 'Sit-to-Stand from Chair', 'Heel-Elevated Squat to Box', 'Glute Bridge', 'Wall Sits'], upgrade_for_advanced: ['Goblet Squat', 'Front Squat'] },
                  { name: 'Incline Push-Ups', sets: 3, reps: '7-11', rest_sec: 60, swap_alternatives: ['Knee Push-Ups', 'Push-Ups', 'Wall Push-Ups'], upgrade_for_advanced: ['Push-Ups', 'Decline Push-Ups'] },
                  { name: 'Glute Bridge', sets: 3, reps: '13-16', rest_sec: 45, swap_alternatives: ['Single-Leg Glute Bridge', 'Sit-to-Stand from Chair'], upgrade_for_advanced: ['Single-Leg Glute Bridge', 'Hip Thrust'] },
                  { name: 'Dead Bug', sets: 3, reps: '35s', rest_sec: 30, swap_alternatives: ['Bird Dog', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Cat-Cow', sets: 2, reps: '30s', rest_sec: 15, swap_alternatives: [] }
                ]
              },
              coaching_note: 'Same movements as week 1, one more rep. You\'ll feel the difference.'
            },
            { day: 2, kind: 'rest' },
            {
              day: 3, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation B  - Hinge & Pull',
                duration_min: 28,
                exercises: [
                  { name: 'Romanian Deadlift', sets: 3, reps: '9-13', rest_sec: 60, swap_alternatives: ['Single-Leg RDL', 'Glute Bridge', 'Single-Leg Glute Bridge', 'Hip Hinge Stick Work', 'Standing Hip Extension', 'Sit-to-Stand from Chair'] },
                  { name: 'Inverted Row', sets: 3, reps: '9-13', rest_sec: 60, swap_alternatives: ['Doorframe Row', 'Banded Pull-Aparts', 'Dumbbell Row', 'Towel Row'], upgrade_for_advanced: ['Dumbbell Row', 'Bent-Over Barbell Row'] },
                  { name: 'Single-Leg Balance', sets: 3, reps: '25s/side', rest_sec: 30, swap_alternatives: [] },
                  { name: 'Bird Dog', sets: 3, reps: '35s', rest_sec: 30, swap_alternatives: ['Dead Bug', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Side-Lying T-Spine Rotation', sets: 2, reps: '10/side', rest_sec: 15, swap_alternatives: ['Cat-Cow', 'Standing Pallof Press'] }
                ]
              },
              coaching_note: 'On the inverted row, squeeze your shoulder blades together at the top.'
            },
            { day: 4, kind: 'rest' },
            {
              day: 5, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation C  - Full-Body Flow',
                duration_min: 28,
                exercises: [
                  { name: 'Goblet Squat', sets: 2, reps: '10', rest_sec: 60, swap_alternatives: ['Air Squat', 'Sit-to-Stand from Chair', 'Heel-Elevated Squat to Box', 'Wall Sits'] },
                  { name: 'Push-Ups', sets: 2, reps: '7-11', rest_sec: 60, swap_alternatives: ['Incline Push-Ups', 'Knee Push-Ups', 'Wall Push-Ups'] },
                  { name: 'Single-Leg RDL', sets: 2, reps: '7/side', rest_sec: 45, swap_alternatives: ['Romanian Deadlift', 'Glute Bridge', 'Single-Leg Glute Bridge'] },
                  { name: 'Front Plank', sets: 2, reps: '35-50s', rest_sec: 30, swap_alternatives: ['Dead Bug', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Standing Hip Extension', sets: 2, reps: '12-15/side', rest_sec: 30, swap_alternatives: ['Glute Squeeze', 'Hip Hinge Stick Work'] },
                  { name: 'Dead Bug', sets: 2, reps: '35s', rest_sec: 30, swap_alternatives: ['Bird Dog', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'World\'s Greatest Stretch', sets: 2, reps: '30s/side', rest_sec: 15, swap_alternatives: ['Cat-Cow', 'Standing Pallof Press'] }
                ]
              },
              coaching_note: 'This is a flow  - keep rest short and move with purpose.'
            },
            { day: 6, kind: 'walk', target_minutes: 25, coaching_note: 'Easy pace, conversational.' },
            { day: 7, kind: 'rest' }
          ]
        },
        // ── Week 3 ───────────────────────────────────────
        {
          week: 3,
          theme: 'Push the reps',
          intent: 'Another rep bump. Technique should feel more natural now.',
          rpe_target: 7,
          deload: false,
          days: [
            {
              day: 1, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation A  - Squat & Push',
                duration_min: 28,
                exercises: [
                  { name: 'Air Squat', sets: 3, reps: '10-12', rest_sec: 60, swap_alternatives: ['Goblet Squat', 'Box Squat', 'Sit-to-Stand from Chair', 'Heel-Elevated Squat to Box', 'Glute Bridge', 'Wall Sits'], upgrade_for_advanced: ['Goblet Squat', 'Front Squat'] },
                  { name: 'Incline Push-Ups', sets: 3, reps: '8-12', rest_sec: 60, swap_alternatives: ['Knee Push-Ups', 'Push-Ups', 'Wall Push-Ups'], upgrade_for_advanced: ['Push-Ups', 'Decline Push-Ups'] },
                  { name: 'Glute Bridge', sets: 3, reps: '14-17', rest_sec: 45, swap_alternatives: ['Single-Leg Glute Bridge', 'Sit-to-Stand from Chair'], upgrade_for_advanced: ['Single-Leg Glute Bridge', 'Hip Thrust'] },
                  { name: 'Dead Bug', sets: 3, reps: '40s', rest_sec: 30, swap_alternatives: ['Bird Dog', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Cat-Cow', sets: 2, reps: '30s', rest_sec: 15, swap_alternatives: [] }
                ]
              },
              coaching_note: 'You\'re at week 3  - reps are higher now. Maintain form even when fatigued.'
            },
            { day: 2, kind: 'rest' },
            {
              day: 3, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation B  - Hinge & Pull',
                duration_min: 28,
                exercises: [
                  { name: 'Romanian Deadlift', sets: 3, reps: '10-14', rest_sec: 60, swap_alternatives: ['Single-Leg RDL', 'Glute Bridge', 'Single-Leg Glute Bridge', 'Hip Hinge Stick Work', 'Standing Hip Extension', 'Sit-to-Stand from Chair'] },
                  { name: 'Inverted Row', sets: 3, reps: '10-14', rest_sec: 60, swap_alternatives: ['Doorframe Row', 'Banded Pull-Aparts', 'Dumbbell Row', 'Towel Row'], upgrade_for_advanced: ['Dumbbell Row', 'Bent-Over Barbell Row'] },
                  { name: 'Single-Leg Balance', sets: 3, reps: '30s/side', rest_sec: 30, swap_alternatives: [] },
                  { name: 'Bird Dog', sets: 3, reps: '40s', rest_sec: 30, swap_alternatives: ['Dead Bug', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Side-Lying T-Spine Rotation', sets: 2, reps: '12/side', rest_sec: 15, swap_alternatives: ['Cat-Cow', 'Standing Pallof Press'] }
                ]
              },
              coaching_note: 'Focus on full range of motion. Better to do fewer reps with perfect form.'
            },
            { day: 4, kind: 'rest' },
            {
              day: 5, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation C  - Full-Body Flow',
                duration_min: 28,
                exercises: [
                  { name: 'Goblet Squat', sets: 2, reps: '11', rest_sec: 60, swap_alternatives: ['Air Squat', 'Sit-to-Stand from Chair', 'Heel-Elevated Squat to Box', 'Wall Sits'] },
                  { name: 'Push-Ups', sets: 2, reps: '8-12', rest_sec: 60, swap_alternatives: ['Incline Push-Ups', 'Knee Push-Ups', 'Wall Push-Ups'] },
                  { name: 'Single-Leg RDL', sets: 2, reps: '8/side', rest_sec: 45, swap_alternatives: ['Romanian Deadlift', 'Glute Bridge', 'Single-Leg Glute Bridge'] },
                  { name: 'Front Plank', sets: 2, reps: '40-55s', rest_sec: 30, swap_alternatives: ['Dead Bug', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Standing Hip Extension', sets: 2, reps: '12-15/side', rest_sec: 30, swap_alternatives: ['Glute Squeeze', 'Hip Hinge Stick Work'] },
                  { name: 'Dead Bug', sets: 2, reps: '40s', rest_sec: 30, swap_alternatives: ['Bird Dog', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'World\'s Greatest Stretch', sets: 2, reps: '30s/side', rest_sec: 15, swap_alternatives: ['Cat-Cow', 'Standing Pallof Press'] }
                ]
              },
              coaching_note: 'Smooth transitions. You know these movements now  - own them.'
            },
            { day: 6, kind: 'walk', target_minutes: 30, coaching_note: 'Easy pace, conversational.' },
            { day: 7, kind: 'rest' }
          ]
        },
        // ── Week 4 ───────────────────────────────────────
        {
          week: 4,
          theme: 'Peak and retest',
          intent: 'Final rep bump, then test day. Show yourself what you built.',
          rpe_target: 7,
          deload: false,
          days: [
            {
              day: 1, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation A  - Squat & Push',
                duration_min: 28,
                exercises: [
                  { name: 'Air Squat', sets: 3, reps: '11-13', rest_sec: 60, swap_alternatives: ['Goblet Squat', 'Box Squat', 'Sit-to-Stand from Chair', 'Heel-Elevated Squat to Box', 'Glute Bridge', 'Wall Sits'], upgrade_for_advanced: ['Goblet Squat', 'Front Squat'] },
                  { name: 'Incline Push-Ups', sets: 3, reps: '9-13', rest_sec: 60, swap_alternatives: ['Knee Push-Ups', 'Push-Ups', 'Wall Push-Ups'], upgrade_for_advanced: ['Push-Ups', 'Decline Push-Ups'] },
                  { name: 'Glute Bridge', sets: 3, reps: '15-18', rest_sec: 45, swap_alternatives: ['Single-Leg Glute Bridge', 'Sit-to-Stand from Chair'], upgrade_for_advanced: ['Single-Leg Glute Bridge', 'Hip Thrust'] },
                  { name: 'Dead Bug', sets: 3, reps: '45s', rest_sec: 30, swap_alternatives: ['Bird Dog', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Cat-Cow', sets: 2, reps: '30s', rest_sec: 15, swap_alternatives: [] }
                ]
              },
              coaching_note: 'Final push on reps. You\'re stronger than week 1  - prove it.'
            },
            { day: 2, kind: 'rest' },
            {
              day: 3, kind: 'assessment',
              slot: {
                type: 'assessment', title: 'Week 4 Retest',
                warmup: 'standard',
                tests: [
                  { id: 'pushup_max', name: 'Push-Up Max (60s)', record: 'count' },
                  { id: 'plank_hold', name: 'Plank Hold', record: 'time_sec' },
                  { id: 'squat_max', name: 'Air Squat Max (60s)', record: 'count' },
                  { id: 'sit_reach', name: 'Sit-and-Reach', record: 'cm' }
                ]
              },
              coaching_note: 'Same four tests as week 1. Rest well the day before. Give everything.'
            },
            { day: 4, kind: 'rest' },
            {
              day: 5, kind: 'workout',
              slot: {
                type: 'inline',
                title: 'Foundation C  - Full-Body Flow (Victory Lap)',
                duration_min: 28,
                exercises: [
                  { name: 'Goblet Squat', sets: 2, reps: '12', rest_sec: 60, swap_alternatives: ['Air Squat', 'Sit-to-Stand from Chair', 'Heel-Elevated Squat to Box', 'Wall Sits'] },
                  { name: 'Push-Ups', sets: 2, reps: '9-13', rest_sec: 60, swap_alternatives: ['Incline Push-Ups', 'Knee Push-Ups', 'Wall Push-Ups'] },
                  { name: 'Single-Leg RDL', sets: 2, reps: '8/side', rest_sec: 45, swap_alternatives: ['Romanian Deadlift', 'Glute Bridge', 'Single-Leg Glute Bridge'] },
                  { name: 'Front Plank', sets: 2, reps: '45-60s', rest_sec: 30, swap_alternatives: ['Dead Bug', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'Standing Hip Extension', sets: 2, reps: '12-15/side', rest_sec: 30, swap_alternatives: ['Glute Squeeze', 'Hip Hinge Stick Work'] },
                  { name: 'Dead Bug', sets: 2, reps: '45s', rest_sec: 30, swap_alternatives: ['Bird Dog', 'Standing Pallof Press', 'Standing Wood-Chop'] },
                  { name: 'World\'s Greatest Stretch', sets: 2, reps: '30s/side', rest_sec: 15, swap_alternatives: ['Cat-Cow', 'Standing Pallof Press'] }
                ]
              },
              coaching_note: 'Victory lap. Enjoy the movement. You built a habit in 4 weeks.'
            },
            { day: 6, kind: 'walk', target_minutes: 30, coaching_note: 'Celebrate. Walk somewhere new.' },
            { day: 7, kind: 'rest' }
          ]
        }
      ],
      outro: {
        completion_message: 'You\'ve built the habit and the foundation. Three sessions a week for four weeks  - that\'s 12 workouts and real, measurable progress. You\'re ready for more.',
        recommended_next: ['prog_lean_strong_v1', 'prog_calisthenics_v1', 'prog_fat_burn_v1']
      },
      meta: {
        author: 'Home Workout Builder coaching team',
        version: 1,
        last_reviewed: '2026-05-05'
      }
    }
  ];

  window.programs = {
    PROGRAMS: PROGRAMS,
    getProgram: function (id) {
      return PROGRAMS.find(function (p) { return p.id === id; }) || null;
    }
  };
})();
