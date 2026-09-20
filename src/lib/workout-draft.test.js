import assert from 'node:assert/strict';
import { generateWorkoutDraft, getPublishedDraftWorkoutsForStudent, publishWorkoutDraft } from './workout-draft.js';

const storage = new Map();

globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear(),
};

function baseIntake(overrides = {}) {
  return {
    goal: 'Hipertrofia',
    experienceLevel: 'Intermediario',
    daysPerWeek: '4 dias',
    sessionDuration: '45 minutos',
    equipment: ['Halteres', 'Maquinas'],
    muscleFocus: ['Peito', 'Costas'],
    trainingHistory: 'Treina ha 1 ano com pausas curtas.',
    limitations: '',
    chestPainDuringEffort: false,
    dizzinessOrFainting: false,
    heartOrBloodPressureIssue: false,
    recentSurgeryOrInjury: false,
    medicalRestriction: false,
    notes: 'Prefere treinar a noite.',
    completed: true,
    ...overrides,
  };
}

localStorage.clear();
localStorage.setItem('powerfit_workouts', JSON.stringify([{ id: 'official-1', name: 'Treino oficial' }]));
const beforeWorkouts = localStorage.getItem('powerfit_workouts');

const intermediateDraft = generateWorkoutDraft({ name: 'Marina Silva' }, baseIntake());
assert.equal(intermediateDraft.canGenerate, true);
assert.equal(intermediateDraft.title, 'Rascunho inicial - Marina Silva');
assert.equal(intermediateDraft.objective, 'Hipertrofia');
assert.equal(intermediateDraft.frequency, '4 dias por semana');
assert.equal(intermediateDraft.days.length, 4);
assert.deepEqual(Object.keys(intermediateDraft).sort(), [
  'canGenerate',
  'days',
  'equipment',
  'frequency',
  'level',
  'muscleFocus',
  'needsProfessionalReview',
  'objective',
  'observations',
  'reviewNotice',
  'safetyAlerts',
  'sessionDuration',
  'title',
].sort());
assert.ok(intermediateDraft.days[0].exercises.length >= 3);
assert.ok(intermediateDraft.days.flatMap(day => day.exercises).some(exercise => ['Supino reto', 'Supino inclinado com halteres', 'Puxada alta', 'Remada curvada', 'Remada baixa'].includes(exercise.name)));
assert.ok(intermediateDraft.reviewNotice.includes('Rascunho para revisão do personal'));
assert.ok(intermediateDraft.reviewNotice.includes('Não substitui avaliação médica'));
assert.equal(localStorage.getItem('powerfit_workouts'), beforeWorkouts);

localStorage.clear();
localStorage.setItem('powerfit_current_user', JSON.stringify({ id: 'personal-1', type: 'personal', name: 'Marcio Demo' }));
localStorage.setItem('powerfit_students', JSON.stringify([{
  id: 'student-1',
  studentId: 'student-1',
  student_id: 'student-1',
  email: 'aluna.demo@powerfit.local',
  name: 'Aluna Demo',
  personalId: 'personal-1',
  personal_id: 'personal-1',
}]));

const publishDraft = generateWorkoutDraft({ id: 'student-1', name: 'Aluna Demo', email: 'aluna.demo@powerfit.local', personalId: 'personal-1' }, baseIntake());
const firstPublish = publishWorkoutDraft(
  { id: 'student-1', name: 'Aluna Demo', email: 'aluna.demo@powerfit.local', personalId: 'personal-1' },
  publishDraft,
  { now: () => '2026-06-17T12:00:00.000Z', id: () => 'published-draft-1' },
);

assert.equal(firstPublish.created, true);
assert.equal(firstPublish.updated, false);
assert.equal(firstPublish.workout.id, 'published-draft-1');
assert.equal(firstPublish.workout.status, 'publicado');
assert.equal(firstPublish.workout.source, 'rascunho_anamnese');
assert.equal(firstPublish.workout.studentId, 'student-1');
assert.equal(firstPublish.workout.assignedTo, 'student-1');
assert.equal(firstPublish.workout.createdAt, '2026-06-17T12:00:00.000Z');
assert.ok(firstPublish.workout.exercises.length > 0);
assert.ok(firstPublish.workout.exercises.every(exercise => exercise.name && exercise.sets && exercise.reps));

let storedWorkouts = JSON.parse(localStorage.getItem('powerfit_workouts'));
assert.equal(storedWorkouts.length, 1);
let storedStudent = JSON.parse(localStorage.getItem('powerfit_students'))[0];
assert.deepEqual(storedStudent.workoutIds, ['published-draft-1']);
assert.equal(storedStudent.workoutSchedule.length, 1);
assert.equal(storedStudent.workoutSchedule[0].workoutId, 'published-draft-1');
assert.equal(storedStudent.workoutSchedule[0].status, 'pending');

