import assert from 'node:assert/strict';
import {
  getStudentIntake,
  getStudentIntakeSummary,
  getStudentRiskFlags,
  hasCompletedStudentIntake,
  saveStudentIntake,
} from './student-intake.js';

const storage = new Map();

globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear(),
};

localStorage.clear();

assert.equal(getStudentIntake('student-1'), null);
assert.equal(hasCompletedStudentIntake('student-1'), false);

const incomplete = saveStudentIntake('student-1', { goal: 'Hipertrofia' });
assert.equal(incomplete.completed, false);
assert.equal(hasCompletedStudentIntake('student-1'), false);

const saved = saveStudentIntake('student-1', {
  goal: 'Hipertrofia',
  experienceLevel: 'Intermediario',
  daysPerWeek: '4',
  sessionDuration: '45 minutos',
  equipment: ['Halteres', 'Banco'],
  muscleFocus: ['Peito', 'Costas'],
  trainingHistory: 'Treina ha 1 ano com pausas curtas.',
  limitations: '',
  chestPainDuringEffort: false,
  dizzinessOrFainting: false,
  heartOrBloodPressureIssue: false,
  recentSurgeryOrInjury: false,
  medicalRestriction: false,
  notes: 'Prefere treinar a noite.',
});

assert.equal(saved.completed, true);
assert.equal(saved.goal, 'Hipertrofia');
assert.deepEqual(saved.equipment, ['Halteres', 'Banco']);
assert.equal(typeof saved.updatedAt, 'string');
assert.deepEqual(getStudentIntake('student-1'), saved);
assert.equal(hasCompletedStudentIntake('student-1'), true);

const summary = getStudentIntakeSummary(saved);
assert.equal(summary.goal, 'Hipertrofia');
assert.equal(summary.availability, '4 dias/semana, 45 minutos por treino');
assert.equal(summary.experienceLevel, 'Intermediario');
assert.equal(summary.equipment, 'Halteres, Banco');
assert.equal(summary.muscleFocus, 'Peito, Costas');
assert.deepEqual(summary.attentionPoints, ['Sem pontos de atenção informados.']);

const riskFlags = getStudentRiskFlags({
  limitations: 'Dor no joelho direito em agachamentos.',
  chestPainDuringEffort: true,
  dizzinessOrFainting: true,
  heartOrBloodPressureIssue: true,
  recentSurgeryOrInjury: true,
  medicalRestriction: true,
});

assert.ok(riskFlags.includes('Dor, lesao ou restricao informada'));
assert.ok(riskFlags.includes('Dor no peito durante esforco'));
assert.ok(riskFlags.includes('Tontura ou desmaio relatado'));
assert.ok(riskFlags.includes('Problema cardiaco ou pressao relatado'));
assert.ok(riskFlags.includes('Cirurgia ou lesao recente'));
assert.ok(riskFlags.includes('Restricao medica informada'));

assert.deepEqual(getStudentRiskFlags(null), []);

const emptySummary = getStudentIntakeSummary(null);
assert.equal(emptySummary.goal, 'Nao informado');
assert.equal(emptySummary.availability, 'Nao informado');
assert.deepEqual(emptySummary.attentionPoints, ['Sem pontos de atenção informados.']);
