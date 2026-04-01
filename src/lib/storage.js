// PowerFit - localStorage + Supabase Offline-First Data Layer
import { supabase } from './supabaseClient';

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

function generateId() {
  // Generate a valid UUIDv4 for Supabase
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
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

const VIP_EMAILS = [
  'thestable9@gmail.com',
  'davimonteles62@gmail.com'
];

export function getPlans(type = 'personal') { 
  return type === 'aluno' ? STUDENT_PLANS : PLANS; 
}

export function isVipUser(email) {
  return VIP_EMAILS.includes(email?.trim().toLowerCase());
}

export function getUserPlan(userId) {
  const user = userId ? getUsers().find(u => u.id === userId) : getCurrentUser();
  if (!user) return null;
  
  // Student Plan Logic
  if (user.type === 'aluno') {
    const student = getStudentById(userId || user.id) || user;
    const isVip = isVipUser(user.email);
    if (isVip || student.isPremium) return { ...STUDENT_PLANS[1], isPremium: true, isVip };
    return { ...STUDENT_PLANS[0], isPremium: false, isVip };
  }

  if (isVipUser(user.email)) return { ...PLANS[3], isVip: true }; // VIP = Elite grátis
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
    
    if (navigator.onLine) {
      supabase.from('students').update({ isPremium: isPro }).eq('id', user.id).then();
    }
    return user;
  }

  // Personal upgrade logic
  user.planId = planId;
  user.planActivatedAt = new Date().toISOString();
  setItem(KEYS.CURRENT_USER, user);
  
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) { users[idx] = { ...users[idx], planId, planActivatedAt: user.planActivatedAt }; setItem(KEYS.USERS, users); }
  
  if (navigator.onLine) {
    supabase.from('users').update({ planId, planActivatedAt: user.planActivatedAt }).eq('id', user.id).then();
  }
  return user;
}

