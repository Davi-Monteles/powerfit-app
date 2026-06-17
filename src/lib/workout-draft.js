import { EXERCISE_LIBRARY } from './exercise-media.js';
import { getStudentIntakeProfile } from './student-intake.js';

const REVIEW_NOTICE = 'Rascunho para revisão do personal. Não substitui avaliação médica.';
const PROFESSIONAL_REVIEW_ALERT = 'Atenção: revisar com profissional antes de aplicar este treino.';
const WORKOUTS_KEY = 'powerfit_workouts';
const STUDENTS_KEY = 'powerfit_students';
const CURRENT_USER_KEY = 'powerfit_current_user';
const DRAFT_SOURCE = 'rascunho_anamnese';

const FOCUS_ALIASES = {
  pernas: ['quadriceps', 'gluteos', 'posteriores', 'panturrilhas'],
  peito: ['peito'],
  costas: ['costas', 'romboides', 'trapezio'],
  gluteos: ['gluteos'],
  ombros: ['ombros', 'posterior de ombro'],
  bracos: ['biceps', 'triceps', 'antebracos', 'braquial'],
  core: ['core', 'abdominal', 'reto abdominal', 'obliquos'],
  condicionamento: ['core', 'peito', 'costas', 'quadriceps'],
};

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getLocalItem(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem(key, value) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function createLocalId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getStudentId(student = {}) {
  return student.id || student.studentId || student.student_id || null;
}

function getStudentEmail(student = {}) {
  return String(student.email || student.studentEmail || student.student_email || '').trim().toLowerCase() || null;
}

function getPersonalId(student = {}) {
  const currentUser = getLocalItem(CURRENT_USER_KEY, null);
  return student.personalId || student.personal_id || currentUser?.id || null;
}

function getDraftKey(student = {}, draft = {}) {
  return [getStudentId(student) || getStudentEmail(student), draft.title, draft.objective]
    .map(normalizeText)
    .join(':');
}

function notifyLocalWorkoutChange() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new Event('powerfit:weekly-schedule-updated'));
  if (typeof CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent('powerfit:data-changed', { detail: { entity: 'workouts', timestamp: Date.now() } }));
  }
}

function buildPublishedExercises(draft = {}) {
  return (draft.days || []).flatMap(day => (day.exercises || []).map(exercise => ({
    name: exercise.name,
    mediaKey: exercise.mediaKey || null,
    sets: exercise.sets,
    reps: exercise.reps,
    rest: exercise.rest,
    notes: [day.title, day.focus, exercise.notes].filter(Boolean).join(' - '),
  })));
}

function upsertStudentAssignment(student = {}, workout, now) {
  const students = getLocalItem(STUDENTS_KEY, []);
  const studentId = getStudentId(student);
  const studentEmail = getStudentEmail(student);
  const index = students.findIndex(item => (
    (studentId && [item.id, item.studentId, item.student_id].includes(studentId)) ||
    (studentEmail && getStudentEmail(item) === studentEmail)
  ));

  if (index === -1) return;

  const record = { ...students[index] };
  record.studentId = record.id || record.studentId || studentId;
  record.student_id = record.studentId;

  const workoutIds = Array.isArray(record.workoutIds) ? [...record.workoutIds] : [];
  if (!workoutIds.includes(workout.id)) workoutIds.push(workout.id);
  record.workoutIds = workoutIds;

  const schedule = Array.isArray(record.workoutSchedule) ? [...record.workoutSchedule] : [];
  const existing = schedule.find(item => item.workoutId === workout.id || item.sourceDraftKey === workout.sourceDraftKey);
  if (!existing) {
    schedule.push({
      id: `schedule_${workout.id}`,
      workoutId: workout.id,
      day: 'Geral',
      status: 'pending',
      completed: false,
      completedAt: null,
      source: DRAFT_SOURCE,
      sourceDraftKey: workout.sourceDraftKey,
      createdAt: now,
    });
  }
  record.workoutSchedule = schedule;

  students[index] = record;
  setLocalItem(STUDENTS_KEY, students);
}

function parseDays(daysPerWeek) {
  const match = String(daysPerWeek || '').match(/\d+/);
  const parsed = match ? Number(match[0]) : 3;
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(Math.max(parsed, 2), 6);
}

function parseDurationMinutes(sessionDuration) {
  const match = String(sessionDuration || '').match(/\d+/);
  return match ? Number(match[0]) : 45;
}

function splitSummaryList(value) {
  if (!value || value === 'Nao informado') return [];
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
}

function hasMissingProfileData(profile) {
  return [profile.goal, profile.experienceLevel, profile.daysPerWeek, profile.sessionDuration, profile.equipment, profile.muscleFocus, profile.trainingHistory]
    .some(value => !value || value === 'Nao informado');
}

