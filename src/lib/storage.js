// PowerFit - localStorage + Supabase Offline-First Data Layer
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { notifyDataChange } from './useStorageSync';

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

function isMissingSessionValue(value) {
  return value === undefined || value === null || value === '';
}

export function hydrateSessionUser(user) {
  if (!user || typeof user !== 'object') return null;

  const cleanEmail = user.email?.trim?.().toLowerCase?.();
  const localUsers = getItem(KEYS.USERS) || [];
  const localStudents = getItem(KEYS.STUDENTS) || [];

  const localUser = localUsers.find(item =>
    (user.id && item.id === user.id) ||
    (cleanEmail && item.email?.trim?.().toLowerCase?.() === cleanEmail)
  );
  const localStudent = localStudents.find(item =>
    (user.id && (item.id === user.id || item.studentId === user.id || item.student_id === user.id)) ||
    (user.studentId && item.id === user.studentId) ||
    (cleanEmail && item.email?.trim?.().toLowerCase?.() === cleanEmail)
  );

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

  return hydrated;
}

function setCurrentUser(user) {
  const hydrated = hydrateSessionUser(user);
  if (hydrated) setItem(KEYS.CURRENT_USER, hydrated);
  return hydrated;
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

  return {
    ...workout,
    studentId: normalizedStudentId,
    student_id: normalizedStudentId,
    personalId: normalizedPersonalId,
    personal_id: normalizedPersonalId,
    studentEmail: normalizedStudentEmail,
    student_email: normalizedStudentEmail,
  };
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
  return {
    id: record.id || record.scheduleId || record.schedule_id || generateId(),
    workoutId: record.workoutId || record.workout_id,
    workout_id: record.workoutId || record.workout_id,
    day: normalizeWorkoutDay(record.day || record.dayOfWeek || record.day_of_week),
    dayOfWeek: normalizeWorkoutDay(record.day || record.dayOfWeek || record.day_of_week),
    day_of_week: normalizeWorkoutDay(record.day || record.dayOfWeek || record.day_of_week),
    isAI: record.isAI === true || record.is_ai === true,
    status: record.status || (record.completed ? 'completed' : 'pending'),
    completed: record.completed === true,
    completedAt: record.completedAt || record.completed_at || null,
  };
}

function mergeStudentCache(studentData) {
  if (!studentData?.id && !studentData?.email) return;

  const localStudents = getItem(KEYS.STUDENTS) || [];
  const idx = localStudents.findIndex(student =>
    (studentData.id && student.id === studentData.id) ||
    (studentData.email && student.email?.toLowerCase?.() === studentData.email.toLowerCase())
  );

  if (idx >= 0) localStudents[idx] = { ...localStudents[idx], ...studentData };
  else localStudents.push(studentData);

  setItem(KEYS.STUDENTS, localStudents);
  notifyDataChange('students');
}

