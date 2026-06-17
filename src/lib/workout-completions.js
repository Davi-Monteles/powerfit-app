const COMPLETIONS_KEY = 'powerfit_workout_completions';

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function readCompletions() {
  if (!canUseLocalStorage()) return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(COMPLETIONS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCompletions(completions) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
}

function createCompletionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `completion_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

function getWorkoutName(workout = {}, existing = {}) {
  return workout.name || workout.title || existing.workoutName || 'Treino';
}

function getStudentName(student = {}, existing = {}) {
  return student.name || student.studentName || existing.studentName || 'Aluno';
}

function getCompletionId(existing, options) {
  return existing?.id || options.id?.() || createCompletionId();
}

function getCompletionSource(existing, workout = {}) {
  return workout.source || existing?.source || null;
}

function completionMatchesStudent(completion, student = {}) {
  const studentId = getStudentId(student);
  const studentEmail = getStudentEmail(student);
  return (
    (studentId && completion.studentId === studentId) ||
    (studentEmail && normalizeEmail(completion.studentEmail) === studentEmail)
  );
}

function notifyCompletionChange() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  if (typeof CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent('powerfit:data-changed', { detail: { entity: 'workout-completions', timestamp: Date.now() } }));
  }
}

function findCompletionIndex(completions, student = {}, workoutId) {
  const studentId = getStudentId(student);
  const studentEmail = getStudentEmail(student);
  return completions.findIndex(item => (
    item.workoutId === workoutId &&
    (
      (studentId && item.studentId === studentId) ||
      (studentEmail && normalizeEmail(item.studentEmail) === studentEmail)
    )
  ));
}

function buildCompletionRecord(existing, student, workout, status, now, options) {
  return {
    ...(existing || {}),
    id: getCompletionId(existing, options),
    studentId: getStudentId(student),
    studentEmail: getStudentEmail(student),
    studentName: getStudentName(student, existing),
    personalId: getPersonalId(student, workout),
    workoutId: getWorkoutId(workout),
    workoutName: getWorkoutName(workout, existing),
    source: getCompletionSource(existing, workout),
    status,
    completedAt: status === 'completed' ? now : null,
    updatedAt: now,
  };
}

function upsertCompletion(student = {}, workout = {}, status, options = {}) {
  const workoutId = getWorkoutId(workout);
  const now = options.now?.() || new Date().toISOString();
  const completions = readCompletions();
  const index = findCompletionIndex(completions, student, workoutId);
  const existing = index >= 0 ? completions[index] : null;
  const completion = buildCompletionRecord(existing, student, workout, status, now, options);

  if (index >= 0) completions[index] = completion;
  else completions.push(completion);

  writeCompletions(completions);
  notifyCompletionChange();
  return completion;
}

export function markWorkoutCompleted(student, workout, options = {}) {
  return upsertCompletion(student, workout, 'completed', options);
}

export function markWorkoutPending(student, workout, options = {}) {
  return upsertCompletion(student, workout, 'pending', options);
}

export function getWorkoutCompletion(student = {}, workoutId) {
  return readCompletions().find(completion => completion.workoutId === workoutId && completionMatchesStudent(completion, student)) || null;
}

export function getWorkoutCompletionsByStudent(student = {}) {
  return readCompletions()
    .filter(completion => completionMatchesStudent(completion, student))
    .sort((a, b) => new Date(b.updatedAt || b.completedAt || 0) - new Date(a.updatedAt || a.completedAt || 0));
}

export function getWorkoutCompletionsForTrainer(personalId) {
  if (!personalId) return [];
  return readCompletions()
    .filter(completion => completion.personalId === personalId)
    .sort((a, b) => new Date(b.updatedAt || b.completedAt || 0) - new Date(a.updatedAt || a.completedAt || 0));
}
