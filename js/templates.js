(function () {
  'use strict';

  // ── Template database ──────────────────────────────

  const TEMPLATES = [
    // ── Strength ────────────────────────────
    { id:'tpl_strength_fullbody_beg', name:'Full Body Beginner', type:'strength', duration_min:30,
      min_fitness:'beginner', min_equipment:['bodyweight','dumbbell','mat'],
      description:'A simple full-body strength session for beginners.',
      exercises:[
        { name:'Goblet Squat', sets:3, reps:'8-10', rest_sec:90 },
        { name:'Push-Ups', sets:3, reps:'8-12', rest_sec:60 },
        { name:'Dumbbell Row', sets:3, reps:'8-10', rest_sec:90 },
        { name:'Glute Bridge', sets:3, reps:'12-15', rest_sec:60 },
        { name:'Front Plank', sets:3, reps:'30-45s', rest_sec:45 },
      ]},
    { id:'tpl_strength_fullbody_int', name:'Full Body Intermediate', type:'strength', duration_min:45,
      min_fitness:'intermediate', min_equipment:['bodyweight','dumbbell','bench','mat'],
      description:'Balanced push-pull-legs with dumbbells and a bench.',
      exercises:[
        { name:'Bulgarian Split Squat', sets:3, reps:'8-10', rest_sec:90 },
        { name:'Dumbbell Bench Press', sets:4, reps:'8-10', rest_sec:90 },
        { name:'Dumbbell Row', sets:4, reps:'8-10', rest_sec:90 },
        { name:'Romanian Deadlift', sets:3, reps:'10-12', rest_sec:90 },
        { name:'Overhead Press', sets:3, reps:'8-10', rest_sec:90 },
        { name:'Hollow Hold', sets:3, reps:'30s', rest_sec:45 },
      ]},
    { id:'tpl_strength_pushpull', name:'Upper Body Push/Pull', type:'strength', duration_min:40,
      min_fitness:'intermediate', min_equipment:['bodyweight','dumbbell','chinup bar','mat'],
      description:'Superset-style upper body with chin-up bar work.',
      exercises:[
        { name:'Pull-Ups', sets:3, reps:'5-8', rest_sec:90 },
        { name:'Push-Ups', sets:3, reps:'12-15', rest_sec:60 },
        { name:'Dumbbell Row', sets:3, reps:'10-12', rest_sec:90 },
        { name:'Pike Push-Ups', sets:3, reps:'8-10', rest_sec:60 },
        { name:'Hanging Knee Raises', sets:3, reps:'10-12', rest_sec:60 },
        { name:'Inverted Row', sets:3, reps:'8-12', rest_sec:60 },
      ]},
    { id:'tpl_strength_lower', name:'Lower Body Focus', type:'strength', duration_min:35,
      min_fitness:'beginner', min_equipment:['bodyweight','dumbbell','mat'],
      description:'Quad, glute and hamstring emphasis with dumbbells.',
      exercises:[
        { name:'Goblet Squat', sets:4, reps:'10-12', rest_sec:90 },
        { name:'Romanian Deadlift', sets:3, reps:'10-12', rest_sec:90 },
        { name:'Split Squat', sets:3, reps:'10-12', rest_sec:60 },
        { name:'Glute Bridge', sets:3, reps:'15-20', rest_sec:60 },
        { name:'Wall Sits', sets:3, reps:'30-45s', rest_sec:60 },
      ]},
    { id:'tpl_strength_senior', name:'Senior Strength', type:'strength', duration_min:30,
      min_fitness:'untrained', min_equipment:['bodyweight','mat','dumbbell'],
      description:'Gentle strength work for older adults or those starting out.',
      exercises:[
        { name:'Air Squat', sets:2, reps:'8-10', rest_sec:90 },
        { name:'Incline Push-Ups', sets:2, reps:'8-10', rest_sec:90 },
        { name:'Glute Bridge', sets:2, reps:'10-12', rest_sec:60 },
        { name:'Dead Bug', sets:2, reps:'30s', rest_sec:60 },
        { name:'Single-Leg Balance', sets:2, reps:'20s', rest_sec:45 },
      ]},
    { id:'tpl_strength_core', name:'Core & Stability', type:'strength', duration_min:25,
      min_fitness:'beginner', min_equipment:['bodyweight','mat'],
      description:'Focused core circuit for a strong midsection.',
      exercises:[
        { name:'Front Plank', sets:3, reps:'30-45s', rest_sec:30 },
        { name:'Side Plank', sets:3, reps:'20-30s', rest_sec:30 },
        { name:'Dead Bug', sets:3, reps:'30s', rest_sec:30 },
        { name:'Hollow Hold', sets:3, reps:'20-30s', rest_sec:30 },
        { name:'Bicycle Crunch', sets:3, reps:'30s', rest_sec:30 },
        { name:'Mountain Climbers', sets:3, reps:'30s', rest_sec:30 },
      ]},
    { id:'tpl_strength_compound', name:'Heavy Compound', type:'strength', duration_min:45,
      min_fitness:'advanced', min_equipment:['bodyweight','barbell','bench','mat'],
      description:'Big barbell lifts for experienced lifters.',
      exercises:[
        { name:'Back Squat', sets:4, reps:'3-5', rest_sec:180 },
        { name:'Barbell Bench Press', sets:4, reps:'3-5', rest_sec:180 },
        { name:'Deadlift', sets:3, reps:'3-5', rest_sec:180 },
        { name:'Bent-Over Row', sets:3, reps:'6-8', rest_sec:120 },
        { name:'Front Plank', sets:3, reps:'45-60s', rest_sec:60 },
      ]},
    { id:'tpl_strength_kb', name:'Kettlebell Only', type:'strength', duration_min:30,
      min_fitness:'beginner', min_equipment:['kettlebell'],
      description:'Full-body kettlebell session, no other gear needed.',
      exercises:[
        { name:'Kettlebell Swing', sets:4, reps:'12-15', rest_sec:60 },
        { name:'Goblet Squat', sets:3, reps:'10-12', rest_sec:60 },
        { name:'Kettlebell Clean', sets:3, reps:'8-10', rest_sec:60 },
        { name:'Single-Leg RDL', sets:3, reps:'8-10', rest_sec:60 },
        { name:'Front Rack Carry', sets:3, reps:'30s', rest_sec:45 },
      ]},
    // ── HIIT ────────────────────────────────
    { id:'tpl_hiit_tabata', name:'Tabata Classic', type:'hiit', duration_min:20,
      min_fitness:'beginner', min_equipment:['bodyweight'],
      description:'20s on / 10s off, 8 rounds per exercise. The original protocol.',
      exercises:[
        { name:'180 Degree Squat Jumps', sets:1, reps:'20s', rest_sec:10 },
        { name:'Push-Ups', sets:1, reps:'20s', rest_sec:10 },
        { name:'High Knees', sets:1, reps:'20s', rest_sec:10 },
        { name:'Mountain Climbers', sets:1, reps:'20s', rest_sec:10 },
      ]},
    { id:'tpl_hiit_3030', name:'30/30 Intervals', type:'hiit', duration_min:25,
      min_fitness:'beginner', min_equipment:['bodyweight','mat'],
      description:'30 seconds work, 30 seconds rest. Sustainable but effective.',
      exercises:[
        { name:'Air Squat', sets:3, reps:'30s', rest_sec:30 },
        { name:'Push-Ups', sets:3, reps:'30s', rest_sec:30 },
        { name:'Sit-Ups', sets:3, reps:'30s', rest_sec:30 },
        { name:'High Knees', sets:3, reps:'30s', rest_sec:30 },
        { name:'Skaters', sets:3, reps:'30s', rest_sec:30 },
      ]},
    { id:'tpl_hiit_emom', name:'EMOM 20', type:'hiit', duration_min:20,
      min_fitness:'intermediate', min_equipment:['bodyweight','dumbbell'],
      description:'Every minute on the minute for 20 rounds.',
      exercises:[
        { name:'Thrusters', sets:4, reps:'10', rest_sec:20 },
        { name:'Renegade Row', sets:4, reps:'30s', rest_sec:20 },
        { name:'180 Degree Squat Jumps', sets:4, reps:'12', rest_sec:20 },
        { name:'Burpees', sets:4, reps:'8', rest_sec:20 },
        { name:'Dumbbell Snatch', sets:4, reps:'10', rest_sec:20 },
      ]},
    { id:'tpl_hiit_burner', name:'The Burner', type:'hiit', duration_min:15,
      min_fitness:'intermediate', min_equipment:['bodyweight'],
      description:'Short, savage, bodyweight-only blast.',
      exercises:[
        { name:'Burpees', sets:3, reps:'30s', rest_sec:15 },
        { name:'Tuck Jumps', sets:3, reps:'20s', rest_sec:15 },
        { name:'Mountain Climbers', sets:3, reps:'30s', rest_sec:15 },
        { name:'High Knees', sets:3, reps:'20s', rest_sec:15 },
      ]},
    { id:'tpl_hiit_fullblast', name:'Full Body Blast', type:'hiit', duration_min:30,
      min_fitness:'intermediate', min_equipment:['bodyweight','dumbbell'],
      description:'Longer HIIT mixing bodyweight and dumbbell moves.',
      exercises:[
        { name:'Thrusters', sets:3, reps:'30s', rest_sec:20 },
        { name:'Push-Ups', sets:3, reps:'30s', rest_sec:20 },
        { name:'180 Degree Squat Jumps', sets:3, reps:'30s', rest_sec:20 },
        { name:'Renegade Row', sets:3, reps:'30s', rest_sec:20 },
        { name:'Skaters', sets:3, reps:'30s', rest_sec:20 },
        { name:'Mountain Climbers', sets:3, reps:'30s', rest_sec:20 },
      ]},
    { id:'tpl_hiit_beginner', name:'Beginner HIIT', type:'hiit', duration_min:20,
      min_fitness:'untrained', min_equipment:['bodyweight','mat'],
      description:'Low-impact intervals for HIIT newcomers.',
      exercises:[
        { name:'Air Squat', sets:3, reps:'30s', rest_sec:30 },
        { name:'Incline Push-Ups', sets:3, reps:'30s', rest_sec:30 },
        { name:'High Knees', sets:3, reps:'20s', rest_sec:30 },
        { name:'Dead Bug', sets:3, reps:'30s', rest_sec:30 },
      ]},
    // ── Conditioning ────────────────────────
    { id:'tpl_cond_pyramid', name:'Pyramid', type:'conditioning', duration_min:30,
      min_fitness:'beginner', min_equipment:['bodyweight','dumbbell'],
      description:'Build up reps, then climb back down.',
      exercises:[
        { name:'Air Squat', sets:4, reps:'30s', rest_sec:20 },
        { name:'Push-Ups', sets:4, reps:'30s', rest_sec:20 },
        { name:'Goblet Squat', sets:4, reps:'30s', rest_sec:20 },
        { name:'Sit-Ups', sets:4, reps:'30s', rest_sec:20 },
        { name:'Farmer\'s Carry', sets:4, reps:'30s', rest_sec:20 },
      ]},
    { id:'tpl_cond_ladder', name:'Ladder', type:'conditioning', duration_min:25,
      min_fitness:'intermediate', min_equipment:['bodyweight','kettlebell'],
      description:'Ascending rep ladder with kettlebell and bodyweight.',
      exercises:[
        { name:'Kettlebell Swing', sets:4, reps:'30s', rest_sec:20 },
        { name:'Push-Ups', sets:4, reps:'30s', rest_sec:20 },
        { name:'Goblet Squat', sets:4, reps:'30s', rest_sec:20 },
        { name:'Kettlebell Clean', sets:4, reps:'30s', rest_sec:20 },
        { name:'Front Plank', sets:4, reps:'30s', rest_sec:20 },
      ]},
    { id:'tpl_cond_chipper', name:'Chipper', type:'conditioning', duration_min:35,
      min_fitness:'intermediate', min_equipment:['bodyweight','dumbbell','mat'],
      description:'Chip through a long list one exercise at a time.',
      exercises:[
        { name:'Air Squat', sets:3, reps:'40s', rest_sec:20 },
        { name:'Push-Ups', sets:3, reps:'40s', rest_sec:20 },
        { name:'Romanian Deadlift', sets:3, reps:'40s', rest_sec:20 },
        { name:'Sit-Ups', sets:3, reps:'40s', rest_sec:20 },
        { name:'Renegade Row', sets:3, reps:'40s', rest_sec:20 },
        { name:'Mountain Climbers', sets:3, reps:'40s', rest_sec:20 },
      ]},
    { id:'tpl_cond_steady', name:'Steady State', type:'conditioning', duration_min:40,
      min_fitness:'beginner', min_equipment:['bodyweight','skipping rope'],
      description:'Sustained moderate effort with skipping rope and bodyweight.',
      exercises:[
        { name:'Skipping Rope', sets:4, reps:'60s', rest_sec:30 },
        { name:'Air Squat', sets:4, reps:'40s', rest_sec:20 },
        { name:'High Knees', sets:4, reps:'30s', rest_sec:20 },
        { name:'Push-Ups', sets:4, reps:'30s', rest_sec:20 },
        { name:'Butt Kicks', sets:4, reps:'30s', rest_sec:20 },
      ]},
    { id:'tpl_cond_animal', name:'Animal Flow', type:'conditioning', duration_min:25,
      min_fitness:'intermediate', min_equipment:['bodyweight','mat'],
      description:'Primal movement patterns for coordination and conditioning.',
      exercises:[
        { name:'Bear Crawl', sets:3, reps:'30s', rest_sec:20 },
        { name:'Crab Walks', sets:3, reps:'30s', rest_sec:20 },
        { name:'Frog Jumps', sets:3, reps:'20s', rest_sec:20 },
        { name:'Ape Walk', sets:3, reps:'30s', rest_sec:20 },
        { name:'Crab Reach', sets:3, reps:'30s', rest_sec:20 },
        { name:'Leopard Crawl', sets:3, reps:'30s', rest_sec:20 },
      ]},
    { id:'tpl_cond_carry', name:'Carry Complex', type:'conditioning', duration_min:30,
      min_fitness:'beginner', min_equipment:['dumbbell','kettlebell'],
      description:'Loaded carries build whole-body resilience.',
      exercises:[
        { name:'Farmer\'s Carry', sets:4, reps:'40s', rest_sec:30 },
        { name:'Suitcase Carry', sets:4, reps:'30s', rest_sec:30 },
        { name:'Front Rack Carry', sets:3, reps:'30s', rest_sec:30 },
        { name:'Overhead Carry', sets:3, reps:'30s', rest_sec:30 },
        { name:'Goblet Squat', sets:3, reps:'30s', rest_sec:30 },
      ]},
    // ── Functional ──────────────────────────
    { id:'tpl_func_movprep', name:'Movement Prep', type:'functional', duration_min:25,
      min_fitness:'beginner', min_equipment:['bodyweight','mat'],
      description:'Dynamic warm-up and movement quality drills.',
      exercises:[
        { name:'World\'s Greatest Stretch', sets:3, reps:'30s', rest_sec:15 },
        { name:'Cat-Cow', sets:3, reps:'30s', rest_sec:15 },
        { name:'Deep Squat Hold', sets:3, reps:'30s', rest_sec:15 },
        { name:'Dead Bug', sets:3, reps:'30s', rest_sec:15 },
        { name:'Single-Leg Balance', sets:3, reps:'20s', rest_sec:15 },
      ]},
    { id:'tpl_func_sandbag', name:'Sandbag Complex', type:'functional', duration_min:30,
      min_fitness:'intermediate', min_equipment:['bodyweight','dumbbell'],
      description:'Dumbbell-as-sandbag functional complex.',
      exercises:[
        { name:'Thrusters', sets:3, reps:'30s', rest_sec:30 },
        { name:'Romanian Deadlift', sets:3, reps:'30s', rest_sec:30 },
        { name:'Renegade Row', sets:3, reps:'30s', rest_sec:30 },
        { name:'Farmer\'s Carry', sets:3, reps:'40s', rest_sec:30 },
        { name:'Floor Press', sets:3, reps:'30s', rest_sec:30 },
      ]},
    { id:'tpl_func_mobility', name:'Mobility Circuit', type:'functional', duration_min:30,
      min_fitness:'untrained', min_equipment:['bodyweight','mat'],
      description:'Joint-by-joint mobility work for recovery days.',
      exercises:[
        { name:'Cat-Cow', sets:2, reps:'40s', rest_sec:10 },
        { name:'Hip Openers (90/90)', sets:2, reps:'40s', rest_sec:10 },
        { name:'Thoracic Rotations', sets:2, reps:'40s', rest_sec:10 },
        { name:'World\'s Greatest Stretch', sets:2, reps:'40s', rest_sec:10 },
        { name:'Couch Stretch', sets:2, reps:'40s', rest_sec:10 },
        { name:'Downward Dog', sets:2, reps:'40s', rest_sec:10 },
        { name:'Deep Squat Hold', sets:2, reps:'40s', rest_sec:10 },
      ]},
    { id:'tpl_func_balance', name:'Balance & Coordination', type:'functional', duration_min:25,
      min_fitness:'beginner', min_equipment:['bodyweight'],
      description:'Improve proprioception, balance, and body control.',
      exercises:[
        { name:'Single-Leg Balance', sets:3, reps:'20s', rest_sec:15 },
        { name:'Cossack Squat', sets:3, reps:'30s', rest_sec:20 },
        { name:'Bear Crawl', sets:3, reps:'30s', rest_sec:20 },
        { name:'Skaters', sets:3, reps:'20s', rest_sec:20 },
        { name:'Plank Shoulder Taps', sets:3, reps:'30s', rest_sec:20 },
      ]},
    // ── ISOHIIT ─────────────────────────────
    { id:'tpl_isohiit_bodyweight', name:'ISOHIIT Bodyweight Blast', type:'isohiit', duration_min:25,
      min_fitness:'beginner', min_equipment:['bodyweight','mat'],
      description:'Fast-paced bodyweight circuit mixing cardio, plyo, strength, and isometric holds.',
      exercises:[
        { name:'Jumping Jacks', sets:3, reps:'30s', rest_sec:15 },
        { name:'180 Degree Squat Jumps', sets:3, reps:'20s', rest_sec:20 },
        { name:'Push-Ups', sets:3, reps:'30s', rest_sec:15 },
        { name:'Mountain Climbers', sets:3, reps:'30s', rest_sec:15 },
        { name:'Wall Sits', sets:3, reps:'30s', rest_sec:15 },
        { name:'Burpees', sets:3, reps:'20s', rest_sec:20 },
        { name:'Front Plank', sets:3, reps:'30s', rest_sec:15 },
        { name:'Skaters', sets:3, reps:'30s', rest_sec:15 },
      ]},
    { id:'tpl_isohiit_banded', name:'ISOHIIT Band & Burn', type:'isohiit', duration_min:30,
      min_fitness:'beginner', min_equipment:['bodyweight','mat','resistance band'],
      description:'Resistance band circuit targeting glutes, shoulders, and core with cardio intervals.',
      exercises:[
        { name:'High Knees', sets:3, reps:'30s', rest_sec:15 },
        { name:'Lateral Band Walks', sets:3, reps:'30s', rest_sec:15 },
        { name:'Banded Shoulder Press', sets:3, reps:'30s', rest_sec:15 },
        { name:'Glute Bridge', sets:3, reps:'30s', rest_sec:15 },
        { name:'Banded Bicep Curls', sets:3, reps:'30s', rest_sec:15 },
        { name:'Banded Clamshells', sets:3, reps:'30s', rest_sec:15 },
        { name:'Banded Pull-Aparts', sets:3, reps:'30s', rest_sec:15 },
        { name:'Bicycle Crunch', sets:3, reps:'30s', rest_sec:15 },
        { name:'Superman Hold', sets:3, reps:'20s', rest_sec:15 },
      ]},
    { id:'tpl_isohiit_fullbody', name:'ISOHIIT Full Body', type:'isohiit', duration_min:35,
      min_fitness:'beginner', min_equipment:['bodyweight','mat','resistance band'],
      description:'Complete head-to-toe ISOHIIT session: lower, upper, core, and cardio in every round.',
      exercises:[
        { name:'Jumping Jacks', sets:2, reps:'30s', rest_sec:15 },
        { name:'Air Squat', sets:3, reps:'30s', rest_sec:15 },
        { name:'Push-Ups', sets:3, reps:'30s', rest_sec:15 },
        { name:'Lunge Jumps', sets:3, reps:'20s', rest_sec:20 },
        { name:'Banded Rows', sets:3, reps:'30s', rest_sec:15 },
        { name:'Donkey Kicks', sets:3, reps:'30s', rest_sec:15 },
        { name:'Diamond Push-Ups', sets:3, reps:'30s', rest_sec:15 },
        { name:'Flutter Kicks', sets:3, reps:'30s', rest_sec:15 },
        { name:'Squat Hold', sets:3, reps:'30s', rest_sec:15 },
        { name:'Reverse Plank', sets:3, reps:'20s', rest_sec:15 },
      ]},
    { id:'tpl_isohiit_core_burn', name:'ISOHIIT Core Burn', type:'isohiit', duration_min:20,
      min_fitness:'beginner', min_equipment:['bodyweight','mat'],
      description:'Core-focused ISOHIIT with planks, crunches, and isometric holds.',
      exercises:[
        { name:'Front Plank', sets:3, reps:'30s', rest_sec:10 },
        { name:'Bicycle Crunch', sets:3, reps:'30s', rest_sec:10 },
        { name:'V-Ups', sets:3, reps:'20s', rest_sec:15 },
        { name:'Side Plank', sets:3, reps:'20s', rest_sec:10 },
        { name:'Leg Raises', sets:3, reps:'30s', rest_sec:10 },
        { name:'Dead Bug', sets:3, reps:'30s', rest_sec:10 },
        { name:'Hollow Hold', sets:3, reps:'20s', rest_sec:10 },
        { name:'Russian Twists', sets:3, reps:'30s', rest_sec:10 },
      ]},
    { id:'tpl_isohiit_lower_fire', name:'ISOHIIT Lower Body Fire', type:'isohiit', duration_min:25,
      min_fitness:'beginner', min_equipment:['bodyweight','mat','resistance band'],
      description:'All lower body: squats, lunges, glute work, and plyos with band options.',
      exercises:[
        { name:'Sumo Squats', sets:3, reps:'30s', rest_sec:15 },
        { name:'Reverse Lunges', sets:3, reps:'30s', rest_sec:15 },
        { name:'Lateral Band Walks', sets:3, reps:'30s', rest_sec:15 },
        { name:'180 Degree Squat Jumps', sets:3, reps:'20s', rest_sec:20 },
        { name:'Curtsy Lunges', sets:3, reps:'30s', rest_sec:15 },
        { name:'Fire Hydrants', sets:3, reps:'30s', rest_sec:15 },
        { name:'Single-Leg Glute Bridge', sets:3, reps:'30s', rest_sec:15 },
        { name:'Lunge Hold', sets:3, reps:'30s', rest_sec:15 },
      ]},
    // ── Yoga ────────────────────────────────
    // ── Custom ──────────────────────────────
    { id:'tpl_func_clm_special', name:'CLM Special', type:'functional', duration_min:45,
      min_fitness:'beginner', min_equipment:['bodyweight','mat'],
      description:'Bodyweight circuit blending balance, Pilates, strength and mobility. Step, squat, plank, lunge — no weights needed.',
      exercises:[
        { name:'Side Lunges', sets:2, reps:'30s', rest_sec:15 },
        { name:'Tree Pose', sets:1, reps:'30s', rest_sec:10 },
        { name:'Single-Leg Balance', sets:1, reps:'20s', rest_sec:10 },
        { name:'Step-Ups', sets:2, reps:'10', rest_sec:15 },
        { name:'Knee Drives', sets:2, reps:'30s', rest_sec:15 },
        { name:'Wall Sits', sets:2, reps:'30-45s', rest_sec:20 },
        { name:'Air Squat', sets:2, reps:'12-15', rest_sec:15 },
        { name:'Cossack Squat', sets:2, reps:'30s', rest_sec:15 },
        { name:'Pilates Roll-Up', sets:2, reps:'8-10', rest_sec:15 },
        { name:'Push-Ups', sets:2, reps:'8-12', rest_sec:15 },
        { name:'Cobra', sets:1, reps:'20s', rest_sec:10 },
        { name:'Downward Dog', sets:1, reps:'20s', rest_sec:10 },
        { name:'Child\'s Pose', sets:1, reps:'20s', rest_sec:10 },
        { name:'Bird Dog', sets:2, reps:'30s', rest_sec:15 },
        { name:'Front Plank', sets:2, reps:'30-45s', rest_sec:15 },
        { name:'Side Plank', sets:2, reps:'20-30s', rest_sec:15 },
        { name:'Split Squat', sets:2, reps:'10-12', rest_sec:20 },
        { name:'Cat-Cow', sets:1, reps:'30s', rest_sec:10 },
        { name:'Downward Dog', sets:1, reps:'30s', rest_sec:0 },
      ]},
    { id:'tpl_func_clm_special_weights', name:'CLM Special + Weights', type:'functional', duration_min:60,
      min_fitness:'beginner', min_equipment:['bodyweight','mat','dumbbell','bench'],
      description:'The full CLM Special with an added weighted section: pullover, rows, presses, lunges and flies.',
      exercises:[
        { name:'Side Lunges', sets:2, reps:'30s', rest_sec:15 },
        { name:'Tree Pose', sets:1, reps:'30s', rest_sec:10 },
        { name:'Single-Leg Balance', sets:1, reps:'20s', rest_sec:10 },
        { name:'Step-Ups', sets:2, reps:'10', rest_sec:15 },
        { name:'Knee Drives', sets:2, reps:'30s', rest_sec:15 },
        { name:'Wall Sits', sets:2, reps:'30-45s', rest_sec:20 },
        { name:'Air Squat', sets:2, reps:'12-15', rest_sec:15 },
        { name:'Cossack Squat', sets:2, reps:'30s', rest_sec:15 },
        { name:'Pilates Roll-Up', sets:2, reps:'8-10', rest_sec:15 },
        { name:'Push-Ups', sets:2, reps:'8-12', rest_sec:15 },
        { name:'Cobra', sets:1, reps:'20s', rest_sec:10 },
        { name:'Downward Dog', sets:1, reps:'20s', rest_sec:10 },
        { name:'Child\'s Pose', sets:1, reps:'20s', rest_sec:10 },
        { name:'Bird Dog', sets:2, reps:'30s', rest_sec:15 },
        { name:'Front Plank', sets:2, reps:'30-45s', rest_sec:15 },
        { name:'Side Plank', sets:2, reps:'20-30s', rest_sec:15 },
        { name:'Split Squat', sets:2, reps:'10-12', rest_sec:20 },
        { name:'Dumbbell Pullover', sets:3, reps:'8-10', rest_sec:60 },
        { name:'Russian Twists', sets:3, reps:'30s', rest_sec:30 },
        { name:'Air Squat', sets:3, reps:'10-12', rest_sec:60 },
        { name:'Dumbbell Row', sets:3, reps:'8-10', rest_sec:60 },
        { name:'Dumbbell Bench Press', sets:3, reps:'8-10', rest_sec:60 },
        { name:'Split Squat', sets:3, reps:'10-12', rest_sec:60 },
        { name:'Flat Dumbbell Fly', sets:3, reps:'8-10', rest_sec:60 },
        { name:'Cat-Cow', sets:1, reps:'30s', rest_sec:10 },
        { name:'Downward Dog', sets:1, reps:'30s', rest_sec:0 },
      ]},
    // ── Yoga ────────────────────────────────
    { id:'tpl_yoga_vinyasa_am', name:'Morning Vinyasa Flow', type:'yoga', duration_min:30,
      min_fitness:'beginner', min_equipment:['mat'], yoga_style:'vinyasa',
      description:'Energising sunrise flow to start your day.',
      exercises:[
        { name:'Centering Breath', hold_sec:60 },
        { name:'Mountain Pose', hold_sec:20 },
        { name:'Standing Forward Fold', hold_sec:20 },
        { name:'Halfway Lift', hold_sec:15 },
        { name:'Chaturanga', hold_sec:15 },
        { name:'Upward-Facing Dog', hold_sec:20 },
        { name:'Downward-Facing Dog', hold_sec:30 },
        { name:'Warrior I', hold_sec:40 },
        { name:'Warrior II', hold_sec:40 },
        { name:'Triangle', hold_sec:35 },
        { name:'Chair Pose', hold_sec:30 },
        { name:'Tree Pose', hold_sec:40 },
        { name:'Bridge Pose', hold_sec:40 },
        { name:'Supine Twist', hold_sec:40 },
        { name:'Savasana', hold_sec:180 },
      ]},
    { id:'tpl_yoga_vinyasa_pm', name:'Evening Vinyasa Wind-Down', type:'yoga', duration_min:45,
      min_fitness:'beginner', min_equipment:['mat'], yoga_style:'vinyasa',
      description:'Calming evening flow to release the day.',
      exercises:[
        { name:'Centering Breath', hold_sec:90 },
        { name:'Downward-Facing Dog', hold_sec:45 },
        { name:'Low Lunge', hold_sec:55 },
        { name:'Warrior II', hold_sec:45 },
        { name:'Wide-Legged Forward Fold', hold_sec:55 },
        { name:'Pigeon Pose', hold_sec:90 },
        { name:'Seated Forward Fold', hold_sec:70 },
        { name:'Supine Twist', hold_sec:70 },
        { name:'Happy Baby', hold_sec:60 },
        { name:'Savasana', hold_sec:240 },
      ]},
    { id:'tpl_yoga_hatha_fund', name:'Hatha Fundamentals', type:'yoga', duration_min:30,
      min_fitness:'beginner', min_equipment:['mat'], yoga_style:'hatha',
      description:'Foundational hatha poses with longer holds.',
      exercises:[
        { name:'Centering Breath', hold_sec:60 },
        { name:'Mountain Pose', hold_sec:30 },
        { name:'Warrior I', hold_sec:50 },
        { name:'Warrior II', hold_sec:50 },
        { name:'Triangle', hold_sec:50 },
        { name:'Tree Pose', hold_sec:40 },
        { name:'Cobra', hold_sec:40 },
        { name:'Child\'s Pose', hold_sec:40 },
        { name:'Seated Forward Fold', hold_sec:50 },
        { name:'Butterfly Pose', hold_sec:50 },
        { name:'Supine Twist', hold_sec:50 },
        { name:'Savasana', hold_sec:180 },
      ]},
    { id:'tpl_yoga_hatha_full', name:'Hatha Full Practice', type:'yoga', duration_min:60,
      min_fitness:'beginner', min_equipment:['mat'], yoga_style:'hatha',
      description:'Complete hatha practice hitting all pose families.',
      exercises:[
        { name:'Centering Breath', hold_sec:90 },
        { name:'Warrior I', hold_sec:70 },
        { name:'Warrior II', hold_sec:70 },
        { name:'Triangle', hold_sec:60 },
        { name:'Tree Pose', hold_sec:50 },
        { name:'Cobra', hold_sec:50 },
        { name:'Locust Pose', hold_sec:45 },
        { name:'Pigeon Pose', hold_sec:90 },
        { name:'Bridge Pose', hold_sec:60 },
        { name:'Seated Twist', hold_sec:70 },
        { name:'Seated Forward Fold', hold_sec:70 },
        { name:'Butterfly Pose', hold_sec:70 },
        { name:'Supine Twist', hold_sec:70 },
        { name:'Happy Baby', hold_sec:60 },
        { name:'Savasana', hold_sec:300 },
      ]},
    { id:'tpl_yoga_yin', name:'Deep Yin Release', type:'yoga', duration_min:45,
      min_fitness:'untrained', min_equipment:['mat'], yoga_style:'yin',
      description:'Long, passive holds to release deep connective tissue.',
      exercises:[
        { name:'Centering Breath', hold_sec:90 },
        { name:'Butterfly Pose', hold_sec:200 },
        { name:'Seated Forward Fold', hold_sec:200 },
        { name:'Pigeon Pose', hold_sec:260 },
        { name:'Supine Twist', hold_sec:200 },
        { name:'Child\'s Pose', hold_sec:180 },
        { name:'Sphinx Pose', hold_sec:200 },
        { name:'Savasana', hold_sec:240 },
      ]},
    { id:'tpl_yoga_power', name:'Power Flow Challenge', type:'yoga', duration_min:30,
      min_fitness:'intermediate', min_equipment:['mat'], yoga_style:'power',
      description:'Athletic, strength-building flow that will make you sweat.',
      exercises:[
        { name:'Centering Breath', hold_sec:60 },
        { name:'Chair Pose', hold_sec:25 },
        { name:'Chaturanga', hold_sec:15 },
        { name:'Upward-Facing Dog', hold_sec:15 },
        { name:'Downward-Facing Dog', hold_sec:25 },
        { name:'Warrior I', hold_sec:30 },
        { name:'Warrior II', hold_sec:30 },
        { name:'Warrior III', hold_sec:30 },
        { name:'Goddess Pose', hold_sec:25 },
        { name:'Boat Pose', hold_sec:25 },
        { name:'Plank Pose', hold_sec:30 },
        { name:'Bridge Pose', hold_sec:30 },
        { name:'Savasana', hold_sec:180 },
      ]},
    { id:'tpl_yoga_restorative', name:'Restorative Rest', type:'yoga', duration_min:30,
      min_fitness:'untrained', min_equipment:['mat'], yoga_style:'restorative',
      description:'Deeply relaxing supported poses for total recovery.',
      exercises:[
        { name:'Centering Breath', hold_sec:90 },
        { name:'Child\'s Pose', hold_sec:200 },
        { name:'Sphinx Pose', hold_sec:200 },
        { name:'Supine Twist', hold_sec:200 },
        { name:'Legs Up the Wall', hold_sec:200 },
        { name:'Savasana', hold_sec:240 },
      ]},
    { id:'tpl_yoga_beginner', name:'Absolute Beginner Yoga', type:'yoga', duration_min:20,
      min_fitness:'untrained', min_equipment:['mat'], yoga_style:'hatha',
      description:'Your very first yoga class. Simple, gentle, encouraging.',
      exercises:[
        { name:'Centering Breath', hold_sec:60 },
        { name:'Cat-Cow', hold_sec:40 },
        { name:'Downward-Facing Dog', hold_sec:30 },
        { name:'Warrior I', hold_sec:40 },
        { name:'Warrior II', hold_sec:40 },
        { name:'Tree Pose', hold_sec:30 },
        { name:'Child\'s Pose', hold_sec:40 },
        { name:'Bridge Pose', hold_sec:40 },
        { name:'Seated Forward Fold', hold_sec:40 },
        { name:'Supine Twist', hold_sec:40 },
        { name:'Savasana', hold_sec:180 },
      ]},
  ];

  // ── Filtering ──────────────────────────────────────
  function fitnessAtLeast(userLevel, required) {
    var FR = window.capability.FITNESS_RANK;
    return (FR[userLevel] || 0) >= (FR[required] || 0);
  }
  function getTemplatesForType(type, equipment, fitnessLevel) {
    var eqSet = equipment instanceof Set ? equipment : new Set(equipment || []);
    return TEMPLATES.filter(function (t) {
      if (t.type !== type) return false;
      if (!fitnessAtLeast(fitnessLevel || 'beginner', t.min_fitness)) return false;
      for (var i = 0; i < t.min_equipment.length; i++) {
        if (!eqSet.has(t.min_equipment[i])) return false;
      }
      return true;
    });
  }

  // ── Build workout from template ────────────────────
  function lookupExercise(name) {
    // Check main DB first (window.DB set by index.html inline script)
    if (typeof DB !== 'undefined') {
      var ex = DB.find(function (e) { return e.name === name; });
      if (ex) return ex;
    }
    // Check yoga DB
    if (window.yoga) {
      if (window.yoga.CENTERING && window.yoga.CENTERING.name === name) {
        return window.yoga.CENTERING;
      }
      var yp = window.yoga.YOGA_DB.find(function (p) { return p.name === name; });
      if (yp) return yp;
    }
    return null;
  }

  function buildWorkoutFromTemplate(template) {
    var arr = [];

    if (template.type === 'yoga') {
      // Yoga templates produce yoga-style workout entries
      var style = window.yoga && window.yoga.YOGA_STYLES[template.yoga_style || 'hatha'];
      var restBetween = style ? style.restBetween : 5;

      for (var i = 0; i < template.exercises.length; i++) {
        var te = template.exercises[i];
        var ex = lookupExercise(te.name);
        if (!ex) continue;
        var isLast = i === template.exercises.length - 1;
        var phase = 'standing';
        if (ex.name === 'Centering Breath' || (ex.cat && ex.cat === 'yoga-seated' && i === 0)) phase = 'centering';
        else if (ex.name === 'Savasana' || (ex.cat && ex.cat === 'yoga-savasana')) phase = 'savasana';
        else if (ex.cat) {
          var catMap = { 'yoga-standing':'standing', 'yoga-balance':'balance',
            'yoga-floor':'floor', 'yoga-seated':'seated', 'yoga-core':'core-flow',
            'yoga-inversion':'standing', 'yoga-transition':'sun-sal' };
          phase = catMap[ex.cat] || 'standing';
        }

        arr.push({
          exercise: ex,
          workSec: te.hold_sec || 30,
          restSec: isLast ? 0 : restBetween,
          section: 'yoga',
          yogaPhase: phase,
          single_sided: !!ex.single_sided,
          narration: ex.narration || [],
          transitionNarration: ex.transition_in || '',
        });
      }
      return arr;
    }

    // Non-yoga: build warmup placeholder + main entries + cooldown placeholder.
    // Main entries use template's sets/reps/rest.
    for (var j = 0; j < template.exercises.length; j++) {
      var item = template.exercises[j];
      var exObj = lookupExercise(item.name);
      if (!exObj) continue;
      var sets = item.sets || 3;
      for (var s = 0; s < sets; s++) {
        var workSec;
        if (template.type === 'strength') {
          workSec = 0; // strength uses count-up timer
        } else {
          var r = window.builder.pickIntervals(exObj.cat, exObj.diff, template.type, 'moderate', 'main');
          workSec = exObj.single_sided ? r.workSec * 2 : r.workSec;
        }
        arr.push({
          exercise: exObj,
          workSec: workSec,
          restSec: item.rest_sec || 60,
          intraRestSec: item.rest_sec || 60,
          section: 'main',
          setIdx: s,
          intensity: 'moderate',
          single_sided: !!exObj.single_sided,
          templateReps: item.reps,
        });
      }
    }
    return arr;
  }

  // ── Export ─────────────────────────────────────────

  window.templates = {
    TEMPLATES: TEMPLATES,
    getTemplatesForType: getTemplatesForType,
    buildWorkoutFromTemplate: buildWorkoutFromTemplate,
  };
})();
