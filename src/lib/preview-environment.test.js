import assert from 'node:assert/strict';

import { ensurePreviewDemoSeed, getPreviewDemoNotice } from './preview-environment.js';

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

assert.equal(getPreviewDemoNotice('powerfit-demo.vercel.app'), 'Ambiente demo/preview - nao use dados reais.');
assert.equal(getPreviewDemoNotice('powerfit-demo-git-main-time.vercel.app'), 'Ambiente demo/preview - nao use dados reais.');
assert.equal(getPreviewDemoNotice('localhost'), '');
assert.equal(getPreviewDemoNotice('127.0.0.1'), '');
assert.equal(getPreviewDemoNotice('powerfit.com.br'), '');

const emptyPreviewStorage = createMemoryStorage();
const seedResult = ensurePreviewDemoSeed('powerfit-demo.vercel.app', emptyPreviewStorage);
assert.equal(seedResult.seeded, true);
assert.equal(JSON.parse(emptyPreviewStorage.getItem('powerfit_users'))[0].email, 'marcio.demo@powerfit.local');
assert.equal(JSON.parse(emptyPreviewStorage.getItem('powerfit_students'))[0].email, 'aluno.pro@powerfit.local');
assert.equal(JSON.parse(emptyPreviewStorage.getItem('powerfit_workouts'))[0].name, 'Treino A - Forca e Hipertrofia');
assert.equal(JSON.parse(emptyPreviewStorage.getItem('powerfit_users'))[0].password, 'demo123');

const existingStorage = createMemoryStorage({
  powerfit_users: JSON.stringify([{ email: 'real.local@example.com' }]),
});
const skipResult = ensurePreviewDemoSeed('powerfit-demo.vercel.app', existingStorage);
assert.equal(skipResult.seeded, false);
assert.equal(JSON.parse(existingStorage.getItem('powerfit_users'))[0].email, 'real.local@example.com');
assert.equal(existingStorage.getItem('powerfit_students'), null);

const localStorage = createMemoryStorage();
const localResult = ensurePreviewDemoSeed('localhost', localStorage);
assert.equal(localResult.seeded, false);
assert.equal(localStorage.getItem('powerfit_users'), null);
