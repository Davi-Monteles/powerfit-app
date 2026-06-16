// PowerFit - localStorage + Supabase Offline-First Data Layer
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { notifyDataChange } from './useStorageSync';
import { PERSONAL_PLANS, STUDENT_PLANS } from './plans';
import { sanitizeExportData, sanitizeImportData, stripSensitiveSessionFields } from './security';

if (!isSupabaseConfigured) {
  if (import.meta.env.DEV) console.error("[PowerFit] ERRO CRÍTICO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes no .env.local");
}


// ========== SUPABASE SAFE WRAPPER ==========
// Silently ignores 400/4xx errors (tables may not exist in demo/dev)
const safeSupabase = async (fn) => {
  try {
    const result = await fn();
    if (result?.error) {
      const status = result.error?.status || result.error?.code;
      const msg = result.error?.message || '';
      // Table doesn't exist, bad query, or missing relation — expected in demo/dev
      if (status === 400 || status === 404 || status === '42P01' || msg.includes('Could not find')) {
        return null;
      }
      if (import.meta.env.DEV) console.debug('[PowerFit] Supabase non-critical:', msg);
      return null;
    }
    return result?.data ?? null;
  } catch (err) {
    // Timeout or network error — silently ignore, localStorage has the data
    if (import.meta.env.DEV) console.debug('[PowerFit] Supabase unavailable (using localStorage):', err.message);
    return null;
  }
};

const KEYS = {
  USERS: 'powerfit_users',
  CURRENT_USER: 'powerfit_current_user',
  STUDENTS: 'powerfit_students',
  WORKOUTS: 'powerfit_workouts',
  EVOLUTION: 'powerfit_evolution',
  SCHEDULE: 'powerfit_schedule',
  PHOTOS: 'powerfit_photos',
  THEME: 'powerfit_theme',
  INITIALIZED: 'powerfit_initialized',
  MERCADO_PAGO_TOKEN: 'powerfit_mp_token',
};

const STUDENT_AI_SOURCE = 'student_ai';
const STUDENT_AI_NOTE_MARKER = 'source:student_ai';
const STUDENT_INTAKE_KEY_PREFIX = 'powerfit_student_intake_';

// ========== GENERIC HELPERS ==========
function getItem(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getStudentIntakesForBackup() {
  const intakes = {};
  if (typeof localStorage === 'undefined') return intakes;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(STUDENT_INTAKE_KEY_PREFIX)) continue;

    try {
      intakes[key] = JSON.parse(localStorage.getItem(key));
    } catch {
      // Ignore malformed local demo records during backup export.
    }
  }

  return intakes;
}

function importStudentIntakes(studentIntakes = {}) {
  if (!studentIntakes || typeof studentIntakes !== 'object' || Array.isArray(studentIntakes)) return;

  Object.entries(studentIntakes).forEach(([key, value]) => {
    const storageKey = key.startsWith(STUDENT_INTAKE_KEY_PREFIX) ? key : `${STUDENT_INTAKE_KEY_PREFIX}${key}`;
    if (!storageKey.startsWith(STUDENT_INTAKE_KEY_PREFIX)) return;
    localStorage.setItem(storageKey, JSON.stringify(value));
  });
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function emailsMatch(left, right) {
  const cleanLeft = normalizeEmail(left);
  const cleanRight = normalizeEmail(right);
  return !!cleanLeft && cleanLeft === cleanRight;
}

export async function fetchSupabaseRowsByEmail(table, email) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !canUseSupabase()) return [];
  const matchesById = new Map();

  const queries = [
    () => supabase.from(table).select('*').ilike('email', cleanEmail).limit(10),
    () => supabase.from(table).select('*').ilike('email', `%${cleanEmail}%`).limit(10),
  ];

  for (const runQuery of queries) {
    const rows = await safeSupabase(runQuery);
    const list = Array.isArray(rows) ? rows : (rows ? [rows] : []);
    list
      .filter(row => emailsMatch(row.email, cleanEmail))
      .forEach(row => matchesById.set(row.id || row.email, row));
  }

  return [...matchesById.values()];
}

export async function fetchSupabaseRowByEmail(table, email) {
  const matches = await fetchSupabaseRowsByEmail(table, email);
  return table === 'students'
    ? (matches.find(row => row.personalId || row.personal_id) || matches[0] || null)
    : (matches[0] || null);
}

function chooseStudentCandidate(authUser = {}, candidates = []) {
  const cleanEmail = normalizeEmail(authUser.email);
  const idCandidates = [authUser.id, authUser.studentId, authUser.student_id].filter(Boolean);
  const currentSession = getItem(KEYS.CURRENT_USER) || null;
  const preferredPersonalId = authUser.personalId || authUser.personal_id || (
    currentSession?.type === 'personal' ? currentSession.id : null
  );
  const emailMatches = candidates.filter(student => emailsMatch(student.email, cleanEmail));
  const pool = emailMatches.length > 0
    ? emailMatches
    : candidates.filter(student => idCandidates.includes(student.id) || idCandidates.includes(student.studentId) || idCandidates.includes(student.student_id));

  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => {
    const aPreferred = preferredPersonalId && (a.personalId === preferredPersonalId || a.personal_id === preferredPersonalId) ? 1 : 0;
    const bPreferred = preferredPersonalId && (b.personalId === preferredPersonalId || b.personal_id === preferredPersonalId) ? 1 : 0;
    if (aPreferred !== bPreferred) return bPreferred - aPreferred;

    const aLinked = a.personalId || a.personal_id ? 1 : 0;
    const bLinked = b.personalId || b.personal_id ? 1 : 0;
    if (aLinked !== bLinked) return bLinked - aLinked;

    const aIdMatch = idCandidates.includes(a.id) || idCandidates.includes(a.studentId) || idCandidates.includes(a.student_id) ? 1 : 0;
    const bIdMatch = idCandidates.includes(b.id) || idCandidates.includes(b.studentId) || idCandidates.includes(b.student_id) ? 1 : 0;
    return bIdMatch - aIdMatch;
  })[0];
}

function buildResolvedStudentProfile(authUser = {}, student = null) {
  if (!authUser && !student) return null;
  const source = student || authUser;
  const resolvedId = source.id || source.studentId || source.student_id || authUser.studentId || authUser.id;
  const resolved = {
    ...authUser,
    ...(student || {}),
    id: resolvedId,
    studentId: resolvedId,
    student_id: resolvedId,
    email: normalizeEmail(source.email || authUser.email),
    personalId: source.personalId || source.personal_id || authUser.personalId || authUser.personal_id || null,
    personal_id: source.personalId || source.personal_id || authUser.personalId || authUser.personal_id || null,
    type: 'aluno',
    isPremium: authUser.isPremium === true || student?.isPremium === true,
  };

  return resolved;
}

export function resolveStudentProfileFromCache(authUser) {
  if (!authUser || authUser.type !== 'aluno') return authUser || null;
  const students = getItem(KEYS.STUDENTS) || [];
  const linkedStudent = chooseStudentCandidate(authUser, students);
  return buildResolvedStudentProfile(authUser, linkedStudent);
}

function normalizeStudentIdentity(input = null, fallbackEmail = null) {
  if (input && typeof input === 'object') {
    return {
      ...input,
      email: normalizeEmail(input.email || fallbackEmail),
      type: 'aluno',
    };
  }

  const value = String(input || '').trim();
  const looksLikeEmail = value.includes('@');
  return {
    id: looksLikeEmail ? undefined : value,
    studentId: looksLikeEmail ? undefined : value,
    email: normalizeEmail(looksLikeEmail ? value : fallbackEmail),
    type: 'aluno',
  };
}

export function getCanonicalStudentProfile(input = null, fallbackEmail = null) {
  const identity = normalizeStudentIdentity(input, fallbackEmail);
  const students = getItem(KEYS.STUDENTS) || [];
  const candidate = chooseStudentCandidate(identity, students);
  return buildResolvedStudentProfile(identity, candidate);
}

export function getCanonicalStudentId(input = null, fallbackEmail = null) {
  const profile = getCanonicalStudentProfile(input, fallbackEmail);
  return profile?.id || profile?.studentId || profile?.student_id || null;
}

function getStudentScopedIdentity(input = null, fallbackEmail = null) {
  const resolved = getCanonicalStudentProfile(input, fallbackEmail);
  const ids = new Set([resolved?.id, resolved?.studentId, resolved?.student_id].filter(Boolean));
  return {
    student: resolved,
    ids,
    id: resolved?.id || resolved?.studentId || resolved?.student_id || null,
    email: normalizeEmail(resolved?.email || fallbackEmail),
    personalId: resolved?.personalId || resolved?.personal_id || null,
  };
}

function sameOrMissingPersonalId(recordPersonalId, studentPersonalId) {
  return !recordPersonalId || !studentPersonalId || recordPersonalId === studentPersonalId;
}

export async function resolveStudentProfileForAuthUser(authUser, { persist = false } = {}) {
  if (!authUser || authUser.type !== 'aluno') return authUser || null;
  let candidates = getItem(KEYS.STUDENTS) || [];

  if (canUseSupabase() && authUser.email) {
    const remoteCandidates = await fetchSupabaseRowsByEmail('students', authUser.email);
    remoteCandidates.forEach(mergeStudentCache);
    candidates = [...candidates, ...remoteCandidates];
  }

  const linkedStudent = chooseStudentCandidate(authUser, candidates);
  const resolved = buildResolvedStudentProfile(authUser, linkedStudent);
  if (persist && resolved) setCurrentUser(resolved);
  return resolved;
}

function isMissingSessionValue(value) {
  return value === undefined || value === null || value === '';
}

export function hydrateSessionUser(user) {
  if (!user || typeof user !== 'object') return null;

  const cleanEmail = normalizeEmail(user.email);
  const localUsers = getItem(KEYS.USERS) || [];
  const localStudents = getItem(KEYS.STUDENTS) || [];

  const localUser = localUsers.find(item =>
    (user.id && item.id === user.id) ||
    emailsMatch(item.email, cleanEmail)
  );
  const localStudent = chooseStudentCandidate(user, localStudents);

  const inferredType = user.type || localUser?.type || (localStudent ? 'aluno' : null);
  const base = inferredType === 'aluno' ? localStudent : localUser;
  const hydrated = { ...(base || {}), ...user };

  for (const key of ['type', 'planId', 'planActivatedAt', 'studentId', 'personalId', 'studentLimit', 'isPremium']) {
    if (isMissingSessionValue(hydrated[key]) && !isMissingSessionValue(base?.[key])) {
      hydrated[key] = base[key];
    }
  }

  if (!hydrated.type && localStudent && !localUser) hydrated.type = 'aluno';
  if (!hydrated.type && localUser?.type) hydrated.type = localUser.type;
  if (hydrated.type === 'aluno' && !hydrated.studentId) hydrated.studentId = localStudent?.id || hydrated.id;
  if (hydrated.type === 'aluno' && localStudent?.id) hydrated.id = localStudent.id;
  if (hydrated.type === 'aluno') return buildResolvedStudentProfile(hydrated, localStudent);

  return hydrated;
}

