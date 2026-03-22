// PowerFit - localStorage Data Layer

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
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ========== AUTH ==========
export function getUsers() {
  return getItem(KEYS.USERS) || [];
}

export function registerUser(userData) {
  const users = getUsers();
  const exists = users.find(u => u.email === userData.email);
  if (exists) throw new Error('Email já cadastrado');
  
  const studentId = userData.type === 'aluno' ? generateId() : undefined;
  
  const user = {
    id: generateId(),
    ...userData,
    studentId,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  setItem(KEYS.USERS, users);
  setItem(KEYS.CURRENT_USER, user);
  
  if (userData.type === 'aluno') {
    const students = getStudents();
    students.push({
      id: studentId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      isPremium: false, // Default to non-premium
      workoutIds: [],
      createdAt: new Date().toISOString()
    });
    setItem(KEYS.STUDENTS, students);
  }
  
  return user;
}

export function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Email ou senha incorretos');
  setItem(KEYS.CURRENT_USER, user);
  return user;
}

export function getCurrentUser() {
  return getItem(KEYS.CURRENT_USER);
}

export function logout() {
  localStorage.removeItem(KEYS.CURRENT_USER);
}

// ========== STUDENTS ==========
export function getStudents() {
  return getItem(KEYS.STUDENTS) || [];
}

export function getStudentById(id) {
  return getStudents().find(s => s.id === id);
}

export function saveStudent(studentData) {
  const students = getStudents();
  if (studentData.id) {
    const idx = students.findIndex(s => s.id === studentData.id);
    if (idx !== -1) {
      students[idx] = { ...students[idx], ...studentData, updatedAt: new Date().toISOString() };
    }
  } else {
    const student = {
      id: generateId(),
      ...studentData,
      createdAt: new Date().toISOString(),
    };
    students.push(student);
  }
  setItem(KEYS.STUDENTS, students);
  return students;
}

export function deleteStudent(id) {
  const students = getStudents().filter(s => s.id !== id);
  setItem(KEYS.STUDENTS, students);
  const evolution = getEvolution().filter(e => e.studentId !== id);
  setItem(KEYS.EVOLUTION, evolution);
  const photos = getPhotos().filter(p => p.studentId !== id);
  setItem(KEYS.PHOTOS, photos);
  const schedule = getSchedule().filter(s => s.studentId !== id);
  setItem(KEYS.SCHEDULE, schedule);
  return students;
}

// ========== WORKOUTS ==========
export function getWorkouts() {
  return getItem(KEYS.WORKOUTS) || [];
}

export function getWorkoutById(id) {
  return getWorkouts().find(w => w.id === id);
}

export function saveWorkout(workoutData) {
  const workouts = getWorkouts();
  if (workoutData.id) {
    const idx = workouts.findIndex(w => w.id === workoutData.id);
    if (idx !== -1) {
      workouts[idx] = { ...workouts[idx], ...workoutData, updatedAt: new Date().toISOString() };
    }
  } else {
    const workout = {
      id: generateId(),
      ...workoutData,
      createdAt: new Date().toISOString(),
    };
    workouts.push(workout);
  }
  setItem(KEYS.WORKOUTS, workouts);
  return workouts;
}

export function deleteWorkout(id) {
  const workouts = getWorkouts().filter(w => w.id !== id);
  setItem(KEYS.WORKOUTS, workouts);
  return workouts;
}

export function assignWorkoutToStudent(workoutId, studentId, dayOfWeek = 'Segunda') {
  const students = getStudents();
  const idx = students.findIndex(s => s.id === studentId);
  if (idx !== -1) {
    if (!students[idx].workoutSchedule) students[idx].workoutSchedule = [];
    students[idx].workoutSchedule.push({ workoutId, day: dayOfWeek, id: generateId() });
    
    // Legacy mapping support
    if (!students[idx].workoutIds) students[idx].workoutIds = [];
    if (!students[idx].workoutIds.includes(workoutId)) {
      students[idx].workoutIds.push(workoutId);
    }
    setItem(KEYS.STUDENTS, students);
  }
}

