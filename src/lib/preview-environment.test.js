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

assert.equal(getPreviewDemoNotice('powerfit-demo.vercel.app'), '');
assert.equal(getPreviewDemoNotice('powerfit-demo.vercel.app', true), 'Ambiente demo/preview - nao use dados reais.');
assert.equal(getPreviewDemoNotice('powerfit-demo-git-main-time.vercel.app', true), 'Ambiente demo/preview - nao use dados reais.');
assert.equal(getPreviewDemoNotice('localhost'), '');
assert.equal(getPreviewDemoNotice('localhost', true), 'Ambiente demo/preview - nao use dados reais.');
assert.equal(getPreviewDemoNotice('127.0.0.1'), '');
assert.equal(getPreviewDemoNotice('powerfit.com.br'), '');

const emptyPreviewStorage = createMemoryStorage();
const seedResult = ensurePreviewDemoSeed('powerfit-demo.vercel.app', emptyPreviewStorage, true);
assert.equal(seedResult.seeded, true);
assert.equal(emptyPreviewStorage.getItem('powerfit_demo_mode'), 'enabled');
const seededUsers = JSON.parse(emptyPreviewStorage.getItem('powerfit_users'));
assert.equal(seededUsers[0].email, 'trainer.demo@powerfit.test');
assert.equal(JSON.parse(emptyPreviewStorage.getItem('powerfit_students'))[0].email, 'student.demo@powerfit.test');
assert.equal(JSON.parse(emptyPreviewStorage.getItem('powerfit_workouts'))[0].name, 'Treino A - Forca e Hipertrofia');
assert.equal(seededUsers[0].password, 'demo123');
assert.equal(seededUsers.some(user => user.email === 'marcio.thaylson@gmail.com'), false);

const existingStorage = createMemoryStorage({
  powerfit_users: JSON.stringify([{ email: 'real.local@example.com' }]),
});
const skipResult = ensurePreviewDemoSeed('powerfit-demo.vercel.app', existingStorage, true);
assert.equal(skipResult.seeded, false);
assert.equal(JSON.parse(existingStorage.getItem('powerfit_users'))[0].email, 'real.local@example.com');
assert.equal(JSON.parse(existingStorage.getItem('powerfit_users')).length, 1);
assert.equal(existingStorage.getItem('powerfit_students'), null);

const localStorage = createMemoryStorage({ powerfit_demo_mode: 'enabled' });
const localResult = ensurePreviewDemoSeed('localhost', localStorage);
assert.equal(localResult.seeded, false);
assert.equal(localStorage.getItem('powerfit_users'), null);
assert.equal(localStorage.getItem('powerfit_demo_mode'), null);

const localDemoStorage = createMemoryStorage();
const localDemoResult = ensurePreviewDemoSeed('localhost', localDemoStorage, true);
assert.equal(localDemoResult.seeded, true);
assert.equal(localDemoStorage.getItem('powerfit_demo_mode'), 'enabled');