async function fetchStudentAssignmentRecord(studentId, fallbackEmail = null) {
  const localStudents = getItem(KEYS.STUDENTS) || [];
  const localStudent = localStudents.find(student =>
    (studentId && (student.id === studentId || student.studentId === studentId || student.student_id === studentId)) ||
    (fallbackEmail && student.email?.toLowerCase?.() === fallbackEmail.toLowerCase())
  );

  if (!canUseSupabase()) return localStudent || null;

  const queries = [];
  if (studentId && UUID_PATTERN.test(studentId)) {
    queries.push(() => supabase.from('students').select('*').eq('id', studentId).limit(1));
  }
  if (fallbackEmail) {
    queries.push(() => supabase.from('students').select('*').eq('email', fallbackEmail.toLowerCase().trim()).limit(1));
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
    const scheduleKey = `${workoutId}:${day}`;
    if (addedScheduleKeys.has(scheduleKey)) continue;
    addedScheduleKeys.add(scheduleKey);

    result.push({
      ...workout,
      scheduleId: schedule?.id || schedule?.scheduleId || schedule?.schedule_id || null,
      day,
      status: schedule?.status || (schedule?.completed ? 'completed' : 'pending'),
      completed: schedule?.completed === true,
      completedAt: schedule?.completedAt || schedule?.completed_at || null,
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
  if (workoutIds.length === 0) return [];

  const localWorkouts = (getItem(KEYS.WORKOUTS) || []).filter(workout => workoutIds.includes(workout.id));
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
    personalId: record.personalId || record.personal_id || null,
  };
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

  let query = supabase.from('students').select('*');
  if (currentUser.type === 'personal') query = query.eq('personalId', currentUser.id);
  if (currentUser.type === 'aluno') query = query.eq('email', currentUser.email?.toLowerCase?.().trim());

  const rows = await safeSupabase(() => query);
  if (Array.isArray(rows)) mergeRowsIntoCache(KEYS.STUDENTS, rows, 'students');
  return getStudents();
}

export async function refreshWorkoutsFromSupabase() {
  if (!canUseSupabase()) return getWorkouts();

  const currentUser = getCurrentUser();
  if (!currentUser) return getWorkouts();

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
  if (currentUser.type === 'aluno') query = query.eq('studentId', currentUser.studentId || currentUser.id);

  const rows = await safeSupabase(() => query);
  if (Array.isArray(rows)) {
    mergeRowsIntoCache(KEYS.SCHEDULE, rows.map(normalizeScheduleRecord), 'schedule');
  }
  return getSchedule();
}

// ========== PLANOS E ASSINATURA ==========
export const PLANS = [
  { id: 'starter', name: 'Starter', studentLimit: 10, price: 20, priceLabel: 'R$ 20,00', popular: false, features: ['Até 10 alunos', 'Dashboard completo', 'Montagem de treinos', 'Agenda de horários', 'Suporte por email'] },
  { id: 'pro', name: 'Pro', studentLimit: 20, price: 40, priceLabel: 'R$ 40,00', popular: true, features: ['Até 20 alunos', 'Tudo do Starter', 'Fotos antes/depois', 'Evolução e gráficos', 'Envio via WhatsApp', 'Suporte prioritário'] },
  { id: 'premium', name: 'Premium', studentLimit: 50, price: 80, priceLabel: 'R$ 80,00', popular: false, features: ['Até 50 alunos', 'Tudo do Pro', 'Export/Import de dados', 'Relatórios avançados', 'IA PowerFit (em breve)', 'Suporte VIP'] },
  { id: 'elite', name: 'Elite', studentLimit: Infinity, price: 120, priceLabel: 'R$ 120,00', popular: false, features: ['Alunos ilimitados', 'Tudo do Premium', 'API de integração', 'Marca personalizada', 'Painel Master', 'Suporte dedicado 24/7'] },
];

export const STUDENT_PLANS = [
  { id: 'student-free', name: 'Aluno Free', price: 0, priceLabel: 'Grátis', features: ['Acesso aos treinos', 'Gráficos básicos', 'Histórico de fotos', 'Perfil do Aluno'] },
  { id: 'student-pro', name: 'Aluno Pro', price: 29.90, priceLabel: 'R$ 29,90', popular: true, features: ['IA Personal Trainer', 'Atlas Anatômico 3D', 'Gráficos de Evolução', 'Relatórios em PDF', 'Sem anúncios', 'Suporte Prioritário'] },
];

export function getPlans(type = 'personal') { 
  return type === 'aluno' ? STUDENT_PLANS : PLANS; 
}

export function isVipUser(email) {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const students = getItem(KEYS.STUDENTS) || [];
  const student = students.find(s => s.email?.trim?.().toLowerCase?.() === cleanEmail);
  return student?.isPremium === true && (!student.premiumExpiresAt || new Date(student.premiumExpiresAt) > new Date());
}

export function getUserPlan(userId) {
  const user = userId ? getUsers().find(u => u.id === userId) : getCurrentUser();
  if (!user) return null;
  
  // Student Plan Logic
  if (user.type === 'aluno') {
    const student = getStudentById(userId || user.id) || user;
    const isPremium = student.isPremium === true || user.isPremium === true || isVipUser(user.email);
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
    user.isPremium = isPro;
    setItem(KEYS.CURRENT_USER, user);
    
    const students = getStudents();
    const idx = students.findIndex(s => s.id === user.id);
    if (idx !== -1) {
      students[idx] = { ...students[idx], isPremium: isPro };
      setItem(KEYS.STUDENTS, students);
    }
    
    if (canUseSupabase()) {
      safeSupabase(() => supabase.from('students').update({ isPremium: isPro }).eq('id', user.id));
    }
    notifyDataChange('students');
    return user;
  }

  // Personal upgrade logic
  user.planId = planId;
  user.planActivatedAt = new Date().toISOString();
  setItem(KEYS.CURRENT_USER, user);
  
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
  } else {
    const studentRows = await safeSupabase(() =>
      supabase.from('students').select('*').eq('email', user.email?.toLowerCase?.().trim()).limit(1)
    );
    const studentData = Array.isArray(studentRows) ? studentRows[0] : studentRows;
    if (studentData) {
      const localStudents = getItem(KEYS.STUDENTS) || [];
      const idx = localStudents.findIndex(s => s.email === user.email);
      if (idx >= 0) localStudents[idx] = { ...localStudents[idx], ...studentData };
      else localStudents.push(studentData);
      setItem(KEYS.STUDENTS, localStudents);

      const updatedUser = { ...user, ...studentData, personalId: studentData.personalId, type: 'aluno' };
      setCurrentUser(updatedUser);
      notifyDataChange('students');

      const syncedWorkouts = await fetchWorkoutsForStudent(studentData.id, studentData.personalId, studentData.email || user.email);
      if (syncedWorkouts.length > 0) {
        localStorage.setItem(`workouts_${studentData.id}`, JSON.stringify(syncedWorkouts));
      }
      await refreshScheduleFromSupabase();
    }
  }
}

// ========== AUTH ==========
export function getUsers() {
  return getItem(KEYS.USERS) || [];
}

export function registerUser(userData) {
  const users = getUsers();
  const students = getStudents();
  const cleanEmail = userData.email?.trim().toLowerCase();
  
  const existsInUsers = users.find(u => u.email?.trim().toLowerCase() === cleanEmail);
  const existsInStudents = students.find(s => s.email?.trim().toLowerCase() === cleanEmail);
  
  if (existsInUsers) {
    throw new Error('Email já cadastrado');
  }

  let studentId = undefined;
  let newStudentData = null;
  let claimedPersonalId = undefined;

  if (userData.type === 'aluno') {
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
        email: userData.email,
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
    studentId,
    personalId: claimedPersonalId,
    planId: userData.type === 'personal' ? null : undefined,
    planActivatedAt: undefined,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  setItem(KEYS.USERS, users);
  setCurrentUser(user);


  if (canUseSupabase()) {
    if (userData.type !== 'aluno') {
      let supUser = { id: user.id, type: user.type, name: user.name, email: user.email, password: user.password, "studentLimit": user.studentLimit };
      safeSupabase(() => supabase.from('users').upsert(supUser));
    } else if (newStudentData) {
      safeSupabase(() => supabase.from('students').upsert(newStudentData));
    }
  }
  
  return user;
}

export async function loginUser(email, password) {
  const cleanEmail = email?.trim().toLowerCase();
  const cleanPass = password?.trim();

  // 1. Search students first (includes PT-created records with personalId)
  let students = JSON.parse(localStorage.getItem('powerfit_students') || '[]');
  let studentData = students.find(u => u.email?.trim().toLowerCase() === cleanEmail && u.password === cleanPass);

  if (studentData) {
    const studentSession = { ...studentData, personalId: studentData.personalId, type: 'aluno' };
    setCurrentUser(studentSession);
    forceSyncData().catch(() => {});
    return studentSession;
  } else {
    let users = JSON.parse(localStorage.getItem('powerfit_users') || '[]');
    let _user = users.find(u => u.email?.trim().toLowerCase() === cleanEmail && u.password === cleanPass);
    if (_user) {
      _user = setCurrentUser(_user);
      forceSyncData().catch(() => {});
      return _user;
    }
  }
  
  // 2. SUPABASE FALLBACK (If online — after scorched-earth, localStorage is empty)
  if (canUseSupabase()) {
    try {
      const userRows = await safeSupabase(() =>
        supabase.from('users').select('*').eq('email', cleanEmail).eq('password', cleanPass).limit(1)
      );
      const su = Array.isArray(userRows) ? userRows[0] : userRows;
      if (su) {
        const sessionUser = setCurrentUser(su);
        let localUsers = getUsers();
        if (!localUsers.find(u => u.id === sessionUser.id)) {
          setItem(KEYS.USERS, [...localUsers, sessionUser]);
        }
        // FIX: Sync all data from Supabase immediately
        forceSyncData().catch(() => {});
        return sessionUser;
      }

      const studentRows = await safeSupabase(() =>
        supabase.from('students').select('*').eq('email', cleanEmail).eq('password', cleanPass).limit(1)
      );
      const studentData = Array.isArray(studentRows) ? studentRows[0] : studentRows;
      if (studentData) {
        const studentSession = { ...studentData, personalId: studentData.personalId, type: 'aluno' };
        const sessionUser = setCurrentUser(studentSession);
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
  if (hydrated && JSON.stringify(hydrated) !== JSON.stringify(currentUser)) {
    setItem(KEYS.CURRENT_USER, hydrated);
  }
  return hydrated;
}

export async function logout() {
  // P0 FIX: Atomic "scorched earth" logout — wipe ALL powerfit_ keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('powerfit_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Also clear any non-prefixed app keys (workouts_*, atlas targets, backup)
  const extraKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('workouts_') || key.startsWith('powerfit_'))) {
      extraKeys.push(key);
    }
  }
  extraKeys.forEach(key => localStorage.removeItem(key));

  // Sign out from Supabase server-side (invalidates refresh token)
  try {
    await supabase.auth.signOut();
  } catch (_) {
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
    return allStudents.filter(s => s.personalId === currentUser.id || s.personalId === 'per-1');
  }
  return allStudents;
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
  return allStudents.find(s => s.email?.trim().toLowerCase() === email.trim().toLowerCase());
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
  const filteredStudents = allStudents.filter(s => 
    s.email?.trim().toLowerCase() !== studentData.email?.trim().toLowerCase()
  );
  
  let student;
  if (studentData.id && studentData.id !== '') {
    const existingIdx = allStudents.findIndex(s => s.id === studentData.id);
    if (existingIdx !== -1) {
      student = { ...allStudents[existingIdx], ...studentData, updatedAt: new Date().toISOString() };
    } else {
      student = { ...studentData, updatedAt: new Date().toISOString() };
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
      personalId: verifiedPersonalId,
      isPremium: studentData.isPremium === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Ensure valid UUID id for localStorage
  if (!student.id || student.id === '') student.id = generateId();

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

export function toggleScheduleStatus(studentId, scheduleId) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const idx = allStudents.findIndex(s => s.id === studentId);
  if (idx !== -1 && allStudents[idx].workoutSchedule) {
    const scheduleIdx = allStudents[idx].workoutSchedule.findIndex(w => w.id === scheduleId);
    if (scheduleIdx !== -1) {
      const currentStatus = allStudents[idx].workoutSchedule[scheduleIdx].status === 'completed';
      allStudents[idx].workoutSchedule[scheduleIdx].status = currentStatus ? 'pending' : 'completed';
      allStudents[idx].updatedAt = new Date().toISOString();
      
      setItem(KEYS.STUDENTS, allStudents);
      
      const currentUser = getCurrentUser();
      if (currentUser?.id === studentId) {
        setItem(KEYS.CURRENT_USER, { ...currentUser, workoutSchedule: allStudents[idx].workoutSchedule });
      }

      if (canUseSupabase()) {
        safeSupabase(() => supabase.from('students').update({
          workoutSchedule: allStudents[idx].workoutSchedule,
          updatedAt: allStudents[idx].updatedAt
        }).eq('id', studentId));
      }
      notifyDataChange('students');
    }
  }
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
    return updatedAllStudents.filter(s => s.personalId === currentUser.id || s.personalId === "per-1");
  }

  return updatedAllStudents;
}

// ========== WORKOUTS ==========
export function getWorkouts() {
  const allWorkouts = (getItem(KEYS.WORKOUTS) || []).map(workout => normalizeWorkoutRecord(workout));
  const currentUser = getCurrentUser();
  if (currentUser?.type === "master") return allWorkouts;
  if (currentUser?.type === "personal") {
    return allWorkouts.filter(w => w.personalId === currentUser.id || w.personal_id === currentUser.id);
  }
  if (currentUser?.type === "aluno") {
    const studentId = currentUser.id || currentUser.studentId || currentUser.student_id;
    // Busca prioritária via email para capturar o perfil Claim original do Supabase/Students
    const studentRecord = getStudentByEmail(currentUser.email) || getStudentById(studentId) || currentUser;
    const assignedIds = parseArrayLike(studentRecord.workoutIds || studentRecord.workout_ids);
    const assignedSchedule = parseArrayLike(studentRecord.workoutSchedule || studentRecord.workout_schedule);
    
    // Filtro rigoroso: a relação aluno-treino vive em students.workoutIds/workoutSchedule.
    return allWorkouts.filter(w => 
      assignedIds.includes(w.id) ||
      assignedSchedule.some(s => (typeof s === 'string' ? s : (s?.workoutId || s?.workout_id || s?.workout?.id)) === w.id)
    );
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
  notifyDataChange('workouts');

  return updatedWorkouts;
}

export async function assignWorkoutToStudent(workoutId, studentId, dayOfWeek = 'Segunda', isAI = false) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const idx = allStudents.findIndex(s => s.id === studentId);
  if (idx !== -1) {
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

    if (!allStudents[idx].workoutSchedule) allStudents[idx].workoutSchedule = [];
    allStudents[idx].workoutSchedule.push(scheduleEntry);
    
    if (!allStudents[idx].workoutIds) allStudents[idx].workoutIds = [];
    if (!allStudents[idx].workoutIds.includes(workoutId)) {
      allStudents[idx].workoutIds.push(workoutId);
    }

    // Supabase First
    if (canUseSupabase()) {
      await safeSupabase(() => supabase.from('weekly_schedules').upsert({
        id: scheduleEntry.id,
        student_id: studentId,
        workout_id: workoutId,
        day_of_week: normalizedDay,
        createdAt: new Date().toISOString(),
      }));

      await safeSupabase(() => supabase.from('students').update({
        workoutSchedule: allStudents[idx].workoutSchedule,
        workoutIds: allStudents[idx].workoutIds,
        updatedAt: new Date().toISOString()
      }).eq('id', studentId));
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
    if (currentUser?.id === personalId) setItem(KEYS.CURRENT_USER, users[idx]);
  }
}

// ========== EVOLUTION ==========
export function getEvolution() {
  return getItem(KEYS.EVOLUTION) || [];
}

export function getEvolutionByStudent(studentId) {
  return getEvolution()
    .filter(e => e.studentId === studentId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function saveEvolutionEntry(entry) {
  const evolution = getEvolution();
  const record = {
    id: generateId(),
    ...entry,
    createdAt: new Date().toISOString(),
  };
  evolution.push(record);
  setItem(KEYS.EVOLUTION, evolution);

  if (canUseSupabase()) {
    safeSupabase(() => supabase.from('evolution').upsert(record));
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
export function getSchedule() {
  return getItem(KEYS.SCHEDULE) || [];
}

export function getScheduleByDate(date) {
  return getSchedule().filter(s => s.date === date);
}

export async function saveScheduleEvent(event) {
  const schedule = getSchedule();
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
  record = normalizeScheduleRecord({ ...record, personalId: record.personalId || currentUser?.id || null });

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

  const schedule = getSchedule().filter(s => s.id !== id);
  setItem(KEYS.SCHEDULE, schedule);
  notifyDataChange('schedule');
  return schedule;
}

// ========== PHOTOS (Before/After) ==========
export function getPhotos() {
  return getItem(KEYS.PHOTOS) || [];
}

export function getPhotosByStudent(studentId) {
  return getPhotos()
    .filter(p => p.studentId === studentId)
    .map(photo => ({
      ...photo,
      image: photo.image || photo.url || '',
      label: photo.label || photo.type || '',
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
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
  const record = { id: generateId(), ...photoData, createdAt: new Date().toISOString() };

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
  const data = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    users: getItem(KEYS.USERS),
    students: getItem(KEYS.STUDENTS),
    workouts: getItem(KEYS.WORKOUTS),
    evolution: getItem(KEYS.EVOLUTION),
    schedule: getItem(KEYS.SCHEDULE),
    photos: getItem(KEYS.PHOTOS),
  };
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
    const data = JSON.parse(jsonString);
    if (!data.version) throw new Error('Arquivo inválido');
    if (data.users) setItem(KEYS.USERS, data.users);
    if (data.students) setItem(KEYS.STUDENTS, data.students);
    if (data.workouts) setItem(KEYS.WORKOUTS, data.workouts);
    if (data.evolution) setItem(KEYS.EVOLUTION, data.evolution);
    if (data.schedule) setItem(KEYS.SCHEDULE, data.schedule);
    if (data.photos) setItem(KEYS.PHOTOS, data.photos);
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

export function activatePremium(userId) {
  const users = JSON.parse(localStorage.getItem('powerfit_users') || '[]');
  const students = JSON.parse(localStorage.getItem('powerfit_students') || '[]');
  const all = [...users, ...students];
  const idx = all.findIndex(u => u.id === userId || u.email === userId);
  if (idx === -1) return false;
  
  all[idx].isPremium = true;
  all[idx].premiumExpiresAt = new Date(Date.now() + 30*24*60*60*1000).toISOString();
  
  const updatedUsers = all.filter(u => u.type !== 'aluno');
  const updatedStudents = all.filter(u => u.type === 'aluno');
  
  localStorage.setItem('powerfit_users', JSON.stringify(updatedUsers));
  localStorage.setItem('powerfit_students', JSON.stringify(updatedStudents));
  
  // Update currentUser if it matches — return updated user for React state
  const currentUser = JSON.parse(localStorage.getItem('powerfit_current_user') || '{}');
  if (currentUser && (currentUser.id === userId || currentUser.email === userId)) {
    const updatedUser = { ...currentUser, ...all[idx] };
    localStorage.setItem('powerfit_current_user', JSON.stringify(updatedUser));
    notifyDataChange('users');
    notifyDataChange('students');
    return updatedUser; // Caller updates React state, no reload needed
  }
  notifyDataChange('users');
  notifyDataChange('students');
  return true;
}

// ========== AI (GROQ API + SILENT FALLBACK) ==========
export const askAI = async (message = '', student = null) => {
  const FALLBACK = '💡 Dica: Foque na execução lenta para maximizar a hipertrofia.';
  try {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      if (import.meta.env.DEV) console.warn('[PowerFit] VITE_GROQ_API_KEY not set — AI disabled');
      return FALLBACK;
    }
    const name = student?.name?.split(' ')[0] || 'Atleta';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: `Você é a IA PowerFit, personal trainer virtual. Fale em PT-BR, seja direto e motivador. O atleta se chama ${name}.` },
          { role: 'user', content: message || 'Me dê uma dica de treino.' }
        ],
        temperature: 0.7,
        max_tokens: 512
      })
    });
    if (!response.ok) return FALLBACK;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || FALLBACK;
  } catch {
    return FALLBACK;
  }
};

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
      localStorage.setItem('powerfit_current_user', JSON.stringify(list[idx]));
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