function setCurrentUser(user) {
  const hydrated = hydrateSessionUser(user);
  const safeHydrated = stripSensitiveSessionFields(hydrated);
  if (safeHydrated) setItem(KEYS.CURRENT_USER, safeHydrated);
  return safeHydrated;
}

function generateId() {
  // Generate a valid UUIDv4 for Supabase
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function normalizeWorkoutRecord(workout = {}, fallbackPersonalId = null) {
  if (!workout || typeof workout !== 'object') return workout;

  const normalizedStudentId = workout.studentId || workout.student_id || null;
  const normalizedPersonalId = workout.personalId || workout.personal_id || fallbackPersonalId || null;
  const normalizedStudentEmail = workout.studentEmail || workout.student_email || null;
  const aiGenerated = workout.aiGenerated === true || workout.ai_generated === true || workout.isAI === true || workout.is_ai === true;

  return {
    ...workout,
    studentId: normalizedStudentId,
    student_id: normalizedStudentId,
    personalId: normalizedPersonalId,
    personal_id: normalizedPersonalId,
    studentEmail: normalizedStudentEmail,
    student_email: normalizedStudentEmail,
    isAI: workout.isAI === true || workout.is_ai === true,
    aiGenerated,
    source: workout.source || workout.generatedBy || workout.generated_by || null,
    createdBy: workout.createdBy || workout.created_by || null,
    generatedBy: workout.generatedBy || workout.generated_by || null,
    assignedTo: workout.assignedTo || workout.assigned_to || null,
    assigned_to: workout.assignedTo || workout.assigned_to || null,
  };
}

export function isStudentAIWorkout(workout = {}) {
  if (!workout || typeof workout !== 'object') return false;

  const source = String(workout.source || workout.generatedBy || workout.generated_by || '').toLowerCase();
  const createdBy = String(workout.createdBy || workout.created_by || '').toLowerCase();
  const notes = String(workout.notes || '').toLowerCase();
  const name = String(workout.name || workout.title || '').toLowerCase();

  return (
    workout.aiGenerated === true ||
    workout.ai_generated === true ||
    workout.isAI === true ||
    workout.is_ai === true ||
    source === STUDENT_AI_SOURCE ||
    createdBy === STUDENT_AI_SOURCE ||
    notes.includes(STUDENT_AI_NOTE_MARKER) ||
    name.includes('treino especial da ia') ||
    name.includes('ia (alvo 3d)')
  );
}

function isStudentAIScheduleEvent(event = {}) {
  if (!event || typeof event !== 'object') return false;

  const source = String(event.source || event.generatedBy || event.generated_by || '').toLowerCase();
  const createdBy = String(event.createdBy || event.created_by || '').toLowerCase();
  const notes = String(event.notes || '').toLowerCase();
  const title = String(event.title || event.tittle || event.name || '').toLowerCase();

  return (
    event.aiGenerated === true ||
    event.ai_generated === true ||
    event.isAI === true ||
    event.is_ai === true ||
    source === STUDENT_AI_SOURCE ||
    createdBy === STUDENT_AI_SOURCE ||
    notes.includes(STUDENT_AI_NOTE_MARKER) ||
    title.includes('treino especial da ia') ||
    title.includes('ia (alvo 3d)')
  );
}

function buildWorkoutSupabasePayload(workout = {}) {
  const normalized = normalizeWorkoutRecord(workout);

  return {
    id: normalized.id,
    name: normalized.name,
    description: normalized.description ?? null,
    category: normalized.category ?? null,
    exercises: Array.isArray(normalized.exercises) ? normalized.exercises : [],
    personalId: normalized.personalId || null,
    notes: normalized.notes || null,
    assigned_to: normalized.assigned_to || normalized.assignedTo || null,
    createdAt: normalized.createdAt || null,
    updatedAt: normalized.updatedAt || null,
  };
}

function mergeWorkoutCache(workouts = [], fallbackPersonalId = null) {
  const currentCache = (getItem(KEYS.WORKOUTS) || []).map(workout => normalizeWorkoutRecord(workout, fallbackPersonalId));
  const normalizedIncoming = workouts.map(workout => normalizeWorkoutRecord(workout, fallbackPersonalId));
  const merged = [
    ...currentCache.filter(workout => !normalizedIncoming.some(incoming => incoming.id === workout.id)),
    ...normalizedIncoming,
  ];

  setItem(KEYS.WORKOUTS, merged);
  notifyDataChange('workouts');
  return merged;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseArrayLike(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
}

function addUuid(set, value) {
  if (typeof value === 'string' && UUID_PATTERN.test(value.trim())) {
    set.add(value.trim());
  }
}

export function normalizeWorkoutDay(day) {
  const normalized = String(day || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const days = {
    segunda: 'Segunda',
    monday: 'Segunda',
    terca: 'Terça',
    terça: 'Terça',
    tuesday: 'Terça',
    quarta: 'Quarta',
    wednesday: 'Quarta',
    quinta: 'Quinta',
    thursday: 'Quinta',
    sexta: 'Sexta',
    friday: 'Sexta',
    sabado: 'Sábado',
    sábado: 'Sábado',
    saturday: 'Sábado',
    domingo: 'Domingo',
    sunday: 'Domingo',
  };

  return days[normalized] || 'Geral';
}

function extractAssignedWorkoutIds(student = {}) {
  const ids = new Set();

  parseArrayLike(student.workoutIds || student.workout_ids).forEach(item => {
    addUuid(ids, typeof item === 'string' ? item : item?.id);
  });

  parseArrayLike(student.workoutSchedule || student.workout_schedule).forEach(schedule => {
    if (typeof schedule === 'string') {
      addUuid(ids, schedule);
      return;
    }

    addUuid(ids, schedule?.workoutId);
    addUuid(ids, schedule?.workout_id);
    addUuid(ids, schedule?.workout?.id);
  });

  return [...ids];
}

function getScheduleEntries(student = {}) {
  return parseArrayLike(student.workoutSchedule || student.workout_schedule);
}

function normalizeWeeklyScheduleRecord(record = {}) {
  const status = record.status || (record.completed ? 'completed' : 'pending');
  return {
    id: record.id || record.scheduleId || record.schedule_id || generateId(),
    workoutId: record.workoutId || record.workout_id,
    workout_id: record.workoutId || record.workout_id,
    day: normalizeWorkoutDay(record.day || record.dayOfWeek || record.day_of_week),
    dayOfWeek: normalizeWorkoutDay(record.day || record.dayOfWeek || record.day_of_week),
    day_of_week: normalizeWorkoutDay(record.day || record.dayOfWeek || record.day_of_week),
    isAI: record.isAI === true || record.is_ai === true,
    status,
    completed: record.completed === true || status === 'completed' || status === 'archived',
    completedAt: record.completedAt || record.completed_at || null,
    archivedAt: record.archivedAt || record.archived_at || null,
  };
}

function mergeStudentCache(studentData) {
  if (!studentData?.id && !studentData?.email) return;

  const localStudents = getItem(KEYS.STUDENTS) || [];
  const idx = localStudents.findIndex(student => (
    studentData.id
      ? student.id === studentData.id
      : emailsMatch(student.email, studentData.email)
  ));

  if (idx >= 0) localStudents[idx] = { ...localStudents[idx], ...studentData };
  else localStudents.push(studentData);

  setItem(KEYS.STUDENTS, localStudents);
  notifyDataChange('students');
}

async function fetchStudentAssignmentRecord(studentId, fallbackEmail = null) {
  const localStudents = getItem(KEYS.STUDENTS) || [];
  const localStudent = chooseStudentCandidate(normalizeStudentIdentity(studentId, fallbackEmail), localStudents);

  if (!canUseSupabase()) return localStudent || null;

  const queries = [];
  if (studentId && UUID_PATTERN.test(studentId)) {
    queries.push(() => supabase.from('students').select('*').eq('id', studentId).limit(1));
  }
  for (const runQuery of queries) {
    const { data, error } = await runQuery();
    if (error) {
      if (import.meta.env.DEV) console.warn('[PowerFit] Student assignment fetch warning:', error);
      continue;
    }

    const remoteStudent = Array.isArray(data) ? data[0] : null;
    if (remoteStudent) {
      const mergedStudent = { ...localStudent, ...remoteStudent };
      mergeStudentCache(mergedStudent);
      return mergedStudent;
    }
  }

  const remoteStudentByEmail = await fetchSupabaseRowByEmail('students', fallbackEmail);
  if (remoteStudentByEmail) {
    const mergedStudent = { ...localStudent, ...remoteStudentByEmail };
    mergeStudentCache(mergedStudent);
    return mergedStudent;
  }

  return localStudent || null;
}

function decorateAssignedWorkouts(workouts = [], student = {}, fallbackPersonalId = null) {
  const normalized = workouts.map(workout => normalizeWorkoutRecord(workout, fallbackPersonalId));
  const byId = new Map(normalized.map(workout => [workout.id, workout]));
  const result = [];
  const added = new Set();
  const addedScheduleKeys = new Set();

  for (const schedule of getScheduleEntries(student)) {
    const workoutId = typeof schedule === 'string' ? schedule : (schedule?.workoutId || schedule?.workout_id || schedule?.workout?.id);
    const workout = byId.get(workoutId);
    if (!workout) continue;

    const day = normalizeWorkoutDay(schedule?.day || schedule?.dayOfWeek || schedule?.day_of_week);
    const scheduleId = schedule?.id || schedule?.scheduleId || schedule?.schedule_id || null;
    const scheduleKey = scheduleId || `${workoutId}:${day}`;
    if (addedScheduleKeys.has(scheduleKey)) continue;
    addedScheduleKeys.add(scheduleKey);

    result.push({
      ...workout,
      scheduleId,
      day,
      status: schedule?.status || (schedule?.completed ? 'completed' : 'pending'),
      completed: schedule?.completed === true,
      completedAt: schedule?.completedAt || schedule?.completed_at || null,
      archivedAt: schedule?.archivedAt || schedule?.archived_at || null,
    });
    added.add(workoutId);
  }

  parseArrayLike(student.workoutIds || student.workout_ids).forEach(item => {
    const workoutId = typeof item === 'string' ? item : item?.id;
    const workout = byId.get(workoutId);
    if (workout && !added.has(workoutId)) {
      result.push({ ...workout, day: 'Geral' });
      added.add(workoutId);
    }
  });

  return result;
}

function workoutBelongsToStudent(workout = {}, student = {}, assignedIds = [], assignedSchedule = []) {
  const scoped = getStudentScopedIdentity(student);
  const workoutStudentId = workout.studentId || workout.student_id || workout.assignedTo || workout.assigned_to;
  const workoutPersonalId = workout.personalId || workout.personal_id || null;
  const directIdMatch = scoped.ids.has(workoutStudentId);
  const assignedIdMatch = assignedIds.includes(workout.id);
  const scheduledMatch = assignedSchedule.some(schedule => (
    typeof schedule === 'string'
      ? schedule
      : (schedule?.workoutId || schedule?.workout_id || schedule?.workout?.id)
  ) === workout.id);
  const emailMatch = emailsMatch(workout.studentEmail || workout.student_email || workout.email, scoped.email);

  if (assignedIdMatch || scheduledMatch || directIdMatch) return sameOrMissingPersonalId(workoutPersonalId, scoped.personalId);
  return emailMatch && !workoutStudentId && sameOrMissingPersonalId(workoutPersonalId, scoped.personalId);
}

export function getStudentVisibleWorkouts(profile = null) {
  const currentUser = profile || getCurrentUser();
  const scoped = getStudentScopedIdentity(currentUser);
  const studentRecord = getStudentById(scoped.id) || getStudentByEmail(scoped.email) || scoped.student || currentUser;
  const assignedIds = parseArrayLike(studentRecord.workoutIds || studentRecord.workout_ids);
  const assignedSchedule = parseArrayLike(studentRecord.workoutSchedule || studentRecord.workout_schedule);
  const allWorkouts = (getItem(KEYS.WORKOUTS) || []).map(workout => normalizeWorkoutRecord(workout));

  return allWorkouts.filter(workout => workoutBelongsToStudent(workout, studentRecord, assignedIds, assignedSchedule));
}

export async function fetchWorkoutsForStudent(studentId, fallbackPersonalId = null, fallbackEmail = null) {
  const student = await fetchStudentAssignmentRecord(studentId, fallbackEmail);
  if (!student) return [];

  let weeklySchedule = [];
  const resolvedStudentId = student.id || student.studentId || student.student_id || studentId;

  if (canUseSupabase() && resolvedStudentId && UUID_PATTERN.test(resolvedStudentId)) {
    const { data, error } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('student_id', resolvedStudentId);

    if (!error && Array.isArray(data)) {
      weeklySchedule = data.map(normalizeWeeklyScheduleRecord).filter(entry => entry.workoutId);
    }
  }

  const workoutIds = [
    ...new Set([
      ...extractAssignedWorkoutIds(student),
      ...weeklySchedule.map(entry => entry.workoutId),
    ]),
  ];
  const localWorkouts = (getItem(KEYS.WORKOUTS) || [])
    .map(workout => normalizeWorkoutRecord(workout, student.personalId || fallbackPersonalId))
    .filter(workout => (
      workoutIds.includes(workout.id) ||
      workoutBelongsToStudent(workout, student, workoutIds, getScheduleEntries(student))
    ));
  let remoteWorkouts = [];

  if (canUseSupabase()) {
    const remoteWorkoutIds = workoutIds.filter(id => UUID_PATTERN.test(id));

    if (remoteWorkoutIds.length > 0) {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .in('id', remoteWorkoutIds);

      if (error) throw error;
      remoteWorkouts = Array.isArray(data) ? data : [];
    }

    if (resolvedStudentId) {
      const directRows = await safeSupabase(() => supabase
        .from('workouts')
        .select('*')
        .eq('assigned_to', resolvedStudentId));
      if (Array.isArray(directRows)) remoteWorkouts = [...remoteWorkouts, ...directRows];
    }
  }

  const mergedById = new Map([
    ...localWorkouts.map(workout => [workout.id, workout]),
    ...remoteWorkouts.map(workout => [workout.id, workout]),
  ]);
  const mergedWorkouts = [...mergedById.values()];

  if (mergedWorkouts.length > 0) {
    mergeWorkoutCache(mergedWorkouts, student.personalId || fallbackPersonalId);
  }

  const scheduleEntries = [
    ...getScheduleEntries(student),
    ...weeklySchedule,
  ];
  const assignedWorkouts = decorateAssignedWorkouts(
    mergedWorkouts,
    { ...student, workoutSchedule: scheduleEntries },
    student.personalId || fallbackPersonalId
  );
  const assignedResultIds = new Set(assignedWorkouts.map(workout => workout.id));
  mergedWorkouts
    .filter(workout => !assignedResultIds.has(workout.id))
    .filter(workout => workoutBelongsToStudent(workout, student, workoutIds, scheduleEntries))
    .forEach(workout => assignedWorkouts.push({ ...workout, day: normalizeWorkoutDay(workout.day || workout.dayOfWeek || workout.day_of_week) }));
  const cacheKey = student.id || studentId;
  if (cacheKey) {
    localStorage.setItem(`workouts_${cacheKey}`, JSON.stringify(assignedWorkouts));
  }

  return assignedWorkouts;
}

function canUseSupabase() {
  return isSupabaseConfigured && navigator.onLine;
}

function mergeRowsIntoCache(key, rows, entity) {
  if (!Array.isArray(rows)) return getItem(key) || [];

  const current = getItem(key) || [];
  const mergedByKey = new Map();
  current.forEach(item => mergedByKey.set(item.id || item.email, item));
  rows.forEach(item => mergedByKey.set(item.id || item.email, { ...(mergedByKey.get(item.id || item.email) || {}), ...item }));
  const merged = [...mergedByKey.values()];
  setItem(key, merged);
  notifyDataChange(entity);
  return merged;
}

function normalizeScheduleRecord(record = {}) {
  const title = record.title || record.tittle || '';
  return {
    ...record,
    title,
    tittle: title,
    studentId: record.studentId || record.student_id || null,
    student_id: record.studentId || record.student_id || null,
    studentEmail: record.studentEmail || record.student_email || null,
    student_email: record.studentEmail || record.student_email || null,
    personalId: record.personalId || record.personal_id || null,
    personal_id: record.personalId || record.personal_id || null,
  };
}

function scheduleBelongsToStudent(event = {}, student = {}) {
  const scoped = getStudentScopedIdentity(student);
  const eventStudentId = event.studentId || event.student_id;
  const eventPersonalId = event.personalId || event.personal_id || null;
  if (scoped.ids.has(eventStudentId)) return sameOrMissingPersonalId(eventPersonalId, scoped.personalId);

  return (
    emailsMatch(event.studentEmail || event.student_email || event.email, scoped.email) &&
    sameOrMissingPersonalId(eventPersonalId, scoped.personalId)
  );
}

export function getStudentVisibleSchedule(profile = null) {
  const scoped = getStudentScopedIdentity(profile || getCurrentUser());
  return getRawSchedule().filter(event => scheduleBelongsToStudent(event, scoped.student));
}

function buildScheduleSupabasePayload(record = {}) {
  const normalized = normalizeScheduleRecord(record);
  return {
    id: normalized.id,
    title: normalized.title,
    tittle: normalized.title,
    studentId: normalized.studentId || null,
    personalId: normalized.personalId || null,
    date: normalized.date,
    time: normalized.time,
    type: normalized.type || null,
    notes: normalized.notes || null,
    createdAt: normalized.createdAt || null,
  };
}

export async function refreshStudentsFromSupabase() {
  if (!canUseSupabase()) return getStudents();

  const currentUser = getCurrentUser();
  if (!currentUser) return getStudents();

  if (currentUser.type === 'aluno') {
    const student = await fetchSupabaseRowByEmail('students', currentUser.email);
    if (student) mergeStudentCache(student);
    return getStudents();
  }

  let query = supabase.from('students').select('*');
  if (currentUser.type === 'personal') query = query.eq('personalId', currentUser.id);

  const rows = await safeSupabase(() => query);
  if (Array.isArray(rows)) mergeRowsIntoCache(KEYS.STUDENTS, rows, 'students');
  return getStudents();
}

export async function refreshWorkoutsFromSupabase() {
  if (!canUseSupabase()) return getWorkouts();

  const currentUser = getCurrentUser();
  if (!currentUser) return getWorkouts();

  if (currentUser.type === 'aluno') {
    const resolved = getCanonicalStudentProfile(currentUser, currentUser.email);
    await fetchWorkoutsForStudent(resolved?.id || currentUser.studentId || currentUser.id, resolved?.personalId, resolved?.email || currentUser.email);
    return getWorkouts();
  }

  let query = supabase.from('workouts').select('*');
  if (currentUser.type === 'personal') query = query.eq('personalId', currentUser.id);

  const rows = await safeSupabase(() => query);
  if (Array.isArray(rows)) {
    const normalized = rows.map(workout => normalizeWorkoutRecord(workout, currentUser.id));
    mergeRowsIntoCache(KEYS.WORKOUTS, normalized, 'workouts');
  }
  return getWorkouts();
}

export async function refreshScheduleFromSupabase() {
  if (!canUseSupabase()) return getSchedule();

  const currentUser = getCurrentUser();
  if (!currentUser) return getSchedule();

  let query = supabase.from('schedule').select('*');
  if (currentUser.type === 'personal') query = query.eq('personalId', currentUser.id);
  if (currentUser.type === 'aluno') {
    const resolvedStudentId = getCanonicalStudentId(currentUser, currentUser.email);
    query = query.eq('studentId', resolvedStudentId || currentUser.studentId || currentUser.id);
  }

  const rows = await safeSupabase(() => query);
  if (Array.isArray(rows)) {
    mergeRowsIntoCache(KEYS.SCHEDULE, rows.map(normalizeScheduleRecord), 'schedule');
  }
  return getSchedule();
}

async function collectSafeRows(queries) {
  const rowsByKey = new Map();

  for (const runQuery of queries) {
    const rows = await safeSupabase(runQuery);
    const list = Array.isArray(rows) ? rows : (rows ? [rows] : []);
    list.forEach(row => rowsByKey.set(row.id || `${row.studentId || row.student_id || row.email || row.studentEmail}-${row.date || row.createdAt}`, row));
  }

  return [...rowsByKey.values()];
}

export async function refreshEvolutionFromSupabase(profile = null) {
  if (!canUseSupabase()) return getEvolution();

  const currentUser = profile || getCurrentUser();
  if (!currentUser) return getEvolution();

  const queries = [];
  if (currentUser.type === 'personal') {
    const studentIds = getStudents().map(student => student.id).filter(Boolean);
    if (studentIds.length > 0) {
      queries.push(() => supabase.from('evolution').select('*').in('studentId', studentIds));
    }
  } else if (currentUser.type === 'aluno') {
    const studentId = getCanonicalStudentId(currentUser, currentUser.email);

    if (studentId) {
      queries.push(() => supabase.from('evolution').select('*').eq('studentId', studentId));
    }
  }

  const rows = await collectSafeRows(queries);
  if (rows.length > 0) mergeRowsIntoCache(KEYS.EVOLUTION, rows, 'evolution');
  return getEvolution();
}

export async function refreshPhotosFromSupabase(profile = null) {
  if (!canUseSupabase()) return getPhotos();

  const currentUser = profile || getCurrentUser();
  if (!currentUser) return getPhotos();

  const queries = [];
  if (currentUser.type === 'personal') {
    const studentIds = getStudents().map(student => student.id).filter(Boolean);
    if (studentIds.length > 0) {
      queries.push(() => supabase.from('photos').select('*').in('studentId', studentIds));
    }
  } else if (currentUser.type === 'aluno') {
    const studentId = getCanonicalStudentId(currentUser, currentUser.email);
    if (studentId) {
      queries.push(() => supabase.from('photos').select('*').eq('studentId', studentId));
    }
  }

  const rows = await collectSafeRows(queries);
  if (rows.length > 0) mergeRowsIntoCache(KEYS.PHOTOS, rows.map(photo => ({
    ...photo,
    studentId: photo.studentId || photo.student_id,
    image: photo.image || photo.url || '',
    label: photo.label || photo.type || '',
  })), 'photos');
  return getPhotos();
}

// ========== PLANOS E ASSINATURA ==========
export const PLANS = PERSONAL_PLANS;
export { STUDENT_PLANS };

export function getPlans(type = 'personal') { 
  return type === 'aluno' ? STUDENT_PLANS : PLANS; 
}

export function isVipUser(email) {
  if (!email) return false;
  const students = getItem(KEYS.STUDENTS) || [];
  const student = students.find(s => emailsMatch(s.email, email));
  return student?.isPremium === true && (!student.premiumExpiresAt || new Date(student.premiumExpiresAt) > new Date());
}

export function isStudentPremium(profile) {
  const sameEmailStudents = profile?.email
    ? (getItem(KEYS.STUDENTS) || []).filter(student => emailsMatch(student.email, profile.email))
    : [];
  const hasPremiumStudent = sameEmailStudents.some(student => {
    const expiresAt = student.premiumExpiresAt;
    return student.isPremium === true && (!expiresAt || new Date(expiresAt) > new Date());
  });
  const profilePremiumActive = profile?.isPremium === true && (!profile?.premiumExpiresAt || new Date(profile.premiumExpiresAt) > new Date());
  return profilePremiumActive || hasPremiumStudent || isVipUser(profile?.email);
}

export function getUserPlan(userId) {
  const user = userId ? getUsers().find(u => u.id === userId) : getCurrentUser();
  if (!user) return null;
  
  // Student Plan Logic
  if (user.type === 'aluno') {
    const student = getCanonicalStudentProfile(user, user.email) || user;
    const isPremium = isStudentPremium({ ...user, ...student });
    if (isPremium) return { ...STUDENT_PLANS[1], isPremium: true };
    return { ...STUDENT_PLANS[0], isPremium: false };
  }

  if (!user.planId) return null;
  return PLANS.find(p => p.id === user.planId) || null;
}


export function setUserPlan(planId) {
  const user = getCurrentUser();
  if (!user) return;

  if (user.type === 'aluno') {
    // Student upgrade logic
    const isPro = planId === 'student-pro';
    const canonicalStudentId = getCanonicalStudentId(user, user.email) || user.id;
    user.isPremium = isPro;
    user.id = canonicalStudentId;
    user.studentId = canonicalStudentId;
    setItem(KEYS.CURRENT_USER, stripSensitiveSessionFields(user));
    
    const students = getItem(KEYS.STUDENTS) || [];
    const idx = students.findIndex(s => s.id === canonicalStudentId || emailsMatch(s.email, user.email));
    if (idx !== -1) {
      students[idx] = { ...students[idx], isPremium: isPro };
      setItem(KEYS.STUDENTS, students);
    }
    
    if (canUseSupabase()) {
      safeSupabase(() => supabase.from('students').update({ isPremium: isPro }).eq('id', canonicalStudentId));
    }
    notifyDataChange('students');
    return user;
  }

  // Personal upgrade logic
  user.planId = planId;
  user.planActivatedAt = new Date().toISOString();
  setItem(KEYS.CURRENT_USER, stripSensitiveSessionFields(user));
  
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) { users[idx] = { ...users[idx], planId, planActivatedAt: user.planActivatedAt }; setItem(KEYS.USERS, users); }
  
  if (canUseSupabase()) {
    safeSupabase(() => supabase.from('users').update({ planId, planActivatedAt: user.planActivatedAt }).eq('id', user.id));
  }
  notifyDataChange('users');
  return user;
}

export function canAddStudent() {
  const user = getCurrentUser();
  if (!user || user.type !== 'personal') return false;
  const plan = getUserPlan();
  if (!plan) return false;
  const students = getStudents();
  return students.length < plan.studentLimit;
}

export function getStudentUsage() {
  const user = getCurrentUser();
  if (!user) return { used: 0, limit: 0, percentage: 0 };
  const plan = getUserPlan();
  const students = getStudents();
  const limit = plan?.studentLimit === Infinity ? 999 : (plan?.studentLimit || 0);
  return { used: students.length, limit: plan?.studentLimit || 0, percentage: limit > 0 ? Math.round((students.length / limit) * 100) : 0 };
}

// ========== BACKGROUND SYNC (OFFLINE-FIRST) ==========
export async function forceSyncData() {
  if (!canUseSupabase()) return;
  const user = getCurrentUser();
  if (!user) return;

  if (user.type === 'master' || user.type === 'personal') {
    await refreshStudentsFromSupabase();
    await refreshWorkoutsFromSupabase();
    await refreshScheduleFromSupabase();
    await refreshEvolutionFromSupabase();
    await refreshPhotosFromSupabase();
  } else {
    const studentData = await fetchSupabaseRowByEmail('students', user.email);
    if (studentData) {
      const localStudents = getItem(KEYS.STUDENTS) || [];
      const idx = localStudents.findIndex(s => s.id === studentData.id);
      if (idx >= 0) localStudents[idx] = { ...localStudents[idx], ...studentData };
      else localStudents.push(studentData);
      setItem(KEYS.STUDENTS, localStudents);

      const updatedUser = { ...user, ...studentData, id: studentData.id, studentId: studentData.id, personalId: studentData.personalId, type: 'aluno' };
      setCurrentUser(updatedUser);
      notifyDataChange('students');

      const syncedWorkouts = await fetchWorkoutsForStudent(studentData.id, studentData.personalId, studentData.email || user.email);
      if (syncedWorkouts.length > 0) {
        localStorage.setItem(`workouts_${studentData.id}`, JSON.stringify(syncedWorkouts));
      }
      await refreshScheduleFromSupabase();
      await refreshEvolutionFromSupabase(updatedUser);
      await refreshPhotosFromSupabase(updatedUser);
    }
  }
}

// ========== AUTH ==========
export function getUsers() {
  return getItem(KEYS.USERS) || [];
}

export async function registerUser(userData) {
  const users = getUsers();
  const students = getItem(KEYS.STUDENTS) || [];
  const cleanEmail = normalizeEmail(userData.email);
  
  const existsInUsers = users.find(u => emailsMatch(u.email, cleanEmail));
  let existsInStudents = students.find(s => emailsMatch(s.email, cleanEmail));
  
  if (existsInUsers) {
    throw new Error('Email já cadastrado');
  }

  let studentId = undefined;
  let newStudentData = null;
  let claimedPersonalId = undefined;

  if (userData.type === 'aluno') {
    if (!existsInStudents) {
      const remoteStudent = await fetchSupabaseRowByEmail('students', cleanEmail);
      if (remoteStudent) {
        existsInStudents = remoteStudent;
        students.push(remoteStudent);
      }
    }

    if (existsInStudents) {
      // Claim logic: student was created by personal, now they are registering
      studentId = existsInStudents.id;
      // FIX: Carry personalId so the session immediately links to the PT
      claimedPersonalId = existsInStudents.personalId || undefined;
      
      // Update the existing student record with the new password
      existsInStudents.password = userData.password;
      existsInStudents.name = userData.name || existsInStudents.name;
      setItem(KEYS.STUDENTS, students);
      
      if (canUseSupabase()) {
         safeSupabase(() => supabase.from('students').update({ password: userData.password, name: existsInStudents.name }).eq('id', studentId));
      }
    } else {
      // Completely new student
      studentId = generateId();
      newStudentData = {
        id: studentId,
        name: userData.name,
        email: cleanEmail,
        phone: userData.phone || '',
        isPremium: false,
        workoutIds: [],
        password: userData.password,
        createdAt: new Date().toISOString()
      };
      students.push(newStudentData);
      setItem(KEYS.STUDENTS, students);
    }
  }

  const user = {
    id: claimedPersonalId ? studentId : generateId(),
    ...userData,
    email: cleanEmail,
    studentId,
    personalId: claimedPersonalId,
    planId: userData.type === 'personal' ? null : undefined,
    planActivatedAt: undefined,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  setItem(KEYS.USERS, users);
  const sessionUser = userData.type === 'aluno'
    ? await resolveStudentProfileForAuthUser(user, { persist: true })
    : setCurrentUser(user);


  if (canUseSupabase()) {
    if (userData.type !== 'aluno') {
      let supUser = { id: user.id, type: user.type, name: user.name, email: user.email, password: user.password, "studentLimit": user.studentLimit };
      safeSupabase(() => supabase.from('users').upsert(supUser));
    } else if (newStudentData) {
      safeSupabase(() => supabase.from('students').upsert(newStudentData));
    }
  }
  
  return sessionUser;
}

export async function loginUser(email, password) {
  const cleanEmail = normalizeEmail(email);
  const cleanPass = password?.trim();

  // 1. Search students first (includes PT-created records with personalId)
  let students = JSON.parse(localStorage.getItem('powerfit_students') || '[]');
  let studentData = students.find(u => emailsMatch(u.email, cleanEmail) && u.password === cleanPass);

  if (studentData) {
    const linkedStudent = students.find(u => emailsMatch(u.email, cleanEmail) && (u.personalId || u.personal_id)) || studentData;
    studentData = {
      ...studentData,
      ...linkedStudent,
      id: linkedStudent.id,
      studentId: linkedStudent.id,
      personalId: linkedStudent.personalId || linkedStudent.personal_id,
      isPremium: studentData.isPremium === true || linkedStudent.isPremium === true,
    };
    const studentSession = resolveStudentProfileFromCache({ ...studentData, type: 'aluno' });
    setCurrentUser(studentSession);
    forceSyncData().catch(() => {});
    return studentSession;
  } else {
    let users = JSON.parse(localStorage.getItem('powerfit_users') || '[]');
    let _user = users.find(u => emailsMatch(u.email, cleanEmail) && u.password === cleanPass);
    if (_user) {
      _user = setCurrentUser(_user);
      forceSyncData().catch(() => {});
      return _user;
    }
  }
  
  // 2. SUPABASE FALLBACK (If online — after scorched-earth, localStorage is empty)
  if (canUseSupabase()) {
    try {
      const su = await fetchSupabaseRowByEmail('users', cleanEmail);
      if (su && su.password === cleanPass) {
        const sessionUser = setCurrentUser(su);
        let localUsers = getUsers();
        if (!localUsers.find(u => u.id === sessionUser.id)) {
          setItem(KEYS.USERS, [...localUsers, sessionUser]);
        }
        // FIX: Sync all data from Supabase immediately
        forceSyncData().catch(() => {});
        return sessionUser;
      }

      const studentRows = await fetchSupabaseRowsByEmail('students', cleanEmail);
      const authenticatedStudent = studentRows.find(row => row.password === cleanPass);
      const linkedStudent = studentRows.find(row => row.personalId || row.personal_id) || authenticatedStudent;
      if (authenticatedStudent && linkedStudent) {
        const studentData = {
          ...authenticatedStudent,
          ...linkedStudent,
          id: linkedStudent.id,
          studentId: linkedStudent.id,
          personalId: linkedStudent.personalId || linkedStudent.personal_id,
          isPremium: authenticatedStudent.isPremium === true || linkedStudent.isPremium === true,
          type: 'aluno',
        };
        const studentSession = await resolveStudentProfileForAuthUser(studentData, { persist: true });
        const sessionUser = studentSession;
        let localStudents = getItem(KEYS.STUDENTS) || [];
        if (!localStudents.find(s => s.id === studentData.id)) {
          setItem(KEYS.STUDENTS, [...localStudents, sessionUser]);
        }
        forceSyncData().catch(() => {});
        return sessionUser;
      }
    } catch (e) {
      if (import.meta.env.DEV) console.debug('[PowerFit] Supabase auth fallback skipped:', e.message);
    }
  }

  throw new Error('Email ou senha incorretos');
}

export function getCurrentUser() {
  const currentUser = getItem(KEYS.CURRENT_USER);
  const hydrated = hydrateSessionUser(currentUser);
  const safeHydrated = stripSensitiveSessionFields(hydrated);
  if (safeHydrated && JSON.stringify(safeHydrated) !== JSON.stringify(currentUser)) {
    setItem(KEYS.CURRENT_USER, safeHydrated);
  }
  return safeHydrated;
}

export async function logout() {
  localStorage.removeItem(KEYS.CURRENT_USER);

  // Sign out from Supabase server-side (invalidates refresh token)
  try {
    await supabase.auth.signOut();
  } catch {
    // Non-blocking — client-side wipe already complete
  }
}

// ========== STUDENTS ==========
export function getStudents() {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const currentUser = getCurrentUser();
  
  if (!currentUser) return [];
  if (currentUser.type === 'master') return allStudents;
  if (currentUser.type === 'personal') {
    return allStudents.filter(s => s.personalId === currentUser.id || s.personal_id === currentUser.id);
  }
  if (currentUser.type === 'aluno') {
    const ownStudent = chooseStudentCandidate(currentUser, allStudents);
    return ownStudent ? [ownStudent] : [];
  }
  return [];
}

export function getStudentById(id) {
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const student = allStudents.find(s => s.id === id);
  if (student) return student;
  
  // Fallback: check if it's the current user
  const currentUser = getCurrentUser();
  if (currentUser?.id === id || currentUser?.studentId === id) {
    return currentUser;
  }
  
  return null;
}

export function getStudentByEmail(email) {
  if (!email) return null;
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const matches = allStudents.filter(s => emailsMatch(s.email, email));
  return matches.find(s => s.personalId || s.personal_id) || matches[0] || null;
}

export async function getTrainerById(id) {
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const users = getUsers();
  const localTrainer = users.find(u => u.id === id);
  if (localTrainer) return localTrainer;

  if (canUseSupabase()) {
    const rows = await safeSupabase(() => supabase.from('users').select('*').eq('id', id).limit(1));
    const data = Array.isArray(rows) ? rows[0] : rows;
    if (data) return data;
  }
  return null;
}


export async function saveStudent(studentData) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const currentUser = getCurrentUser();
  
  // Remove any existing entries with same email before saving
  const cleanStudentEmail = normalizeEmail(studentData.email);
  let remoteStudent = null;
  if (!studentData.id && cleanStudentEmail && canUseSupabase()) {
    remoteStudent = await fetchSupabaseRowByEmail('students', cleanStudentEmail);
    if (remoteStudent) mergeStudentCache(remoteStudent);
  }
  const existingByEmail = cleanStudentEmail
    ? (remoteStudent || allStudents.find(s => emailsMatch(s.email, cleanStudentEmail)))
    : null;
  const filteredStudents = allStudents.filter(s => !emailsMatch(s.email, cleanStudentEmail));
  
  let student;
  const requestedStudentId = studentData.id || existingByEmail?.id;
  if (requestedStudentId && requestedStudentId !== '') {
    const existingIdx = allStudents.findIndex(s => s.id === requestedStudentId);
    if (existingIdx !== -1) {
      student = { ...allStudents[existingIdx], ...studentData, id: requestedStudentId, updatedAt: new Date().toISOString() };
    } else {
      student = { ...(existingByEmail || {}), ...studentData, id: requestedStudentId, updatedAt: new Date().toISOString() };
    }
  } else {
    // Verificar limite do plano antes de adicionar novo aluno
    if (currentUser?.type === 'personal') {
      const plan = getUserPlan();
      if (!plan) throw new Error('Você precisa escolher um plano antes de adicionar alunos.');
      const myStudents = allStudents.filter(s => s.personalId === currentUser.id);
      if (myStudents.length >= plan.studentLimit) {
        throw new Error(`Limite de ${plan.studentLimit} alunos atingido no plano ${plan.name}. Faça upgrade para continuar.`);
      }
    }

    let verifiedPersonalId = currentUser?.id;

    student = {
      id: generateId(),
      ...studentData,
      email: cleanStudentEmail || studentData.email,
      personalId: verifiedPersonalId,
      isPremium: studentData.isPremium === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Ensure valid UUID id for localStorage
  if (!student.id || student.id === '') student.id = generateId();
  if (cleanStudentEmail) student.email = cleanStudentEmail;
  if (currentUser?.type === 'personal') student.personalId = student.personalId || currentUser.id;
  student.studentId = student.id;
  student.student_id = student.id;

  // ===== STRICT ALLOW-LIST PAYLOAD FOR SUPABASE =====
  const clean = (v) => (v === '' || v === undefined) ? null : v;
  const cleanNum = (v) => {
    if (v === '' || v === undefined || v === null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const supabasePayload = {
    id: student.id,
    name: clean(student.name) || 'Aluno',
    email: clean(student.email),
    phone: clean(student.phone),
    gender: clean(student.gender),
    birthDate: clean(student.birthDate),
    height: cleanNum(student.height),
    weight: cleanNum(student.weight),
    objective: clean(student.objective),
    daysPerWeek: cleanNum(student.daysPerWeek),
    shift: clean(student.shift),
    address: clean(student.address),
    medicalNotes: clean(student.medicalNotes),
    personalId: clean(student.personalId),
    isPremium: student.isPremium === true,
    password: student.password || '123456',
    workoutIds: Array.isArray(student.workoutIds) ? student.workoutIds : [],
    workoutSchedule: Array.isArray(student.workoutSchedule) ? student.workoutSchedule : null,
    createdAt: clean(student.createdAt),
    updatedAt: clean(student.updatedAt),
  };

  // Remove null id to let Supabase auto-generate
  if (!supabasePayload.id) delete supabasePayload.id;

  // Background Sync (Supabase First Write)
  if (canUseSupabase()) {
    try {
      const { error } = await supabase.from('students').upsert(supabasePayload);
      if (error) {
        console.error("SUPABASE ERROR:", JSON.stringify(error));
      }
    } catch (err) {
      console.error("SUPABASE NETWORK ERROR:", err.message);
    }
  }

  // Local Storage Update AFTER Supabase completes
  const updatedStudents = [...filteredStudents, student];
  setItem(KEYS.STUDENTS, updatedStudents);
  notifyDataChange('students');

  return updatedStudents;
}

export function updateWorkoutScheduleStatus(studentId, scheduleId, status = 'completed') {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const canonicalStudentId = getCanonicalStudentId(studentId) || studentId;
  const idx = allStudents.findIndex(s => s.id === canonicalStudentId || s.studentId === canonicalStudentId || s.student_id === canonicalStudentId);
  if (idx !== -1 && allStudents[idx].workoutSchedule) {
    const scheduleIdx = allStudents[idx].workoutSchedule.findIndex(w => w.id === scheduleId);
    if (scheduleIdx !== -1) {
      const now = new Date().toISOString();
      allStudents[idx].workoutSchedule[scheduleIdx].status = status;
      allStudents[idx].workoutSchedule[scheduleIdx].completed = status === 'completed' || status === 'archived';
      allStudents[idx].workoutSchedule[scheduleIdx].completedAt = status === 'pending' ? null : now;
      allStudents[idx].workoutSchedule[scheduleIdx].archivedAt = status === 'archived' ? now : null;
      allStudents[idx].updatedAt = now;
      
      setItem(KEYS.STUDENTS, allStudents);
      
      const currentUser = getCurrentUser();
      if (currentUser?.id === canonicalStudentId || currentUser?.studentId === canonicalStudentId || currentUser?.student_id === canonicalStudentId) {
        setItem(KEYS.CURRENT_USER, stripSensitiveSessionFields({ ...currentUser, workoutSchedule: allStudents[idx].workoutSchedule }));
      }

      if (canUseSupabase()) {
        safeSupabase(() => supabase.from('weekly_schedules').update({ status }).eq('id', scheduleId));
        safeSupabase(() => supabase.from('students').update({
          workoutSchedule: allStudents[idx].workoutSchedule,
          updatedAt: allStudents[idx].updatedAt
        }).eq('id', canonicalStudentId));
      }
      notifyDataChange('students');
      return allStudents[idx];
    }
  }
  return null;
}

export function toggleScheduleStatus(studentId, scheduleId) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const canonicalStudentId = getCanonicalStudentId(studentId) || studentId;
  const student = allStudents.find(s => s.id === canonicalStudentId || s.studentId === canonicalStudentId || s.student_id === canonicalStudentId);
  const schedule = student?.workoutSchedule?.find(w => w.id === scheduleId);
  const nextStatus = schedule?.status === 'completed' ? 'pending' : 'completed';
  return updateWorkoutScheduleStatus(canonicalStudentId, scheduleId, nextStatus);
}

export function hasActiveWorkoutsForStudent(student = {}) {
  const workoutSchedule = Array.isArray(student.workoutSchedule) ? student.workoutSchedule : [];
  return workoutSchedule.some(schedule => schedule?.status !== 'archived');
}

export function archiveActiveWorkoutsForStudent(studentId) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const canonicalStudentId = getCanonicalStudentId(studentId) || studentId;
  const idx = allStudents.findIndex(s => s.id === canonicalStudentId || s.studentId === canonicalStudentId || s.student_id === canonicalStudentId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const workoutSchedule = Array.isArray(allStudents[idx].workoutSchedule) ? allStudents[idx].workoutSchedule : [];
  let changed = false;

  allStudents[idx].workoutSchedule = workoutSchedule.map(schedule => {
    if (schedule.status === 'archived') return schedule;
    changed = true;
    return { ...schedule, status: 'archived', completed: true, completedAt: schedule.completedAt || now, archivedAt: now };
  });

  if (!changed) return allStudents[idx];

  allStudents[idx].updatedAt = now;
  setItem(KEYS.STUDENTS, allStudents);

  const currentUser = getCurrentUser();
  if (currentUser?.id === canonicalStudentId || currentUser?.studentId === canonicalStudentId) {
    setItem(KEYS.CURRENT_USER, stripSensitiveSessionFields({ ...currentUser, workoutSchedule: allStudents[idx].workoutSchedule }));
  }

  if (canUseSupabase()) {
    const archivedScheduleIds = allStudents[idx].workoutSchedule.map(schedule => schedule.id).filter(Boolean);
    if (archivedScheduleIds.length > 0) {
      safeSupabase(() => supabase.from('weekly_schedules').update({ status: 'archived' }).in('id', archivedScheduleIds));
    }
    safeSupabase(() => supabase.from('students').update({
      workoutSchedule: allStudents[idx].workoutSchedule,
      updatedAt: allStudents[idx].updatedAt
    }).eq('id', canonicalStudentId));
  }

  notifyDataChange('students');
  return allStudents[idx];
}

export async function deleteStudent(id) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  
  // Supabase First: Lógica de desvínculo em vez de deleção total
  if (canUseSupabase()) {
    await safeSupabase(() => supabase.from("students").update({ personalId: null }).eq("id", id));
  }

  const updatedAllStudents = allStudents.map(s => 
    s.id === id ? { ...s, personalId: null } : s
  );
  setItem(KEYS.STUDENTS, updatedAllStudents);
  notifyDataChange("students");

  const currentUser = getCurrentUser();
  if (currentUser?.type === "personal") {
    return updatedAllStudents.filter(s => s.personalId === currentUser.id || s.personal_id === currentUser.id);
  }

  return updatedAllStudents;
}

// ========== WORKOUTS ==========
export function getWorkouts() {
  const allWorkouts = (getItem(KEYS.WORKOUTS) || []).map(workout => normalizeWorkoutRecord(workout));
  const currentUser = getCurrentUser();
  if (currentUser?.type === "master") return allWorkouts;
  if (currentUser?.type === "personal") {
    return allWorkouts.filter(w =>
      (w.personalId === currentUser.id || w.personal_id === currentUser.id) &&
      !isStudentAIWorkout(w)
    );
  }
  if (currentUser?.type === "aluno") {
    return getStudentVisibleWorkouts(currentUser);
  }
  return allWorkouts;
}

export function getWorkoutById(id) {
  const allWorkouts = getItem(KEYS.WORKOUTS) || [];
  return allWorkouts.find(w => w.id === id);
}

export async function saveWorkout(workoutData) {
  const allWorkouts = getItem(KEYS.WORKOUTS) || [];
  const currentUser = getCurrentUser();
  const normalizedInput = normalizeWorkoutRecord(workoutData, currentUser?.id);
  
  let workout;
  if (normalizedInput.id) {
    const idx = allWorkouts.findIndex(w => w.id === normalizedInput.id);
    if (idx !== -1) {
      workout = normalizeWorkoutRecord(
        { ...allWorkouts[idx], ...normalizedInput, updatedAt: new Date().toISOString() },
        currentUser?.id
      );
    } else {
      workout = normalizeWorkoutRecord(
        { ...normalizedInput, updatedAt: new Date().toISOString() },
        currentUser?.id
      );
    }
  } else {
    workout = normalizeWorkoutRecord({
      id: generateId(),
      ...normalizedInput,
      personalId: currentUser?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, currentUser?.id);
  }

  const supabaseWorkout = buildWorkoutSupabasePayload(workout);
  
  // Supabase First
  if (canUseSupabase()) {
    try {
      const { error } = await supabase.from('workouts').upsert(supabaseWorkout);
      if (error && import.meta.env.DEV) {
        console.error('[PowerFit] Workout upsert failed:', error);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[PowerFit] Workout network error:', error.message);
      }
    }
  }

  // Local Storage AFTER Supabase
  if (normalizedInput.id) {
    const idx = allWorkouts.findIndex(w => w.id === normalizedInput.id);
    if (idx !== -1) {
      allWorkouts[idx] = workout;
    } else {
      allWorkouts.push(workout);
    }
  } else {
    allWorkouts.push(workout);
  }

  setItem(KEYS.WORKOUTS, allWorkouts);
  notifyDataChange('workouts');
  return allWorkouts;
}

export async function deleteWorkout(id) {
  // Supabase First
      if (canUseSupabase()) {
    // Only dispatch Supabase delete if strict UUID, avoiding errors with 'ai_' mock IDs
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) && !id.startsWith('ai_')) {
      await safeSupabase(() => supabase.from('workouts').delete().eq('id', id));
    }
  }

  const allWorkouts = getItem(KEYS.WORKOUTS) || [];
  const updatedWorkouts = allWorkouts.filter(w => w.id !== id);
  setItem(KEYS.WORKOUTS, updatedWorkouts);

  const allStudents = getItem(KEYS.STUDENTS) || [];
  let studentsChanged = false;
  const updatedStudents = allStudents.map(student => {
    const next = { ...student };

    if (Array.isArray(next.workoutIds)) {
      const filteredIds = next.workoutIds.filter(workoutId => workoutId !== id);
      if (filteredIds.length !== next.workoutIds.length) {
        next.workoutIds = filteredIds;
        studentsChanged = true;
      }
    }

    if (Array.isArray(next.workout_ids)) {
      const filteredIds = next.workout_ids.filter(workoutId => workoutId !== id);
      if (filteredIds.length !== next.workout_ids.length) {
        next.workout_ids = filteredIds;
        studentsChanged = true;
      }
    }

    if (Array.isArray(next.workoutSchedule)) {
      const filteredSchedule = next.workoutSchedule.filter(item => (item?.workoutId || item?.workout_id || item?.id) !== id);
      if (filteredSchedule.length !== next.workoutSchedule.length) {
        next.workoutSchedule = filteredSchedule;
        studentsChanged = true;
      }
    }

    if (Array.isArray(next.workout_schedule)) {
      const filteredSchedule = next.workout_schedule.filter(item => (item?.workoutId || item?.workout_id || item?.id) !== id);
      if (filteredSchedule.length !== next.workout_schedule.length) {
        next.workout_schedule = filteredSchedule;
        studentsChanged = true;
      }
    }

    return next;
  });

  if (studentsChanged) setItem(KEYS.STUDENTS, updatedStudents);

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('workouts_')) continue;
    const cached = getItem(key);
    if (!Array.isArray(cached)) continue;
    const filtered = cached.filter(workout => workout?.id !== id);
    if (filtered.length !== cached.length) setItem(key, filtered);
  }

  notifyDataChange('workouts');

  return updatedWorkouts;
}

export async function assignWorkoutToStudent(workoutId, studentId, dayOfWeek = 'Segunda', isAI = false, options = {}) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const canonicalStudent = getCanonicalStudentProfile(studentId);
  const canonicalStudentId = canonicalStudent?.id || studentId;
  const idx = allStudents.findIndex(s => s.id === canonicalStudentId || s.studentId === canonicalStudentId || s.student_id === canonicalStudentId);
  if (idx !== -1) {
    let archivedScheduleIds = [];
    if (options.archiveActive) {
      const now = new Date().toISOString();
      const currentSchedule = Array.isArray(allStudents[idx].workoutSchedule) ? allStudents[idx].workoutSchedule : [];
      archivedScheduleIds = currentSchedule.map(schedule => schedule.id).filter(Boolean);
      allStudents[idx].workoutSchedule = currentSchedule.map(schedule => (
        schedule.status === 'archived'
          ? schedule
          : { ...schedule, status: 'archived', completed: true, completedAt: schedule.completedAt || now, archivedAt: now }
      ));
    }

    const assignedWorkout = getWorkoutById(workoutId);
    const normalizedDay = normalizeWorkoutDay(dayOfWeek);
    const scheduleEntry = {
      workoutId,
      day: normalizedDay,
      id: generateId(),
      isAI,
      status: 'pending',
      completed: false,
      completedAt: null
    };
    allStudents[idx].studentId = allStudents[idx].id;
    allStudents[idx].student_id = allStudents[idx].id;
    allStudents[idx].email = normalizeEmail(allStudents[idx].email);

    if (!allStudents[idx].workoutSchedule) allStudents[idx].workoutSchedule = [];
    allStudents[idx].workoutSchedule.push(scheduleEntry);
    
    if (!allStudents[idx].workoutIds) allStudents[idx].workoutIds = [];
    if (!allStudents[idx].workoutIds.includes(workoutId)) {
      allStudents[idx].workoutIds.push(workoutId);
    }

    // Supabase First
    if (canUseSupabase()) {
      if (archivedScheduleIds.length > 0) {
        await safeSupabase(() => supabase.from('weekly_schedules').update({ status: 'archived' }).in('id', archivedScheduleIds));
      }

      await safeSupabase(() => supabase.from('weekly_schedules').upsert({
        id: scheduleEntry.id,
        student_id: canonicalStudentId,
        workout_id: workoutId,
        day_of_week: normalizedDay,
        label: assignedWorkout?.name || 'Treino',
        focus: assignedWorkout?.category || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));

      await safeSupabase(() => supabase.from('students').update({
        workoutSchedule: allStudents[idx].workoutSchedule,
        workoutIds: allStudents[idx].workoutIds,
        updatedAt: new Date().toISOString()
      }).eq('id', canonicalStudentId));
    }

    setItem(KEYS.STUDENTS, allStudents);
    notifyDataChange('students');
  }
}

export function unassignWorkoutFromSchedule(studentId, scheduleId) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const idx = allStudents.findIndex(s => s.id === studentId);
  if (idx !== -1 && allStudents[idx].workoutSchedule) {
    allStudents[idx].workoutSchedule = allStudents[idx].workoutSchedule.filter(w => w.id !== scheduleId);
    setItem(KEYS.STUDENTS, allStudents);
    notifyDataChange('students');

    if (canUseSupabase()) {
      safeSupabase(() => supabase.from('students').update({
        workoutSchedule: allStudents[idx].workoutSchedule,
        updatedAt: new Date().toISOString()
      }).eq('id', studentId));
    }
  }
}