function getTrainingPrescription(level) {
  const normalizedLevel = normalizeText(level);
  if (normalizedLevel.includes('iniciante') || normalizedLevel.includes('retornando')) {
    return { sets: 2, reps: '12-15', rest: 60 };
  }
  if (normalizedLevel.includes('avancado')) {
    return { sets: 4, reps: '6-10', rest: 90 };
  }
  return { sets: 3, reps: '8-12', rest: 75 };
}

function focusMatchesExercise(focusItems, exercise) {
  if (focusItems.length === 0) return false;
  const exerciseGroups = [exercise.primaryMuscle, ...(exercise.muscleGroups || [])]
    .map(normalizeText)
    .filter(Boolean);

  return focusItems.some(focus => {
    const normalizedFocus = normalizeText(focus);
    const aliases = FOCUS_ALIASES[normalizedFocus] || [normalizedFocus];
    return aliases.some(alias => exerciseGroups.some(group => group.includes(alias) || alias.includes(group)));
  });
}

function equipmentMatchesExercise(equipmentItems, exercise) {
  if (equipmentItems.length === 0) return true;
  const exerciseEquipment = normalizeText(exercise.equipment);
  const normalizedItems = equipmentItems.map(normalizeText);

  if (normalizedItems.some(item => item.includes('casa sem equipamento'))) {
    return exerciseEquipment.includes('peso corporal');
  }

  return normalizedItems.some(item => {
    if (item.includes('maquina') || item.includes('maquinas')) return exerciseEquipment.includes('maquina') || exerciseEquipment.includes('polia');
    if (item.includes('halter')) return exerciseEquipment.includes('halter');
    if (item.includes('barra')) return exerciseEquipment.includes('barra');
    if (item.includes('peso livre')) return exerciseEquipment.includes('peso corporal') || exerciseEquipment.includes('halter') || exerciseEquipment.includes('barra');
    if (item.includes('elastico')) return exerciseEquipment.includes('elastico') || exerciseEquipment.includes('peso corporal');
    return exerciseEquipment.includes(item);
  });
}

function levelMatchesExercise(level, exercise) {
  const normalizedLevel = normalizeText(level);
  const exerciseLevel = normalizeText(exercise.level);
  if (!normalizedLevel || normalizedLevel.includes('nao informado')) return true;
  if (normalizedLevel.includes('avancado')) return true;
  if (normalizedLevel.includes('intermediario')) return !exerciseLevel.includes('avancado');
  return exerciseLevel.includes('iniciante');
}

function buildExercisePool(profile) {
  const focusItems = splitSummaryList(profile.muscleFocus);
  const equipmentItems = splitSummaryList(profile.equipment);
  const exercises = Object.values(EXERCISE_LIBRARY);

  const exact = exercises.filter(exercise => (
    focusMatchesExercise(focusItems, exercise)
    && equipmentMatchesExercise(equipmentItems, exercise)
    && levelMatchesExercise(profile.experienceLevel, exercise)
  ));
  if (exact.length >= 4) return exact;

  const focusFallback = exercises.filter(exercise => (
    focusMatchesExercise(focusItems, exercise)
    && levelMatchesExercise(profile.experienceLevel, exercise)
  ));
  const generalFallback = exercises.filter(exercise => levelMatchesExercise(profile.experienceLevel, exercise));

  return [...exact, ...focusFallback, ...generalFallback]
    .filter((exercise, index, list) => list.findIndex(item => item.slug === exercise.slug) === index);
}

function buildDraftExercise(exercise, prescription, needsProfessionalReview) {
  return {
    name: exercise.name,
    mediaKey: exercise.slug,
    sets: prescription.sets,
    reps: prescription.reps,
    rest: prescription.rest,
    notes: needsProfessionalReview
      ? `Revisar com o profissional antes de aplicar. ${exercise.safetyNote}`
      : exercise.shortInstruction,
  };
}

function buildDraftDays(profile, needsProfessionalReview) {
  const daysCount = parseDays(profile.daysPerWeek);
  const minutes = parseDurationMinutes(profile.sessionDuration);
  const exercisesPerDay = minutes <= 30 ? 3 : minutes >= 60 ? 5 : 4;
  const prescription = getTrainingPrescription(profile.experienceLevel);
  const pool = buildExercisePool(profile);
  const safePool = pool.length ? pool : Object.values(EXERCISE_LIBRARY);

  return Array.from({ length: daysCount }, (_, dayIndex) => {
    const exercises = Array.from({ length: Math.min(exercisesPerDay, safePool.length) }, (_, exerciseIndex) => {
      const poolIndex = (dayIndex * 2 + exerciseIndex) % safePool.length;
      return buildDraftExercise(safePool[poolIndex], prescription, needsProfessionalReview);
    });

    return {
      title: `Dia ${dayIndex + 1}`,
      focus: profile.muscleFocus !== 'Nao informado' ? profile.muscleFocus : 'Geral conservador',
      exercises,
    };
  });
}

