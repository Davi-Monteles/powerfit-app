// PowerFit - Progresso por exercício (localStorage, offline-first)
// Registro de conclusão e carga real por exercício, separado do treino original.
// Schema: { id, studentId, studentEmail, personalId, workoutId, exerciseIndex,
//           completed, actualWeight, actualReps, date, updatedAt }

const PROGRESS_KEY = 'powerfit_exercise_progress';

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function readProgress() {
  if (!canUseLocalStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProgress(progress) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function createProgressId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `progress_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getStudentId(student = {}) {
  return student.id || student.studentId || student.student_id || null;
}

function getStudentEmail(student = {}) {
  return normalizeEmail(student.email || student.studentEmail || student.student_email);
}

function getPersonalId(student = {}, workout = {}) {
  return workout.personalId || workout.personal_id || student.personalId || student.personal_id || null;
}

function getWorkoutId(workout = {}) {
  return workout.id || workout.workoutId || workout.workout_id;
}

function matchesStudent(record, student = {}) {
  const studentId = getStudentId(student);
  const studentEmail = getStudentEmail(student);
  return (
    (studentId && record.studentId === studentId) ||
    (studentEmail && normalizeEmail(record.studentEmail) === studentEmail)
  );
}

function findProgressIndex(progress, student, workoutId, exerciseIndex) {
  const studentId = getStudentId(student);
  const studentEmail = getStudentEmail(student);
  return progress.findIndex(item => (
    item.workoutId === workoutId &&
    item.exerciseIndex === exerciseIndex &&
    (
      (studentId && item.studentId === studentId) ||
      (studentEmail && normalizeEmail(item.studentEmail) === studentEmail)
    )
  ));
}

function notifyProgressChange() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  if (typeof CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent('powerfit:data-changed', { detail: { entity: 'exercise-progress', timestamp: Date.now() } }));
  }
}

// Retorna o registro de progresso de um exercício específico para o aluno.
export function getExerciseProgress(student = {}, workoutId, exerciseIndex) {
  if (workoutId === undefined || workoutId === null || exerciseIndex === undefined || exerciseIndex === null) return null;
  return readProgress().find(item => (
    item.workoutId === workoutId &&
    item.exerciseIndex === exerciseIndex &&
    matchesStudent(item, student)
  )) || null;
}

// Retorna todos os registros de progresso do aluno para um treino.
export function getProgress(student = {}, workoutId) {
  if (workoutId === undefined || workoutId === null) return [];
  return readProgress().filter(item => (
    item.workoutId === workoutId && matchesStudent(item, student)
  ));
}

// Retorna todos os registros de progresso de um treino (qualquer aluno).
// Usado pela visão do personal para exibir cargas registradas.
export function getAllProgressForWorkout(workoutId) {
  if (workoutId === undefined || workoutId === null) return [];
  return readProgress()
    .filter(item => item.workoutId === workoutId)
    .sort((a, b) => new Date(b.updatedAt || b.date || 0) - new Date(a.updatedAt || a.date || 0));
}

// Salva/atualiza o progresso de um exercício. `patch` pode conter:
// { completed, actualWeight, actualReps, date }
export function saveProgress(student = {}, workout = {}, exerciseIndex, patch = {}) {
  const workoutId = getWorkoutId(workout);
  if (workoutId === undefined || workoutId === null || exerciseIndex === undefined || exerciseIndex === null) return null;
  const now = new Date().toISOString();
  const progress = readProgress();
  const index = findProgressIndex(progress, student, workoutId, exerciseIndex);
  const existing = index >= 0 ? progress[index] : null;

  const record = {
    ...(existing || {}),
    id: existing?.id || createProgressId(),
    studentId: getStudentId(student),
    studentEmail: getStudentEmail(student),
    personalId: getPersonalId(student, workout),
    workoutId,
    exerciseIndex,
    completed: patch.completed !== undefined ? !!patch.completed : (existing?.completed ?? false),
    actualWeight: patch.actualWeight !== undefined ? String(patch.actualWeight) : (existing?.actualWeight ?? ''),
    actualReps: patch.actualReps !== undefined ? String(patch.actualReps) : (existing?.actualReps ?? ''),
    date: patch.date || existing?.date || now,
    updatedAt: now,
  };

  if (index >= 0) progress[index] = record;
  else progress.push(record);

  writeProgress(progress);
  notifyProgressChange();
  return record;
}

// Alterna o estado de conclusão de um exercício.
export function toggleExercise(student = {}, workout = {}, exerciseIndex) {
  const workoutId = getWorkoutId(workout);
  const existing = getExerciseProgress(student, workoutId, exerciseIndex);
  const nextCompleted = !(existing?.completed ?? false);
  return saveProgress(student, workout, exerciseIndex, { completed: nextCompleted });
}

// Verifica se todos os exercícios do treino estão concluídos para o aluno.
export function isWorkoutFullyCompleted(student = {}, workout = {}) {
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
  if (exercises.length === 0) return false;
  const workoutId = getWorkoutId(workout);
  const progress = getProgress(student, workoutId);
  return exercises.every((_, index) => {
    const item = progress.find(p => p.exerciseIndex === index);
    return item?.completed === true;
  });
}
