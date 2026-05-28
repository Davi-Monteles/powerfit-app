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
  `${storageSource}\nreturn { activateStudentProDemo, isStudentPremium, resolveStudentProfileFromCache };`
);

const {
  activateStudentProDemo,
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
  value => {
    if (!value || typeof value !== 'object') return value;
    const clone = structuredClone(value);
    delete clone.password;
    delete clone.senha;
    return clone;
  }
);

const studentUser = {
  id: 'user-row-1',
  studentId: 'student-row-1',
  email: 'aluno.pro@example.com',
  name: 'Aluno Pro',
  type: 'aluno',
};

localStorage.setItem('powerfit_current_user', JSON.stringify(studentUser));
localStorage.setItem('powerfit_users', JSON.stringify([studentUser]));
localStorage.setItem('powerfit_students', JSON.stringify([
  {
    id: 'student-row-1',
    studentId: 'student-row-1',
    email: 'aluno.pro@example.com',
    name: 'Aluno Pro',
    type: 'aluno',
    isPremium: false,
    personalId: 'personal-1',
  },
]));

const upgraded = activateStudentProDemo(studentUser);
const persistedCurrentUser = JSON.parse(localStorage.getItem('powerfit_current_user'));
const persistedUsers = JSON.parse(localStorage.getItem('powerfit_users'));
const persistedStudents = JSON.parse(localStorage.getItem('powerfit_students'));
const reloadedStudent = resolveStudentProfileFromCache(persistedCurrentUser);

assert.equal(upgraded.isPremium, true);
assert.equal(persistedCurrentUser.isPremium, true);
assert.equal(persistedCurrentUser.type, 'aluno');
assert.equal(persistedUsers.find(user => user.email === studentUser.email).isPremium, true);
assert.equal(persistedStudents.find(student => student.email === studentUser.email).isPremium, true);
assert.equal(isStudentPremium(reloadedStudent), true);
