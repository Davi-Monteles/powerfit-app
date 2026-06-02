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
return { logout };`
);

const supabase = {
  auth: {
    signOutCalled: false,
    async signOut() {
      this.signOutCalled = true;
    },
  },
};

const { logout } = await loadStorage(
  false,
  supabase,
  () => {},
  [{ id: 'starter', name: 'Starter', studentLimit: 10 }],
  [{ id: 'student-free', name: 'Aluno Free' }, { id: 'student-pro', name: 'Aluno Pro' }],
  value => value,
  value => value,
  value => value
);

localStorage.setItem('powerfit_current_user', JSON.stringify({ email: 'marcio.demo@powerfit.local' }));
localStorage.setItem('powerfit_users', JSON.stringify([{ email: 'marcio.demo@powerfit.local' }]));
localStorage.setItem('powerfit_students', JSON.stringify([{ email: 'aluno.pro@powerfit.local' }]));
localStorage.setItem('powerfit_workouts', JSON.stringify([{ name: 'Treino A' }]));
localStorage.setItem('powerfit_schedule', JSON.stringify([{ title: 'Treino A' }]));
localStorage.setItem('powerfit_evolution', JSON.stringify([{ weight: 79.8 }]));
localStorage.setItem('powerfit_photos', JSON.stringify([{ label: 'Foto demo' }]));
localStorage.setItem('workouts_22222222-2222-4222-8222-222222222222', JSON.stringify([{ name: 'Treino A' }]));

await logout();

assert.equal(localStorage.getItem('powerfit_current_user'), null);
assert.notEqual(localStorage.getItem('powerfit_users'), null);
assert.notEqual(localStorage.getItem('powerfit_students'), null);
assert.notEqual(localStorage.getItem('powerfit_workouts'), null);
assert.notEqual(localStorage.getItem('powerfit_schedule'), null);
assert.notEqual(localStorage.getItem('powerfit_evolution'), null);
assert.notEqual(localStorage.getItem('powerfit_photos'), null);
assert.notEqual(localStorage.getItem('workouts_22222222-2222-4222-8222-222222222222'), null);
assert.equal(supabase.auth.signOutCalled, true);

localStorage.clear();

assert.equal(localStorage.length, 0);
