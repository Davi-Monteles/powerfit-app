const PREVIEW_NOTICE = 'Ambiente demo/preview - nao use dados reais.';
const PREVIEW_DEMO_DATE = '2026-06-16T12:00:00.000Z';

const PREVIEW_DEMO_IDS = {
  personal: '11111111-1111-4111-8111-111111111111',
  student: '22222222-2222-4222-8222-222222222222',
  workout: '33333333-3333-4333-8333-333333333333',
  schedule: '44444444-4444-4444-8444-444444444444',
};

const PREVIEW_DEMO_PERSONAL = {
  id: PREVIEW_DEMO_IDS.personal,
  name: 'Marcio Demo',
  email: 'trainer.demo@powerfit.test',
  type: 'personal',
  password: 'demo123',
  planId: 'starter',
  studentLimit: 10,
  planActivatedAt: PREVIEW_DEMO_DATE,
  createdAt: PREVIEW_DEMO_DATE,
};

const PREVIEW_DEMO_STUDENT = {
  id: PREVIEW_DEMO_IDS.student,
  studentId: PREVIEW_DEMO_IDS.student,
  student_id: PREVIEW_DEMO_IDS.student,
  name: 'Aluno Demo',
  email: 'student.demo@powerfit.test',
  phone: '11900000000',
  gender: 'Masculino',
  birthDate: '1995-04-12',
  height: 178,
  weight: 79.8,
  objective: 'Hipertrofia',
  daysPerWeek: 4,
  shift: 'Manha',
  address: 'Endereco demo ficticio',
  medicalNotes: 'Dados ficticios para demonstracao comercial. Sem restricoes reais.',
  personalId: PREVIEW_DEMO_IDS.personal,
  personal_id: PREVIEW_DEMO_IDS.personal,
  type: 'aluno',
  password: 'demo123',
  isPremium: true,
  premiumExpiresAt: '2026-12-31T23:59:59.000Z',
  workoutIds: [PREVIEW_DEMO_IDS.workout],
  workout_ids: [PREVIEW_DEMO_IDS.workout],
  workoutSchedule: [{
    id: PREVIEW_DEMO_IDS.schedule,
    workoutId: PREVIEW_DEMO_IDS.workout,
    workout_id: PREVIEW_DEMO_IDS.workout,
    day: 'Terca',
    dayOfWeek: 'Terca',
    day_of_week: 'Terca',
    isAI: false,
    status: 'pending',
    completed: false,
    completedAt: null,
    archivedAt: null,
  }],
  createdAt: PREVIEW_DEMO_DATE,
  updatedAt: PREVIEW_DEMO_DATE,
};

const PREVIEW_DEMO_WORKOUT = {
  id: PREVIEW_DEMO_IDS.workout,
  name: 'Treino A - Forca e Hipertrofia',
  description: 'Sessao de membros superiores com foco em progressao de carga e tecnica.',
  category: 'Musculacao',
  day: 'Terca',
  dayOfWeek: 'Terca',
  day_of_week: 'Terca',
  exercises: [
    { name: 'Supino reto', sets: 4, reps: 8, weight: 60, rest: 90, notes: 'Priorizar amplitude e controle da descida.' },
    { name: 'Remada curvada', sets: 4, reps: 10, weight: 50, rest: 90, notes: 'Manter coluna neutra e cotovelos proximos ao corpo.' },
    { name: 'Desenvolvimento', sets: 3, reps: 10, weight: 24, rest: 75, notes: 'Executar sem compensar lombar.' },
    { name: 'Puxada alta', sets: 3, reps: 12, weight: 45, rest: 60, notes: 'Puxar ate a linha do peito.' },
    { name: 'Rosca direta', sets: 3, reps: 12, weight: 20, rest: 60, notes: 'Evitar balanco do tronco.' },
  ],
  personalId: PREVIEW_DEMO_IDS.personal,
  personal_id: PREVIEW_DEMO_IDS.personal,
  assignedTo: PREVIEW_DEMO_IDS.student,
  assigned_to: PREVIEW_DEMO_IDS.student,
  studentId: PREVIEW_DEMO_IDS.student,
  student_id: PREVIEW_DEMO_IDS.student,
  studentEmail: 'student.demo@powerfit.test',
  student_email: 'student.demo@powerfit.test',
  isAI: false,
  aiGenerated: false,
  source: 'preview_demo_seed',
  createdAt: PREVIEW_DEMO_DATE,
  updatedAt: PREVIEW_DEMO_DATE,
};