export function canAddStudent() {
  const user = getCurrentUser();
  if (!user || user.type !== 'personal') return false;
  if (isVipUser(user.email)) return true;
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
  if (!navigator.onLine) return;
  const user = getCurrentUser();
  if (!user) return;

  try {
    // Puxar entidades relacionadas
    if (user.type === 'master' || user.type === 'personal') {
      let query = supabase.from('students').select('*');
      if (user.type !== 'master') query = query.eq('personalId', user.id);
      
      const { data: students } = await query;
      if (students) setItem(KEYS.STUDENTS, students);

      const { data: workouts } = await supabase.from('workouts').select('*');
      if (workouts) setItem(KEYS.WORKOUTS, workouts);
      
      const { data: schedule } = await supabase.from('schedule').select('*');
      if (schedule) setItem(KEYS.SCHEDULE, schedule);
    } else {
      // É aluno
      const { data: me } = await supabase.from('students').select('*').eq('email', user.email).single();
      if (me) {
        // overwrite student array with just me, and set currentUser to keep logic
        setItem(KEYS.STUDENTS, [me]);
        user.workoutSchedule = me.workoutSchedule;
        user.workoutIds = me.workoutIds;
        setItem(KEYS.CURRENT_USER, user);
      }
    }
  } catch (error) {
    console.error('Supabase Sync Down Error:', error);
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
  
  if (existsInUsers || existsInStudents) {
    // Se for um aluno tentando se registrar mas já foi cadastrado pelo Personal
    if (userData.type === 'aluno' && existsInStudents && !existsInUsers) {
      // Permitir "subgraduar" de Aluno-Draft para Aluno-Real (com senha)
      // Mas por agora, vamos apenas lançar erro para simplificar
      throw new Error('E-mail já vinculado a um Personal. Use o Login.');
    }
    throw new Error('Email já cadastrado');
  }

  
  const studentId = userData.type === 'aluno' ? generateId() : undefined;
  
  const user = {
    id: generateId(),
    ...userData,
    studentId,
    planId: userData.type === 'personal' ? (isVipUser(userData.email) ? 'elite' : null) : undefined,
    planActivatedAt: userData.type === 'personal' && isVipUser(userData.email) ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  setItem(KEYS.USERS, users);
  setItem(KEYS.CURRENT_USER, user);
  
  let newStudentData = null;
  if (userData.type === 'aluno') {
    const students = getStudents();
    newStudentData = {
      id: studentId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      isPremium: false, // Default to non-premium
      workoutIds: [],
      password: userData.password,
      createdAt: new Date().toISOString()
    };
    students.push(newStudentData);
    setItem(KEYS.STUDENTS, students);
  }

  if (navigator.onLine) {
    if (userData.type !== 'aluno') {
      let supUser = { id: user.id, type: user.type, name: user.name, email: user.email, password: user.password, "studentLimit": user.studentLimit };
      supabase.from('users').upsert(supUser).then();
    } else {
      supabase.from('students').upsert(newStudentData).then();
    }
  }
  
  return user;
}

export async function loginUser(email, password) {
  const cleanEmail = email?.trim().toLowerCase();
  
  // VIP Account Overrides
  if (cleanEmail === 'thestable9@gmail.com' && password === 'kingvolkath9') {
    // This allows the specific password kingvolkath9
    // We will still check in Supabase/Local but this ensures this specific combo works
  }
  if (cleanEmail === 'davimonteles62@gmail.com' && password === 'kingvolkath') {
    // This allows the specific password kingvolkath
  }

  
  // Master backdoor
  if (cleanEmail === 'marcio@powerfit.com' && password === 'master123') {
    const masterUser = { id: 'master-1', name: 'Márcio (Master)', email: cleanEmail, type: 'master' };
    setItem(KEYS.CURRENT_USER, masterUser);
    return masterUser;
  }

  if (navigator.onLine) {
    // Tenta no Supabase
    // Check if it's a VIP override or normal login
    const isVipPersonal = cleanEmail === 'thestable9@gmail.com' && password === 'kingvolkath9';
    const isVipStudent = cleanEmail === 'davimonteles62@gmail.com' && password === 'kingvolkath';

    let queryUser = supabase.from('users').select('*').eq('email', cleanEmail);
    if (!isVipPersonal) queryUser = queryUser.eq('password', password);
    
    const { data: su } = await queryUser.single();

    if (su && (isVipPersonal || su.password === password)) {
      setItem(KEYS.CURRENT_USER, su);
      const users = getUsers();
      if(!users.find(u => u.email === cleanEmail)) setItem(KEYS.USERS, [...users, su]);
      return su;
    }

    // Se não for 'users', pode ser aluno ('students')
    let queryStudent = supabase.from('students').select('*').eq('email', cleanEmail);
    if (!isVipStudent) queryStudent = queryStudent.eq('password', password);

    const { data: se } = await queryStudent.single();

    if (se && (isVipStudent || se.password === password)) {
      const studentSession = { ...se, type: 'aluno' };
      setItem(KEYS.CURRENT_USER, studentSession);
      
      // Sync to local students list so getStudentById finds it
      const localStudents = getItem(KEYS.STUDENTS) || [];
      if (!localStudents.find(s => s.id === se.id)) {
        setItem(KEYS.STUDENTS, [...localStudents, studentSession]);
      }
      
      return studentSession;
    }

    if (!su && !se) {
      throw new Error('Email ou senha incorretos');
    }
  }


  // Final attempt: VIP Overrides (Even if not in DB yet)
  if (cleanEmail === 'thestable9@gmail.com' && password === 'kingvolkath9') {
    const vipP = { id: 'vip-p-1', name: 'Personal VIP', email: cleanEmail, type: 'personal', isVip: true };
    setItem(KEYS.CURRENT_USER, vipP);
    return vipP;
  }
  if (cleanEmail === 'davimonteles62@gmail.com' && password === 'kingvolkath') {
    const vipS = { id: 'vip-s-1', name: 'Davi VIP', email: cleanEmail, type: 'aluno', isPremium: true, isVip: true };
    setItem(KEYS.CURRENT_USER, vipS);
    
    // Sync VIP to local students
    const localStudents = getItem(KEYS.STUDENTS) || [];
    if (!localStudents.find(s => s.id === vipS.id)) {
      setItem(KEYS.STUDENTS, [...localStudents, vipS]);
    }
    
    return vipS;
  }

  throw new Error('Email ou senha incorretos');
}

export function getCurrentUser() {
  return getItem(KEYS.CURRENT_USER);
}

export function logout() {
  localStorage.removeItem(KEYS.CURRENT_USER);
}

// ========== STUDENTS ==========
export function getStudents() {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const currentUser = getCurrentUser();
  
  if (!currentUser) return [];
  if (currentUser.type === 'master') return allStudents;
  if (currentUser.type === 'personal') {
    return allStudents.filter(s => s.personalId === currentUser.id);
  }
  return allStudents;
}

export function getStudentById(id) {
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

export async function getTrainerById(id) {
  if (!id) return null;
  const users = getUsers();
  const localTrainer = users.find(u => u.id === id);
  if (localTrainer) return localTrainer;

  if (navigator.onLine) {
    const { data } = await supabase.from('users').select('*').eq('id', id).single();
    if (data) return data;
  }
  return null;
}


export function saveStudent(studentData) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const currentUser = getCurrentUser();
  
  let student;
  if (studentData.id) {
    const idx = allStudents.findIndex(s => s.id === studentData.id);
    if (idx !== -1) {
      student = { ...allStudents[idx], ...studentData, updatedAt: new Date().toISOString() };
      allStudents[idx] = student;
    } else {
      student = studentData;
    }
  } else {
    // Verificar se o aluno já existe pelo email para vinculação
    const existingIdx = allStudents.findIndex(s => s.email?.trim().toLowerCase() === studentData.email?.trim().toLowerCase());
    
    if (existingIdx !== -1) {
      // Vincula o aluno existente ao Personal atual
      student = { 
        ...allStudents[existingIdx], 
        ...studentData, 
        personalId: currentUser?.id, 
        updatedAt: new Date().toISOString() 
      };
      allStudents[existingIdx] = student;
    } else {
      // Verificar limite do plano antes de adicionar novo aluno
      if (currentUser?.type === 'personal' && !isVipUser(currentUser.email)) {
        const plan = getUserPlan();
        if (!plan) throw new Error('Você precisa escolher um plano antes de adicionar alunos.');
        const myStudents = allStudents.filter(s => s.personalId === currentUser.id);
        if (myStudents.length >= plan.studentLimit) {
          throw new Error(`Limite de ${plan.studentLimit} alunos atingido no plano ${plan.name}. Faça upgrade para continuar.`);
        }
      }
      student = {
        id: generateId(),
        ...studentData,
        personalId: currentUser?.id,
        isPremium: isVipUser(studentData.email), // Alunos VIP já nascem Premium
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      allStudents.push(student);
    }
  }

  setItem(KEYS.STUDENTS, allStudents);

  // Background Sync
  if (navigator.onLine) {
    supabase.from('students').upsert(student).then(({error}) => {
      if (error) console.error('Supabase Sync error [students]:', error);
    });
  }

  return allStudents;
}

export function deleteStudent(id) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const updatedStudents = allStudents.filter(s => s.id !== id);
  setItem(KEYS.STUDENTS, updatedStudents);
  
  const evolution = getEvolution().filter(e => e.studentId !== id);
  setItem(KEYS.EVOLUTION, evolution);
  const photos = getPhotos().filter(p => p.studentId !== id);
  setItem(KEYS.PHOTOS, photos);
  const schedule = getSchedule().filter(s => s.studentId !== id);
  setItem(KEYS.SCHEDULE, schedule);

  // Background Sync
  if (navigator.onLine) {
    supabase.from('students').delete().eq('id', id).then();
    // A deleção em cascata (ON DELETE CASCADE) no Supabase cuidará da evolution e photos
  }

  return updatedStudents;
}

// ========== WORKOUTS ==========
export function getWorkouts() {
  const allWorkouts = getItem(KEYS.WORKOUTS) || [];
  const currentUser = getCurrentUser();
  if (currentUser?.type === 'master') return allWorkouts;
  if (currentUser?.type === 'personal') {
    return allWorkouts.filter(w => w.personalId === currentUser.id);
  }
  return allWorkouts;
}

export function getWorkoutById(id) {
  const allWorkouts = getItem(KEYS.WORKOUTS) || [];
  return allWorkouts.find(w => w.id === id);
}

export function saveWorkout(workoutData) {
  const allWorkouts = getItem(KEYS.WORKOUTS) || [];
  const currentUser = getCurrentUser();
  
  let workout;
  if (workoutData.id) {
    const idx = allWorkouts.findIndex(w => w.id === workoutData.id);
    if (idx !== -1) {
      workout = { ...allWorkouts[idx], ...workoutData, updatedAt: new Date().toISOString() };
      allWorkouts[idx] = workout;
    } else {
      workout = workoutData;
    }
  } else {
    workout = {
      id: generateId(),
      ...workoutData,
      personalId: currentUser?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allWorkouts.push(workout);
  }
  setItem(KEYS.WORKOUTS, allWorkouts);

  if (navigator.onLine) {
    supabase.from('workouts').upsert(workout).then(({error}) => {
      if(error) console.error('Supabase Sync error [workouts]:', error);
    });
  }
  return allWorkouts;
}

export function deleteWorkout(id) {
  const allWorkouts = getItem(KEYS.WORKOUTS) || [];
  const updatedWorkouts = allWorkouts.filter(w => w.id !== id);
  setItem(KEYS.WORKOUTS, updatedWorkouts);

  if (navigator.onLine) {
    supabase.from('workouts').delete().eq('id', id).then();
  }
  return updatedWorkouts;
}

export function assignWorkoutToStudent(workoutId, studentId, dayOfWeek = 'Segunda', isAI = false) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const idx = allStudents.findIndex(s => s.id === studentId);
  if (idx !== -1) {
    if (!allStudents[idx].workoutSchedule) allStudents[idx].workoutSchedule = [];
    allStudents[idx].workoutSchedule.push({ workoutId, day: dayOfWeek, id: generateId(), isAI });
    
    if (!allStudents[idx].workoutIds) allStudents[idx].workoutIds = [];
    if (!allStudents[idx].workoutIds.includes(workoutId)) {
      allStudents[idx].workoutIds.push(workoutId);
    }
    setItem(KEYS.STUDENTS, allStudents);

    if (navigator.onLine) {
      supabase.from('students').update({
        workoutSchedule: allStudents[idx].workoutSchedule,
        workoutIds: allStudents[idx].workoutIds,
        updatedAt: new Date().toISOString()
      }).eq('id', studentId).then();
    }
  }
}

export function unassignWorkoutFromSchedule(studentId, scheduleId) {
  const allStudents = getItem(KEYS.STUDENTS) || [];
  const idx = allStudents.findIndex(s => s.id === studentId);
  if (idx !== -1 && allStudents[idx].workoutSchedule) {
    allStudents[idx].workoutSchedule = allStudents[idx].workoutSchedule.filter(w => w.id !== scheduleId);
    setItem(KEYS.STUDENTS, allStudents);

    if (navigator.onLine) {
      supabase.from('students').update({
        workoutSchedule: allStudents[idx].workoutSchedule,
        updatedAt: new Date().toISOString()
      }).eq('id', studentId).then();
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

  if (navigator.onLine) {
    supabase.from('evolution').upsert(record).then();
  }
  return evolution;
}

export function deleteEvolutionEntry(id) {
  const evolution = getEvolution().filter(e => e.id !== id);
  setItem(KEYS.EVOLUTION, evolution);

  if (navigator.onLine) {
    supabase.from('evolution').delete().eq('id', id).then();
  }
  return evolution;
}

// ========== SCHEDULE ==========
export function getSchedule() {
  return getItem(KEYS.SCHEDULE) || [];
}

export function getScheduleByDate(date) {
  return getSchedule().filter(s => s.date === date);
}

export function saveScheduleEvent(event) {
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
  setItem(KEYS.SCHEDULE, schedule);

  if (navigator.onLine) {
    supabase.from('schedule').upsert(record).then();
  }
  return schedule;
}

export function deleteScheduleEvent(id) {
  const schedule = getSchedule().filter(s => s.id !== id);
  setItem(KEYS.SCHEDULE, schedule);

  if (navigator.onLine) {
    supabase.from('schedule').delete().eq('id', id).then();
  }
  return schedule;
}

// ========== PHOTOS (Before/After) ==========
export function getPhotos() {
  return getItem(KEYS.PHOTOS) || [];
}

export function getPhotosByStudent(studentId) {
  return getPhotos()
    .filter(p => p.studentId === studentId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function savePhoto(photoData) {
  const photos = getPhotos();
  const record = { id: generateId(), ...photoData, createdAt: new Date().toISOString() };
  photos.push(record);
  setItem(KEYS.PHOTOS, photos);

  if (navigator.onLine) {
    supabase.from('photos').upsert(record).then();
  }
  return photos;
}

export function deletePhoto(id) {
  const photos = getPhotos().filter(p => p.id !== id);
  setItem(KEYS.PHOTOS, photos);

  if (navigator.onLine) {
    supabase.from('photos').delete().eq('id', id).then();
  }
  return photos;
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
  if (!weight || !heightCm) return null;
  const heightM = heightCm / 100;
  const imc = weight / (heightM * heightM);
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
  if (!weight || !heightCm || !age) return null;
  // Mifflin-St Jeor equation
  if (gender === 'Masculino') {
    return Math.round(10 * weight + 6.25 * heightCm - 5 * age + 5);
  }
  return Math.round(10 * weight + 6.25 * heightCm - 5 * age - 161);
}

export function calculateCalories(tmb, daysPerWeek) {
  if (!tmb) return null;
  let factor = 1.2; // sedentary
  if (daysPerWeek >= 1 && daysPerWeek <= 2) factor = 1.375;
  else if (daysPerWeek >= 3 && daysPerWeek <= 4) factor = 1.55;
  else if (daysPerWeek >= 5 && daysPerWeek <= 6) factor = 1.725;
  else if (daysPerWeek >= 7) factor = 1.9;
  return {
    maintenance: Math.round(tmb * factor),
    loss: Math.round(tmb * factor * 0.8),
    gain: Math.round(tmb * factor * 1.15),
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
  if (getItem(KEYS.INITIALIZED)) return;
  setItem(KEYS.INITIALIZED, true);
}
