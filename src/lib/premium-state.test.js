import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const storage = new Map();

globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
  key(index) {
    return [...storage.keys()][index] ?? null;
  },
  get length() {
    return storage.size;
  },
};

Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: false },
  configurable: true,
});

const storageSource = readFileSync(new URL('./storage.js', import.meta.url), 'utf8')
  .replace("import { isSupabaseConfigured, supabase } from './supabaseClient';", '')
  .replace("import { notifyDataChange } from './useStorageSync';", '')
  .replace("import { PERSONAL_PLANS, STUDENT_PLANS } from './plans';", '')
  .replace("import { sanitizeExportData, sanitizeImportData, stripSensitiveSessionFields } from './security';", '')
  .replaceAll('import.meta.env.DEV', 'false')
  .replaceAll('export ', '');

const loadStorage = new AsyncFunction(
  'isSupabaseConfigured',
  'supabase',
  'notifyDataChange',
  'PERSONAL_PLANS',
  'STUDENT_PLANS',
  'sanitizeExportData',
  'sanitizeImportData',
  'stripSensitiveSessionFields',
  `${storageSource}
return {
  getCurrentUser,
  hydrateSessionUser,
  isStudentPremium,
  resolveStudentProfileFromCache,
};`
);

const stripSensitiveSessionFields = (value) => {
  if (!value || typeof value !== 'object') return value;
  const clone = structuredClone(value);
  delete clone.password;
  delete clone.senha;
  return clone;
};

const {
  getCurrentUser,
  hydrateSessionUser,
  isStudentPremium,
  resolveStudentProfileFromCache,
} = await loadStorage(
  false,
  {},
  () => {},
  [{ id: 'starter', name: 'Starter', studentLimit: 10 }],
  [{ id: 'student-free', name: 'Aluno Free' }, { id: 'student-pro', name: 'Aluno Pro' }],
  value => value,
  value => value,
  stripSensitiveSessionFields
);

const personalId = '10000000-1000-4000-8000-000000000001';
const studentId = '10000000-1000-4000-8000-000000000002';
const studentEmail = 'aluno.pro.demo@example.com';
const studentUser = {
  id: studentId,
  studentId,
  student_id: studentId,
  email: studentEmail,
  name: 'Aluno Pro Demo',
  type: 'aluno',
  isPremium: true,
  personalId,
  personal_id: personalId,
};

localStorage.setItem('powerfit_current_user', JSON.stringify(studentUser));
localStorage.setItem('powerfit_users', JSON.stringify([studentUser]));
localStorage.setItem('powerfit_students', JSON.stringify([
  {
    id: studentId,
    studentId,
    student_id: studentId,
    email: studentEmail,
    name: 'Aluno Pro Demo',
    type: 'aluno',
    isPremium: true,
    personalId,
    personal_id: personalId,
    workoutIds: ['workout-1'],
  },
]));

const persistedCurrentUser = JSON.parse(localStorage.getItem('powerfit_current_user'));
const persistedUsers = JSON.parse(localStorage.getItem('powerfit_users'));
const persistedStudents = JSON.parse(localStorage.getItem('powerfit_students'));
const hydratedAfterReload = hydrateSessionUser(persistedCurrentUser);
const currentAfterReload = getCurrentUser();
const resolvedAfterReload = resolveStudentProfileFromCache(persistedCurrentUser);

assert.equal(persistedCurrentUser.isPremium, true);
assert.equal(persistedUsers.find(user => user.email === studentEmail).isPremium, true);
assert.equal(persistedStudents.find(student => student.email === studentEmail).isPremium, true);
assert.equal(isStudentPremium(hydratedAfterReload), true);
assert.equal(isStudentPremium(currentAfterReload), true);
assert.equal(isStudentPremium(resolvedAfterReload), true);
assert.equal(resolvedAfterReload.personalId, personalId);
assert.equal(resolvedAfterReload.personal_id, personalId);
assert.deepEqual(resolvedAfterReload.workoutIds, ['workout-1']);

const upgradeSource = readFileSync(new URL('../pages/Upgrade.jsx', import.meta.url), 'utf8');
const premiumLobbySource = readFileSync(new URL('../pages/PremiumLobby.jsx', import.meta.url), 'utf8');
const myPlanSource = readFileSync(new URL('../pages/MyPlan.jsx', import.meta.url), 'utf8');
const pricingPlansSource = readFileSync(new URL('../pages/PricingPlans.jsx', import.meta.url), 'utf8');

assert.match(upgradeSource, /Indisponível no piloto/);
assert.match(upgradeSource, /Nenhuma cobrança será realizada/);
assert.doesNotMatch(upgradeSource, /<span>Assinar Agora<\/span>/);
assert.match(premiumLobbySource, /Indisponível no piloto/);
assert.match(premiumLobbySource, /Nenhuma cobrança será realizada/);
assert.match(myPlanSource, /Acesso PRO do aluno ativo para este piloto/);
assert.match(pricingPlansSource, /Plano PRO ainda indisponível neste piloto/);
assert.match(pricingPlansSource, /Nenhuma cobrança será realizada/);