export function unassignWorkoutFromSchedule(studentId, scheduleId) {
  const students = getStudents();
  const idx = students.findIndex(s => s.id === studentId);
  if (idx !== -1 && students[idx].workoutSchedule) {
    students[idx].workoutSchedule = students[idx].workoutSchedule.filter(w => w.id !== scheduleId);
    setItem(KEYS.STUDENTS, students);
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
  return evolution;
}

export function deleteEvolutionEntry(id) {
  const evolution = getEvolution().filter(e => e.id !== id);
  setItem(KEYS.EVOLUTION, evolution);
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
  if (event.id) {
    const idx = schedule.findIndex(s => s.id === event.id);
    if (idx !== -1) {
      schedule[idx] = { ...schedule[idx], ...event };
    }
  } else {
    schedule.push({ id: generateId(), ...event, createdAt: new Date().toISOString() });
  }
  setItem(KEYS.SCHEDULE, schedule);
  return schedule;
}

export function deleteScheduleEvent(id) {
  const schedule = getSchedule().filter(s => s.id !== id);
  setItem(KEYS.SCHEDULE, schedule);
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
  photos.push({ id: generateId(), ...photoData, createdAt: new Date().toISOString() });
  setItem(KEYS.PHOTOS, photos);
  return photos;
}

export function deletePhoto(id) {
  const photos = getPhotos().filter(p => p.id !== id);
  setItem(KEYS.PHOTOS, photos);
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
  
  const trainer = {
    id: 'trainer1', name: 'Márcio Silva', email: 'marcio@powerfit.com',
    password: '123456', phone: '11999999999', type: 'personal',
    createdAt: new Date().toISOString(),
  };
  
  // Demo student user for student dashboard
  const studentUser = {
    id: 'studentuser1', name: 'Ana Beatriz', email: 'ana@powerfit.com',
    password: '123456', phone: '11988887777', type: 'aluno', studentId: 'student1',
    createdAt: new Date().toISOString(),
  };
  
  const students = [
    { id: 'student1', name: 'Ana Beatriz', email: 'ana@powerfit.com', phone: '11988887777',
      birthDate: '1995-05-15', gender: 'Feminino', height: 165, weight: 62,
      objective: 'Emagrecimento', daysPerWeek: 4, shift: 'Manhã',
      workoutIds: ['workout1'], createdAt: '2025-01-15T10:00:00Z' },
    { id: 'student2', name: 'Carlos Eduardo', email: 'carlos@email.com', phone: '11977776666',
      birthDate: '1990-08-20', gender: 'Masculino', height: 180, weight: 85,
      objective: 'Hipertrofia', daysPerWeek: 5, shift: 'Noite',
      workoutIds: ['workout2'], createdAt: '2025-02-01T10:00:00Z' },
    { id: 'student3', name: 'Maria Fernanda', email: 'maria@email.com', phone: '11966665555',
      birthDate: '1998-12-03', gender: 'Feminino', height: 158, weight: 55,
      objective: 'Condicionamento', daysPerWeek: 3, shift: 'Tarde',
      workoutIds: [], createdAt: '2025-03-01T10:00:00Z' },
  ];
  
  const workouts = [
    { id: 'workout1', name: 'Treino A - Superior', description: 'Foco em peito, ombro e tríceps',
      category: 'Musculação', exercises: [
        { name: 'Supino Reto', sets: 4, reps: 12, weight: 30, rest: 60, notes: 'Controlar descida' },
        { name: 'Desenvolvimento Halteres', sets: 3, reps: 12, weight: 10, rest: 60, notes: '' },
        { name: 'Crucifixo Máquina', sets: 3, reps: 15, weight: 20, rest: 45, notes: '' },
        { name: 'Elevação Lateral', sets: 4, reps: 15, weight: 6, rest: 45, notes: 'Sem balançar' },
        { name: 'Tríceps Pulley', sets: 3, reps: 15, weight: 25, rest: 45, notes: '' },
      ], createdAt: '2025-01-20T10:00:00Z' },
    { id: 'workout2', name: 'Treino B - Inferior', description: 'Foco em quadríceps, posterior e glúteo',
      category: 'Musculação', exercises: [
        { name: 'Agachamento Livre', sets: 4, reps: 10, weight: 60, rest: 90, notes: 'Descer até 90°' },
        { name: 'Leg Press 45°', sets: 4, reps: 12, weight: 120, rest: 90, notes: '' },
        { name: 'Cadeira Extensora', sets: 3, reps: 15, weight: 40, rest: 60, notes: '' },
        { name: 'Mesa Flexora', sets: 3, reps: 12, weight: 35, rest: 60, notes: '' },
        { name: 'Panturrilha Sentado', sets: 4, reps: 20, weight: 30, rest: 45, notes: '' },
      ], createdAt: '2025-02-05T10:00:00Z' },
  ];
  
  const evolution = [
    { id: 'evo1', studentId: 'student1', date: '2025-01-15', weight: 65, bodyFat: 28, chest: 88, waist: 72, hip: 98, arm: 27, thigh: 56 },
    { id: 'evo2', studentId: 'student1', date: '2025-02-15', weight: 63.5, bodyFat: 26.5, chest: 87, waist: 70, hip: 97, arm: 27.5, thigh: 55 },
    { id: 'evo3', studentId: 'student1', date: '2025-03-15', weight: 62, bodyFat: 25, chest: 86, waist: 68, hip: 96, arm: 28, thigh: 54 },
    { id: 'evo4', studentId: 'student2', date: '2025-02-01', weight: 82, bodyFat: 18, chest: 100, waist: 84, hip: 98, arm: 35, thigh: 60 },
    { id: 'evo5', studentId: 'student2', date: '2025-03-01', weight: 84, bodyFat: 17, chest: 102, waist: 83, hip: 99, arm: 36, thigh: 61 },
    { id: 'evo6', studentId: 'student2', date: '2025-03-21', weight: 85, bodyFat: 16.5, chest: 103, waist: 83, hip: 99, arm: 37, thigh: 62 },
  ];
  
  const schedule = [
    { id: 'sch1', studentId: 'student1', date: '2025-03-21', time: '08:00', title: 'Treino A - Ana', type: 'treino', notes: '' },
    { id: 'sch2', studentId: 'student2', date: '2025-03-21', time: '19:00', title: 'Treino B - Carlos', type: 'treino', notes: '' },
    { id: 'sch3', studentId: 'student1', date: '2025-03-22', time: '08:00', title: 'Avaliação - Ana', type: 'avaliacao', notes: 'Reavaliar medidas' },
    { id: 'sch4', studentId: 'student3', date: '2025-03-24', time: '14:00', title: 'Treino - Maria', type: 'treino', notes: '' },
  ];
  
  setItem(KEYS.USERS, [trainer, studentUser]);
  setItem(KEYS.STUDENTS, students);
  setItem(KEYS.WORKOUTS, workouts);
  setItem(KEYS.EVOLUTION, evolution);
  setItem(KEYS.SCHEDULE, schedule);
  setItem(KEYS.INITIALIZED, true);
}
