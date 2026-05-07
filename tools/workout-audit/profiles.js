'use strict';

const PROFILES = {
  beginner:     { fitness_level: 'beginner',     age_band: '18-39', bmi: 24, floor_work_ok: true,  mobility_limits: [], height_cm: 170, pregnancy_safe_only: false },
  intermediate: { fitness_level: 'intermediate', age_band: '18-39', bmi: 23, floor_work_ok: true,  mobility_limits: [], height_cm: 175, pregnancy_safe_only: false },
  advanced:     { fitness_level: 'advanced',     age_band: '18-39', bmi: 22, floor_work_ok: true,  mobility_limits: [], height_cm: 178, pregnancy_safe_only: false },
  elderly:      { fitness_level: 'beginner',     age_band: '70+',   bmi: 26, floor_work_ok: false, mobility_limits: ['knees', 'lower_back'], height_cm: 168, pregnancy_safe_only: false },
  pregnant:     { fitness_level: 'beginner',     age_band: '18-39', bmi: 27, floor_work_ok: false, mobility_limits: [], height_cm: 165, pregnancy_safe_only: true },
  limited:      { fitness_level: 'untrained',    age_band: '55-69', bmi: 32, floor_work_ok: false, mobility_limits: ['knees', 'shoulders', 'wrists'], height_cm: 165, pregnancy_safe_only: false },
};

const EQUIPMENT = {
  none: ['bodyweight', 'mat'],
  light: ['bodyweight', 'mat', 'resistance band'],
  home: ['bodyweight', 'mat', 'dumbbell', 'resistance band', 'bench'],
  full: ['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'barbell', 'bench', 'resistance band', 'chinup bar'],
};

module.exports = { PROFILES, EQUIPMENT };