const PREVIEW_DEMO_SCHEDULE = [{
  id: '55555555-5555-4555-8555-555555555551',
  title: 'Treino A - Aluno Demo',
  tittle: 'Treino A - Aluno Demo',
  studentId: PREVIEW_DEMO_IDS.student,
  student_id: PREVIEW_DEMO_IDS.student,
  studentEmail: 'student.demo@powerfit.test',
  student_email: 'student.demo@powerfit.test',
  personalId: PREVIEW_DEMO_IDS.personal,
  personal_id: PREVIEW_DEMO_IDS.personal,
  date: '2026-06-16',
  time: '08:00',
  type: 'treino',
  notes: 'Foco em tecnica e progressao de carga.',
  createdAt: PREVIEW_DEMO_DATE,
}];

const PREVIEW_DEMO_EVOLUTION = [{
  id: '66666666-6666-4666-8666-666666666661',
  studentId: PREVIEW_DEMO_IDS.student,
  student_id: PREVIEW_DEMO_IDS.student,
  studentEmail: 'student.demo@powerfit.test',
  student_email: 'student.demo@powerfit.test',
  personalId: PREVIEW_DEMO_IDS.personal,
  personal_id: PREVIEW_DEMO_IDS.personal,
  date: '2026-05-02',
  weight: 82,
  bodyFat: 22,
  chest: 100,
  waist: 92,
  hip: 101,
  arm: 34,
  thigh: 57,
  createdAt: '2026-05-02T09:00:00.000Z',
}, {
  id: '66666666-6666-4666-8666-666666666662',
  studentId: PREVIEW_DEMO_IDS.student,
  student_id: PREVIEW_DEMO_IDS.student,
  studentEmail: 'student.demo@powerfit.test',
  student_email: 'student.demo@powerfit.test',
  personalId: PREVIEW_DEMO_IDS.personal,
  personal_id: PREVIEW_DEMO_IDS.personal,
  date: '2026-05-30',
  weight: 79.8,
  bodyFat: 19.8,
  chest: 102,
  waist: 88,
  hip: 100,
  arm: 35.5,
  thigh: 58,
  createdAt: '2026-05-30T09:20:00.000Z',
}];

const PREVIEW_DEMO_INTAKE = {
  goal: 'Hipertrofia',
  experienceLevel: 'Intermediario',
  daysPerWeek: '4',
  sessionDuration: '45 minutos',
  equipment: ['Halteres', 'Banco', 'Barra', 'Maquinas'],
  muscleFocus: ['Peito', 'Costas', 'Ombros'],
  trainingHistory: 'Treina ha 1 ano com pausas curtas e busca melhorar consistencia.',
  limitations: '',
  notes: 'Prefere treinos objetivos pela manha e acompanhamento de progressao de carga.',
  chestPainDuringEffort: false,
  dizzinessOrFainting: false,
  heartOrBloodPressureIssue: false,
  recentSurgeryOrInjury: false,
  medicalRestriction: false,
  updatedAt: PREVIEW_DEMO_DATE,
  completed: true,
};

function hasStoredRecords(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(value) && value.length > 0;
  } catch {
    return true;
  }
}

export function getPreviewDemoNotice(hostname = globalThis.location?.hostname || '') {
  const normalizedHost = String(hostname).toLowerCase();
  return normalizedHost.endsWith('.vercel.app') ? PREVIEW_NOTICE : '';
}

export function ensurePreviewDemoSeed(hostname = globalThis.location?.hostname || '', storage = globalThis.localStorage) {
  if (!getPreviewDemoNotice(hostname)) return { seeded: false, reason: 'not-preview' };
  if (!storage) return { seeded: false, reason: 'storage-unavailable' };

  const hasEssentialData =
    hasStoredRecords(storage, 'powerfit_users') ||
    hasStoredRecords(storage, 'powerfit_students') ||
    hasStoredRecords(storage, 'powerfit_workouts');

  if (hasEssentialData) return { seeded: false, reason: 'existing-data' };

  storage.setItem('powerfit_users', JSON.stringify([PREVIEW_DEMO_PERSONAL, { ...PREVIEW_DEMO_STUDENT }]));
  storage.setItem('powerfit_students', JSON.stringify([{ ...PREVIEW_DEMO_STUDENT, workout_schedule: PREVIEW_DEMO_STUDENT.workoutSchedule }]));
  storage.setItem('powerfit_workouts', JSON.stringify([PREVIEW_DEMO_WORKOUT]));
  storage.setItem('powerfit_schedule', JSON.stringify(PREVIEW_DEMO_SCHEDULE));
  storage.setItem('powerfit_evolution', JSON.stringify(PREVIEW_DEMO_EVOLUTION));
  storage.setItem(`powerfit_student_intake_${PREVIEW_DEMO_IDS.student}`, JSON.stringify(PREVIEW_DEMO_INTAKE));

  return { seeded: true, reason: 'preview-demo-seeded' };
}