// ========== PERSONAL TRAINER ACCOUNT UPGRADE ==========
export function expandPersonalLimit(personalId) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === personalId);
  if (idx !== -1) {
    users[idx].studentLimit = (users[idx].studentLimit || 10) + 10;
    setItem(KEYS.USERS, users);
    const currentUser = getCurrentUser();
    if (currentUser?.id === personalId) setItem(KEYS.CURRENT_USER, stripSensitiveSessionFields(users[idx]));
  }
}

// ========== EVOLUTION ==========
export function getEvolution() {
  return getItem(KEYS.EVOLUTION) || [];
}

export function getEvolutionByStudent(studentId, studentEmail = null) {
  const scoped = getStudentScopedIdentity(studentId, studentEmail);

  return getEvolution()
    .filter(e =>
      scoped.ids.has(e.studentId) ||
      scoped.ids.has(e.student_id) ||
      (emailsMatch(e.studentEmail || e.student_email || e.email, scoped.email) && sameOrMissingPersonalId(e.personalId || e.personal_id, scoped.personalId))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function getStudentVisibleEvolution(profile = null) {
  const scoped = getStudentScopedIdentity(profile || getCurrentUser());
  return getEvolutionByStudent(scoped.id, scoped.email);
}

function buildEvolutionSupabasePayload(entry = {}) {
  return {
    id: entry.id,
    studentId: entry.studentId,
    date: entry.date,
    weight: entry.weight ?? null,
    bodyFat: entry.bodyFat ?? null,
    arm: entry.arm ?? null,
    legs: entry.legs ?? null,
    chest: entry.chest ?? null,
    waist: entry.waist ?? null,
    hip: entry.hip ?? null,
    thigh: entry.thigh ?? null,
    createdAt: entry.createdAt || null,
  };
}

export function saveEvolutionEntry(entry) {
  const evolution = getEvolution();
  const scoped = getStudentScopedIdentity(entry.studentId || entry.student_id, entry.studentEmail || entry.student_email || entry.email);
  const record = {
    id: generateId(),
    ...entry,
    studentId: scoped.id || entry.studentId || entry.student_id,
    student_id: scoped.id || entry.studentId || entry.student_id,
    studentEmail: scoped.email || entry.studentEmail || entry.student_email || null,
    student_email: scoped.email || entry.studentEmail || entry.student_email || null,
    personalId: scoped.personalId || entry.personalId || entry.personal_id || null,
    personal_id: scoped.personalId || entry.personalId || entry.personal_id || null,
    createdAt: new Date().toISOString(),
  };
  evolution.push(record);
  setItem(KEYS.EVOLUTION, evolution);

  if (canUseSupabase()) {
    safeSupabase(() => supabase.from('evolution').upsert(buildEvolutionSupabasePayload(record)));
  }
  notifyDataChange('evolution');
  return evolution;
}

export function deleteEvolutionEntry(id) {
  const evolution = getEvolution().filter(e => e.id !== id);
  setItem(KEYS.EVOLUTION, evolution);

  if (canUseSupabase()) {
    safeSupabase(() => supabase.from('evolution').delete().eq('id', id));
  }
  notifyDataChange('evolution');
  return evolution;
}

// ========== SCHEDULE ==========
function getRawSchedule() {
  return getItem(KEYS.SCHEDULE) || [];
}

export function getSchedule() {
  const schedule = getRawSchedule();
  const currentUser = getCurrentUser();

  if (currentUser?.type === 'personal') {
    const ownStudentIds = new Set(getStudents().map(student => student.id).filter(Boolean));
    return schedule.filter(event =>
      !isStudentAIScheduleEvent(event) &&
      (
        (event.personalId || event.personal_id) === currentUser.id ||
        (!(event.personalId || event.personal_id) && ownStudentIds.has(event.studentId || event.student_id))
      )
    );
  }

  if (currentUser?.type === 'aluno') {
    return getStudentVisibleSchedule(currentUser);
  }

  return schedule;
}

export function getScheduleByDate(date) {
  return getSchedule().filter(s => s.date === date);
}

export async function saveScheduleEvent(event) {
  const schedule = getRawSchedule();
  let record;
  if (event.id) {
    const idx = schedule.findIndex(s => s.id === event.id);
    if (idx !== -1) {
      record = { ...schedule[idx], ...event };
      schedule[idx] = record;
    } else {
      record = event;
    }
  } else {
    record = { id: generateId(), ...event, createdAt: new Date().toISOString() };
    schedule.push(record);
  }

  const currentUser = getCurrentUser();
  const selectedStudent = getCanonicalStudentProfile(record.studentId || record.student_id, record.studentEmail || record.student_email || record.email);
  record = normalizeScheduleRecord({
    ...record,
    studentId: selectedStudent?.id || record.studentId || record.student_id || null,
    studentEmail: selectedStudent?.email || record.studentEmail || record.student_email || null,
    personalId: selectedStudent?.personalId || selectedStudent?.personal_id || record.personalId || currentUser?.id || null,
  });

  if (canUseSupabase()) {
    await safeSupabase(() => supabase.from('schedule').upsert(buildScheduleSupabasePayload(record)));
  }

  const idx = schedule.findIndex(s => s.id === record.id);
  if (idx !== -1) schedule[idx] = record;
  else schedule.push(record);
  setItem(KEYS.SCHEDULE, schedule);
  notifyDataChange('schedule');
  return schedule;
}

export async function deleteScheduleEvent(id) {
  if (canUseSupabase()) {
    await safeSupabase(() => supabase.from('schedule').delete().eq('id', id));
  }

  const schedule = getRawSchedule().filter(s => s.id !== id);
  setItem(KEYS.SCHEDULE, schedule);
  notifyDataChange('schedule');
  return schedule;
}

// ========== PHOTOS (Before/After) ==========
export function getPhotos() {
  return getItem(KEYS.PHOTOS) || [];
}

export function getPhotosByStudent(studentId, studentEmail = null) {
  const scoped = getStudentScopedIdentity(studentId, studentEmail);

  return getPhotos()
    .filter(p =>
      scoped.ids.has(p.studentId) ||
      scoped.ids.has(p.student_id) ||
      (emailsMatch(p.studentEmail || p.student_email || p.email, scoped.email) && sameOrMissingPersonalId(p.personalId || p.personal_id, scoped.personalId))
    )
    .map(photo => ({
      ...photo,
      studentId: photo.studentId || photo.student_id,
      image: photo.image || photo.url || '',
      label: photo.label || photo.type || '',
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function getStudentVisiblePhotos(profile = null) {
  const scoped = getStudentScopedIdentity(profile || getCurrentUser());
  return getPhotosByStudent(scoped.id, scoped.email);
}

export function getStudentVisibleBodyTargets(profile = null) {
  const scoped = getStudentScopedIdentity(profile || getCurrentUser());
  const targetMuscles = scoped.student?.target_muscles || scoped.student?.targetMuscles;
  if (Array.isArray(targetMuscles)) return targetMuscles;

  const key = scoped.id ? `powerfit_atlas_targets_${scoped.id}` : 'powerfit_atlas_targets';
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function buildPhotoSupabasePayload(photo = {}) {
  return {
    id: photo.id,
    studentId: photo.studentId,
    date: photo.date,
    image: photo.image || photo.url || '',
    label: photo.label || photo.type || null,
    url: photo.image || photo.url || null,
    type: photo.label || photo.type || null,
    createdAt: photo.createdAt || null,
  };
}

export async function savePhoto(photoData) {
  const photos = getPhotos();
  const scoped = getStudentScopedIdentity(photoData.studentId || photoData.student_id, photoData.studentEmail || photoData.student_email || photoData.email);
  const record = {
    id: generateId(),
    ...photoData,
    studentId: scoped.id || photoData.studentId || photoData.student_id,
    student_id: scoped.id || photoData.studentId || photoData.student_id,
    studentEmail: scoped.email || photoData.studentEmail || photoData.student_email || null,
    student_email: scoped.email || photoData.studentEmail || photoData.student_email || null,
    personalId: scoped.personalId || photoData.personalId || photoData.personal_id || null,
    personal_id: scoped.personalId || photoData.personalId || photoData.personal_id || null,
    createdAt: new Date().toISOString()
  };

  if (canUseSupabase()) {
    await safeSupabase(() => supabase.from('photos').upsert(buildPhotoSupabasePayload(record)));
  }

  photos.push(record);
  setItem(KEYS.PHOTOS, photos);
  notifyDataChange('photos');
  return photos;
}

export async function deletePhoto(id) {
  if (canUseSupabase()) {
    await safeSupabase(() => supabase.from('photos').delete().eq('id', id));
  }

  const photos = getPhotos().filter(p => p.id !== id);
  setItem(KEYS.PHOTOS, photos);
  notifyDataChange('photos');
  return photos;
}

// ========== NOTIFICATIONS ==========
export function getNotifications() {
  const allNotifs = getItem("powerfit_notifications") || [];
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  // Busca o ID interno do aluno pelo email (Ponte Claim)
  const studentRecord = getStudentByEmail(currentUser.email) || currentUser;
  const internalId = studentRecord.id || currentUser.id || currentUser.studentId;

  return allNotifs.filter(n => n.studentId === internalId);
}

export function getNotificationsByStudent(studentId) {
  const allNotifs = getItem("powerfit_notifications") || [];
  return allNotifs.filter(n => n.studentId === studentId);
}

export function saveNotification(studentId, message) {
  const notifs = getItem("powerfit_notifications") || [];
  const notif = {
    id: generateId(),
    studentId,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifs.push(notif);
  setItem('powerfit_notifications', notifs);

  notifyDataChange('notifications');
  return notifs;
}

export function markNotificationsAsRead(studentId) {
  const notifs = getItem("powerfit_notifications") || [];
  let updated = false;
  notifs.forEach(n => {
    if (n.studentId === studentId && !n.read) {
      n.read = true;
      updated = true;
    }
  });
  if (updated) {
    setItem('powerfit_notifications', notifs);
    notifyDataChange('notifications');
  }
}

// ========== THEME ==========
export function getTheme() {
  return getItem(KEYS.THEME) || 'dark';
}

export function setTheme(theme) {
  setItem(KEYS.THEME, theme);
}

// ========== MERCADO PAGO ==========
export function getMercadoPagoToken() {
  return getItem(KEYS.MERCADO_PAGO_TOKEN) || '';
}

export function saveMercadoPagoToken(token) {
  setItem(KEYS.MERCADO_PAGO_TOKEN, token);
}

// ========== IMC / METRICS CALCULATIONS ==========
export function calculateIMC(weight, heightCm) {
  const peso = Number(weight);
  const altura = Number(heightCm);
  if (!peso || !altura || altura <= 0) return null;
  
  const alturaMetros = altura < 3 ? altura : (altura / 100);
  const imc = peso / Math.pow(alturaMetros, 2);
  
  if (!isFinite(imc) || imc <= 0) return null;
  let classification = '';
  if (imc < 18.5) classification = 'Abaixo do peso';
  else if (imc < 25) classification = 'Peso normal';
  else if (imc < 30) classification = 'Sobrepeso';
  else if (imc < 35) classification = 'Obesidade I';
  else if (imc < 40) classification = 'Obesidade II';
  else classification = 'Obesidade III';
  return { value: Math.round(imc * 10) / 10, classification };
}

export function calculateTMB(weight, heightCm, age, gender) {
  const peso = Number(weight);
  let altura = Number(heightCm);
  const idade = Number(age);
  if (!peso || !altura || !idade || peso <= 0 || altura <= 0 || idade <= 0) return null;
  
  // se inseriram 1.80m ao invés de cm, ajusta para a fórmula
  if (altura < 3) altura = altura * 100;
  
  const g = (gender || '').toLowerCase();
  
  // Harris-Benedict Formulas com casting explícito de tudo
  if (g === 'female' || g === 'feminino') {
    return Math.max(0, Math.round(Number(655.1) + (Number(9.563) * peso) + (Number(1.850) * altura) - (Number(4.676) * idade)));
  }
  // Default to male or masculino
  return Math.max(0, Math.round(Number(66.5) + (Number(13.75) * peso) + (Number(5.003) * altura) - (Number(6.75) * idade)));
}

export function calculateCalories(tmb, daysPerWeek) {
  const t = Number(tmb);
  const d = Number(daysPerWeek) || 0;
  if (!t || t <= 0) return null;
  let factor = 1.2; // sedentary
  if (d >= 1 && d <= 2) factor = 1.375;
  else if (d >= 3 && d <= 4) factor = 1.55;
  else if (d >= 5 && d <= 6) factor = 1.725;
  else if (d >= 7) factor = 1.9;
  return {
    maintenance: Math.round(t * factor),
    loss: Math.round(t * factor * 0.8),
    gain: Math.round(t * factor * 1.15),
  };
}

// ========== WHATSAPP ==========
export function sendWorkoutViaWhatsApp(phone, workout, studentName) {
  let message = `🏋️ *PowerFit - Treino*\n\n`;
  message += `👤 Aluno: ${studentName}\n`;
  message += `📋 Treino: ${workout.name}\n`;
  message += `📝 ${workout.description || ''}\n\n`;
  
  if (workout.exercises && workout.exercises.length > 0) {
    message += `*Exercícios:*\n\n`;
    workout.exercises.forEach((ex, i) => {
      message += `${i + 1}. *${ex.name}*\n`;
      message += `   📊 ${ex.sets}x${ex.reps}`;
      if (ex.weight) message += ` | ${ex.weight}kg`;
      if (ex.rest) message += ` | ⏱️ ${ex.rest}s descanso`;
      message += `\n`;
      if (ex.notes) message += `   💡 ${ex.notes}\n`;
      message += `\n`;
    });
  }
  
  message += `\n💪 Bom treino!`;
  
  const cleanPhone = phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

// ========== EXPORT / IMPORT ==========
export function exportAllData() {
  const data = sanitizeExportData({
    version: '2.0',
    exportDate: new Date().toISOString(),
    users: getItem(KEYS.USERS),
    students: getItem(KEYS.STUDENTS),
    workouts: getItem(KEYS.WORKOUTS),
    evolution: getItem(KEYS.EVOLUTION),
    schedule: getItem(KEYS.SCHEDULE),
    photos: getItem(KEYS.PHOTOS),
    studentIntakes: getStudentIntakesForBackup(),
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `powerfit_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(jsonString) {
  try {
    const data = sanitizeImportData(JSON.parse(jsonString));
    if (!data.version) throw new Error('Arquivo inválido');
    if (data.users) setItem(KEYS.USERS, data.users);
    if (data.students) setItem(KEYS.STUDENTS, data.students);
    if (data.workouts) setItem(KEYS.WORKOUTS, data.workouts);
    if (data.evolution) setItem(KEYS.EVOLUTION, data.evolution);
    if (data.schedule) setItem(KEYS.SCHEDULE, data.schedule);
    if (data.photos) setItem(KEYS.PHOTOS, data.photos);
    if (data.studentIntakes) importStudentIntakes(data.studentIntakes);
    const importedCurrentUser = data.powerfit_current_user || data.current_user || data.currentUser;
    if (importedCurrentUser) setItem(KEYS.CURRENT_USER, importedCurrentUser);
    return true;
  } catch (err) {
    throw new Error('Arquivo de backup inválido: ' + err.message);
  }
}

// ========== DEMO DATA SEEDING ==========
export function seedDemoData() {
  // Mock removido - Dados agora vêm do Supabase
}



export function isUserVIP(email) {
  return isVipUser(email);
}

export function activateStudentProDemo(profile = null) {
  const source = profile || getCurrentUser();
  const target = source?.id || source?.studentId || source?.student_id || source?.email;
  if (!target) return false;

  const activated = activatePremium(target);
  if (!activated) return false;

  const resolved = resolveStudentProfileFromCache(getCurrentUser() || source);
  if (!resolved) return activated;

  const premiumSession = {
    ...resolved,
    isPremium: isStudentPremium(resolved),
  };
  setCurrentUser(premiumSession);
  return getCurrentUser();
}

export function activatePremium(userId) {
  const users = getItem(KEYS.USERS) || [];
  const students = getItem(KEYS.STUDENTS) || [];
  const currentUser = getCurrentUser();
  const targetEmail = normalizeEmail(
    currentUser?.email ||
    users.find(u => u.id === userId || u.studentId === userId || u.student_id === userId || u.email === userId)?.email ||
    students.find(s => s.id === userId || s.studentId === userId || s.student_id === userId || s.email === userId)?.email ||
    userId
  );
  const premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  let changed = false;
  const matchesTarget = (record = {}) => (
    record.id === userId ||
    record.studentId === userId ||
    record.student_id === userId ||
    emailsMatch(record.email, userId) ||
    emailsMatch(record.email, targetEmail)
  );

  const updatedStudents = students.map(student => {
    if (!matchesTarget(student)) return student;
    changed = true;
    return { ...student, isPremium: true, premiumExpiresAt };
  });

  const updatedUsers = users.map(user => {
    if (!matchesTarget(user)) return user;
    changed = true;
    return { ...user, isPremium: true, premiumExpiresAt };
  });

  if (!changed) return false;

  setItem(KEYS.USERS, updatedUsers);
  setItem(KEYS.STUDENTS, updatedStudents);

  const currentMatches = currentUser && matchesTarget(currentUser);
  if (currentMatches) {
    const updatedStudent = updatedStudents.find(matchesTarget);
    const updatedUser = updatedUsers.find(matchesTarget);
    const updatedSession = stripSensitiveSessionFields({
      ...(updatedUser || {}),
      ...(updatedStudent || {}),
      ...currentUser,
      isPremium: true,
      premiumExpiresAt,
      type: currentUser.type || 'aluno',
    });
    setItem(KEYS.CURRENT_USER, updatedSession);
    if (canUseSupabase() && updatedStudent?.id) {
      safeSupabase(() => supabase.from('students').update({ isPremium: true, premiumExpiresAt }).eq('id', updatedStudent.id));
    }
    notifyDataChange('users');
    notifyDataChange('students');
    return updatedSession;
  }

  notifyDataChange('users');
  notifyDataChange('students');
  return true;
}

// ========== SAVE PROFILE (EMAIL-FIRST LOOKUP) ==========
export const saveProfile = (userIdOrEmail, updates) => {
  try {
    const students = JSON.parse(localStorage.getItem('powerfit_students') || '[]');
    const users = JSON.parse(localStorage.getItem('powerfit_users') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('powerfit_current_user') || '{}');
    const email = currentUser?.email || userIdOrEmail;
    const cleanEmail = email?.trim()?.toLowerCase();

    // Search by EMAIL first (bypasses ID desync)
    let idx = students.findIndex(u => u.email?.trim()?.toLowerCase() === cleanEmail);
    let isStudent = idx !== -1;
    if (idx === -1) {
      idx = users.findIndex(u => u.email?.trim()?.toLowerCase() === cleanEmail);
      isStudent = false;
    }
    // Fallback to ID search
    if (idx === -1) {
      idx = students.findIndex(u => u.id === userIdOrEmail);
      isStudent = idx !== -1;
      if (idx === -1) {
        idx = users.findIndex(u => u.id === userIdOrEmail);
        isStudent = false;
      }
    }

    const list = isStudent ? students : users;
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem(
        isStudent ? 'powerfit_students' : 'powerfit_users',
        JSON.stringify(list)
      );
      localStorage.setItem('powerfit_current_user', JSON.stringify(stripSensitiveSessionFields(list[idx])));
      notifyDataChange(isStudent ? 'students' : 'users');
      return { success: true };
    }
    return { success: false, error: 'User not found' };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// ========== GET STUDENT DATA (EMAIL-FIRST) ==========
export function getStudentData(idOrEmail) {
  const students = JSON.parse(localStorage.getItem('powerfit_students') || '[]');
  const currentUser = JSON.parse(localStorage.getItem('powerfit_current_user') || '{}');
  const email = currentUser?.email || idOrEmail;
  const cleanEmail = email?.trim()?.toLowerCase();
  // Email-first lookup
  let student = students.find(s => s.email?.trim()?.toLowerCase() === cleanEmail);
  if (!student) student = students.find(s => s.id === idOrEmail);
  return student || null;
}

