import assert from 'node:assert/strict';
import {
  getStudentBmiInfo,
  getStudentIntake,
  getStudentIntakeProfile,
  getStudentIntakeSummary,
  getStudentParQStatus,
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
assert.equal(summary.daysPerWeek, '4');
assert.equal(summary.sessionDuration, '45 minutos');
assert.equal(summary.trainingHistory, 'Treina ha 1 ano com pausas curtas.');
assert.equal(summary.notes, 'Prefere treinar a noite.');
assert.equal(summary.continuousMedication, false);
assert.equal(summary.recentSurgery, false);
assert.equal(summary.medicalRestriction, false);
assert.equal(summary.chronicDisease, false);
assert.equal(summary.familyCardiacHistory, false);
assert.equal(summary.constantPain, false);
assert.equal(summary.parqStatus, 'Aprovado');
assert.equal(summary.parqNeedsMedicalAttention, false);
assert.equal(summary.bmi, 'Nao informado');
assert.equal(summary.measurementsSummary, 'Nao informado');
assert.deepEqual(summary.attentionPoints, ['Sem pontos de atenção informados.']);

const profile = getStudentIntakeProfile({ name: 'Marina Silva' }, saved);
assert.equal(profile.studentName, 'Marina Silva');
assert.equal(profile.status, 'Avaliação inicial concluída');
assert.equal(profile.statusTone, 'success');
assert.equal(profile.needsProfessionalReview, false);
assert.equal(profile.goal, 'Hipertrofia');
assert.equal(profile.daysPerWeek, '4');
assert.equal(profile.sessionDuration, '45 minutos');
assert.equal(profile.equipment, 'Halteres, Banco');
assert.equal(profile.muscleFocus, 'Peito, Costas');
assert.equal(profile.trainingHistory, 'Treina ha 1 ano com pausas curtas.');
assert.equal(profile.notes, 'Prefere treinar a noite.');

const cautionProfile = getStudentIntakeProfile({ name: 'Aluno risco' }, { ...saved, medicalRestriction: true });
assert.equal(cautionProfile.status, 'Atenção: revisar com profissional antes de treinar');
assert.equal(cautionProfile.statusTone, 'warning');
assert.equal(cautionProfile.needsProfessionalReview, true);
assert.ok(cautionProfile.attentionPoints.includes('Restricao medica informada'));

const pendingProfile = getStudentIntakeProfile({ name: 'Aluno sem avaliacao' }, null);
assert.equal(pendingProfile.status, 'Avaliação inicial pendente');
assert.equal(pendingProfile.statusTone, 'muted');
assert.equal(pendingProfile.goal, 'Nao informado');
assert.deepEqual(pendingProfile.attentionPoints, ['Este aluno ainda não preencheu a avaliação inicial.']);

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
assert.ok(riskFlags.includes('Cirurgia recente informada'));
assert.ok(riskFlags.includes('Restricao medica informada'));

const parqAttention = {
  ...saved,
  parqChestPainActivity: true,
  weight: '82.5',
  height: '178',
  waist: '88',
  hip: '101',
};
const parqSummary = getStudentIntakeSummary(parqAttention);
const bmiInfo = getStudentBmiInfo(parqAttention);
const parqStatus = getStudentParQStatus(parqAttention);

assert.equal(parqStatus.status, 'Atenção');
assert.equal(parqStatus.needsMedicalAttention, true);
assert.equal(parqSummary.parqStatus, 'Atenção');
assert.equal(parqSummary.parqNeedsMedicalAttention, true);
assert.equal(bmiInfo.formatted, '26,0');
assert.equal(bmiInfo.classification, 'Sobrepeso');
assert.equal(parqSummary.measurementsSummary, 'Peso: 82.5 kg; Altura: 178 cm; Cintura: 88 cm; Quadril: 101 cm; IMC: 26,0 (Sobrepeso)');
assert.ok(getStudentRiskFlags(parqAttention).some(flag => flag.startsWith('PAR-Q:')));

assert.deepEqual(getStudentRiskFlags(null), []);

const emptySummary = getStudentIntakeSummary(null);
assert.equal(emptySummary.goal, 'Nao informado');
assert.equal(emptySummary.availability, 'Nao informado');
assert.deepEqual(emptySummary.attentionPoints, ['Sem pontos de atenção informados.']);