const secondPublish = publishWorkoutDraft(
  { id: 'student-1', name: 'Aluna Demo', email: 'aluna.demo@powerfit.local', personalId: 'personal-1' },
  { ...publishDraft, observations: [...publishDraft.observations, 'Ajuste revisado pelo personal.'] },
  { now: () => '2026-06-17T13:00:00.000Z', id: () => 'published-draft-2' },
);

assert.equal(secondPublish.created, false);
assert.equal(secondPublish.updated, true);
assert.equal(secondPublish.workout.id, 'published-draft-1');
storedWorkouts = JSON.parse(localStorage.getItem('powerfit_workouts'));
assert.equal(storedWorkouts.length, 1);
assert.ok(storedWorkouts[0].notes.includes('Ajuste revisado pelo personal.'));

storedStudent = JSON.parse(localStorage.getItem('powerfit_students'))[0];
assert.equal(storedStudent.workoutIds.length, 1);
assert.equal(storedStudent.workoutSchedule.length, 1);

const visibleWorkouts = getPublishedDraftWorkoutsForStudent({ id: 'student-1', email: 'aluna.demo@powerfit.local', personalId: 'personal-1' });
assert.equal(visibleWorkouts.length, 1);
assert.equal(visibleWorkouts[0].id, 'published-draft-1');
assert.equal(visibleWorkouts[0].source, 'rascunho_anamnese');

localStorage.clear();
localStorage.setItem('powerfit_workouts', beforeWorkouts);

const beginnerDraft = generateWorkoutDraft({ name: 'Aluno iniciante' }, baseIntake({
  experienceLevel: 'Iniciante',
  daysPerWeek: '3 dias',
  sessionDuration: '30 minutos',
  equipment: ['Casa sem equipamento'],
  muscleFocus: ['Core'],
}));
assert.equal(beginnerDraft.days.length, 3);
assert.ok(beginnerDraft.days.flatMap(day => day.exercises).some(exercise => exercise.name === 'Prancha'));
assert.ok(beginnerDraft.days.every(day => day.exercises.every(exercise => exercise.sets <= 3)));

const restrictedDraft = generateWorkoutDraft({ name: 'Aluno com restricao' }, baseIntake({
  limitations: 'Dor no joelho direito em agachamentos profundos.',
  medicalRestriction: true,
}));
assert.equal(restrictedDraft.needsProfessionalReview, true);
assert.ok(restrictedDraft.safetyAlerts.includes('Atenção: revisar com profissional antes de aplicar este treino.'));
assert.ok(restrictedDraft.safetyAlerts.includes('Dor, lesao ou restricao informada'));
assert.ok(restrictedDraft.safetyAlerts.includes('Restricao medica informada'));
assert.ok(restrictedDraft.observations.some(item => item.includes('Não substitui avaliação médica')));

const parqDraft = generateWorkoutDraft({ name: 'Aluno PAR-Q' }, baseIntake({
  chestPainDuringEffort: true,
}));
assert.equal(parqDraft.needsProfessionalReview, true);
assert.ok(parqDraft.safetyAlerts.includes('Atenção: revisar com profissional antes de aplicar este treino.'));
assert.ok(parqDraft.safetyAlerts.includes('Dor no peito durante esforco'));

const noIntakeDraft = generateWorkoutDraft({ name: 'Aluno sem anamnese' }, null);
assert.equal(noIntakeDraft.canGenerate, false);
assert.equal(noIntakeDraft.days.length, 0);
assert.equal(noIntakeDraft.emptyMessage, 'Preencha a avaliação inicial do aluno antes de gerar um rascunho.');
assert.ok(noIntakeDraft.observations.includes('Rascunho para revisão do personal. Não substitui avaliação médica.'));

const twoDayDraft = generateWorkoutDraft({ name: 'Aluno 2 dias' }, baseIntake({ daysPerWeek: '2 dias', muscleFocus: ['Pernas'] }));
assert.equal(twoDayDraft.days.length, 2);
assert.equal(twoDayDraft.frequency, '2 dias por semana');

const incompleteDraft = generateWorkoutDraft({ name: 'Aluno incompleto' }, baseIntake({
  equipment: [],
  muscleFocus: [],
  trainingHistory: '',
  completed: false,
}));
assert.equal(incompleteDraft.canGenerate, true);
assert.ok(incompleteDraft.observations.some(item => item.includes('Dados incompletos')));
assert.ok(incompleteDraft.days.flatMap(day => day.exercises).length > 0);

assert.equal(localStorage.getItem('powerfit_workouts'), beforeWorkouts);
