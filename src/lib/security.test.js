import assert from 'node:assert/strict';
import { sanitizeExportData, sanitizeImportData, stripSensitiveSessionFields } from './security.js';

const source = {
  id: 'user-1',
  email: 'aluno@example.com',
  type: 'aluno',
  password: 'secret-password',
  senha: 'senha-secreta',
  nested: { keep: true, password: 'nested-password', senha: 'nested-senha' },
};

const sanitized = stripSensitiveSessionFields(source);

assert.equal(sanitized.id, 'user-1');
assert.equal(sanitized.email, 'aluno@example.com');
assert.equal(sanitized.type, 'aluno');
assert.equal(sanitized.nested.keep, true);
assert.equal(Object.hasOwn(sanitized, 'password'), false);
assert.equal(Object.hasOwn(sanitized, 'senha'), false);
assert.equal(Object.hasOwn(sanitized.nested, 'password'), false);
assert.equal(Object.hasOwn(sanitized.nested, 'senha'), false);
assert.equal(Object.hasOwn(source, 'password'), true);
assert.equal(Object.hasOwn(source.nested, 'password'), true);
assert.equal(stripSensitiveSessionFields(null), null);

const backupSource = {
  users: [
    {
      id: 'user-1',
      email: 'personal@example.com',
      password: 'legacy-user-password',
      profile: { senha: 'nested-user-senha', keep: true },
    },
  ],
  students: [
    {
      id: 'student-1',
      email: 'aluno@example.com',
      senha: 'legacy-student-senha',
      nested: { password: 'nested-student-password', keep: true },
    },
  ],
  workouts: [
    { id: 'workout-1', name: 'Treino A', exercises: [{ name: 'Agachamento' }] },
  ],
};

const sanitizedBackup = sanitizeExportData(backupSource);
const backupJson = JSON.stringify(sanitizedBackup);

assert.equal(backupJson.includes('legacy-user-password'), false);
assert.equal(backupJson.includes('legacy-student-senha'), false);
assert.equal(backupJson.includes('nested-user-senha'), false);
assert.equal(backupJson.includes('nested-student-password'), false);
assert.equal(Object.hasOwn(sanitizedBackup.users[0], 'password'), false);
assert.equal(Object.hasOwn(sanitizedBackup.students[0], 'senha'), false);
assert.equal(Object.hasOwn(sanitizedBackup.users[0].profile, 'senha'), false);
assert.equal(Object.hasOwn(sanitizedBackup.students[0].nested, 'password'), false);
assert.equal(sanitizedBackup.users[0].profile.keep, true);
assert.equal(sanitizedBackup.students[0].nested.keep, true);
assert.equal(sanitizedBackup.workouts[0].name, 'Treino A');
assert.equal(Object.hasOwn(backupSource.users[0], 'password'), true);
assert.equal(Object.hasOwn(backupSource.students[0].nested, 'password'), true);

const importSource = {
  version: '2.0',
  powerfit_current_user: {
    id: 'session-1',
    email: 'session@example.com',
    password: 'session-password',
    nested: { senha: 'session-nested-senha', keep: true },
  },
  currentUser: {
    id: 'session-2',
    email: 'current@example.com',
    senha: 'current-senha',
  },
  users: [{ id: 'user-legacy', password: 'legacy-user-password' }],
  students: [{ id: 'student-legacy', senha: 'legacy-student-senha' }],
};

const sanitizedImport = sanitizeImportData(importSource);

assert.equal(Object.hasOwn(sanitizedImport.powerfit_current_user, 'password'), false);
assert.equal(Object.hasOwn(sanitizedImport.powerfit_current_user.nested, 'senha'), false);
assert.equal(sanitizedImport.powerfit_current_user.nested.keep, true);
assert.equal(Object.hasOwn(sanitizedImport.currentUser, 'senha'), false);
assert.equal(sanitizedImport.users[0].password, 'legacy-user-password');
assert.equal(sanitizedImport.students[0].senha, 'legacy-student-senha');
assert.equal(Object.hasOwn(importSource.powerfit_current_user, 'password'), true);