export function generateWorkoutDraft(student = {}, intake = null) {
  const profile = getStudentIntakeProfile(student, intake);

  if (!intake) {
    return {
      canGenerate: false,
      title: `Rascunho inicial - ${profile.studentName}`,
      objective: 'Nao informado',
      frequency: 'Nao informado',
      reviewNotice: REVIEW_NOTICE,
      emptyMessage: 'Preencha a avaliação inicial do aluno antes de gerar um rascunho.',
      observations: [REVIEW_NOTICE],
      safetyAlerts: [],
      days: [],
    };
  }

  const needsProfessionalReview = profile.needsProfessionalReview;
  const observations = [REVIEW_NOTICE];
  if (hasMissingProfileData(profile)) {
    observations.push('Dados incompletos: rascunho conservador para revisão manual do personal.');
  }
  if (profile.trainingHistory && profile.trainingHistory !== 'Nao informado') {
    observations.push(`Histórico declarado: ${profile.trainingHistory}`);
  }
  if (profile.notes) observations.push(`Observações do aluno: ${profile.notes}`);

  const safetyAlerts = needsProfessionalReview
    ? [PROFESSIONAL_REVIEW_ALERT, ...profile.attentionPoints.filter(point => !point.includes('Sem pontos'))]
    : [];

  return {
    canGenerate: true,
    title: `Rascunho inicial - ${profile.studentName}`,
    objective: profile.goal,
    level: profile.experienceLevel,
    frequency: `${parseDays(profile.daysPerWeek)} dias por semana`,
    sessionDuration: profile.sessionDuration,
    equipment: profile.equipment,
    muscleFocus: profile.muscleFocus,
    needsProfessionalReview,
    reviewNotice: REVIEW_NOTICE,
    observations,
    safetyAlerts,
    days: buildDraftDays(profile, needsProfessionalReview),
  };
}

export function publishWorkoutDraft(student = {}, draft = {}, options = {}) {
  if (!draft?.canGenerate) throw new Error('Rascunho invalido para publicacao');

  const now = options.now?.() || new Date().toISOString();
  const studentId = getStudentId(student);
  const studentEmail = getStudentEmail(student);
  const personalId = getPersonalId(student);
  const sourceDraftKey = getDraftKey(student, draft);
  const workouts = getLocalItem(WORKOUTS_KEY, []);
  const existingIndex = workouts.findIndex(workout => (
    workout.source === DRAFT_SOURCE &&
    workout.sourceDraftKey === sourceDraftKey &&
    (
      (studentId && (workout.studentId === studentId || workout.student_id === studentId)) ||
      (studentEmail && (workout.studentEmail === studentEmail || workout.student_email === studentEmail))
    )
  ));
  const existingWorkout = existingIndex >= 0 ? workouts[existingIndex] : null;
  const exercises = buildPublishedExercises(draft);
  const workout = {
    ...(existingWorkout || {}),
    id: existingWorkout?.id || options.id?.() || createLocalId(),
    name: draft.title?.replace('Rascunho inicial', 'Treino publicado') || 'Treino publicado',
    description: `${draft.objective || 'Objetivo nao informado'} · ${draft.frequency || 'Frequencia nao informada'} · revisar antes de aplicar.`,
    category: draft.objective || 'Musculacao',
    exercises,
    status: 'publicado',
    source: DRAFT_SOURCE,
    sourceDraftKey,
    studentId,
    student_id: studentId,
    studentEmail,
    student_email: studentEmail,
    personalId,
    personal_id: personalId,
    assignedTo: studentId,
    assigned_to: studentId,
    notes: (draft.observations || []).join('\n'),
    createdAt: existingWorkout?.createdAt || now,
    updatedAt: now,
  };

  if (existingIndex >= 0) workouts[existingIndex] = workout;
  else workouts.push(workout);

  setLocalItem(WORKOUTS_KEY, workouts);
  upsertStudentAssignment(student, workout, now);
  notifyLocalWorkoutChange();

  return { workout, created: existingIndex === -1, updated: existingIndex >= 0 };
}

export function getPublishedDraftWorkoutsForStudent(student = {}) {
  const studentId = getStudentId(student);
  const studentEmail = getStudentEmail(student);
  const personalId = getPersonalId(student);

  return getLocalItem(WORKOUTS_KEY, []).filter(workout => (
    workout.source === DRAFT_SOURCE &&
    (
      (studentId && (workout.studentId === studentId || workout.student_id === studentId)) ||
      (studentEmail && (workout.studentEmail === studentEmail || workout.student_email === studentEmail))
    ) &&
    (!personalId || !workout.personalId || workout.personalId === personalId || workout.personal_id === personalId)
  ));
}
