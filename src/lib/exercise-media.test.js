import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXERCISE_LIBRARY, getExerciseMedia, normalizeExerciseName } from './exercise-media.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..', '..');

const requiredFields = [
  'name',
  'slug',
  'primaryMuscle',
  'secondaryMuscles',
  'equipment',
  'level',
  'shortInstruction',
  'commonMistakes',
  'safetyNote',
  'mediaStatus',
  'futureGifPath',
];

assert.equal(normalizeExerciseName('  Supino Reto  '), 'supino-reto');
assert.equal(normalizeExerciseName('Remada curvada'), 'remada-curvada');
assert.equal(normalizeExerciseName('Agachamento Livre'), 'agachamento-livre');
assert.equal(normalizeExerciseName('Elevação lateral'), 'elevacao-lateral');
assert.equal(normalizeExerciseName('Tríceps corda'), 'triceps-corda');

assert.equal(Object.keys(EXERCISE_LIBRARY).length, 20);

for (const [key, exercise] of Object.entries(EXERCISE_LIBRARY)) {
  assert.equal(key, exercise.slug);

  for (const field of requiredFields) {
    assert.ok(exercise[field] !== undefined, `${key} missing ${field}`);
  }

  assert.equal(typeof exercise.name, 'string');
  assert.equal(typeof exercise.slug, 'string');
  assert.equal(typeof exercise.primaryMuscle, 'string');
  assert.ok(Array.isArray(exercise.secondaryMuscles), `${key} secondaryMuscles must be array`);
  assert.equal(typeof exercise.equipment, 'string');
  assert.equal(typeof exercise.level, 'string');
  assert.equal(typeof exercise.shortInstruction, 'string');
  assert.ok(Array.isArray(exercise.commonMistakes), `${key} commonMistakes must be array`);
  assert.equal(typeof exercise.safetyNote, 'string');
  assert.ok(['placeholder', 'needs_asset'].includes(exercise.mediaStatus), `${key} invalid mediaStatus`);
  assert.match(exercise.futureGifPath, /^\/exercises\/gifs\/[a-z0-9-]+\.gif$/);
  assert.equal(exercise.gif, null, `${key} must not point to a real GIF yet`);
  assert.equal(existsSync(join(appRoot, 'public', exercise.futureGifPath)), false, `${key} future GIF should not exist yet`);
}

const unknown = getExerciseMedia('Exercicio inventado');
assert.equal(unknown.key, 'exercicio-inventado');
assert.equal(unknown.label, 'Exercicio inventado');
assert.equal(unknown.hasMedia, false);
assert.deepEqual(unknown.muscleGroups, []);
assert.equal(unknown.equipment, 'Livre');
assert.equal(unknown.mediaStatus, 'placeholder');
assert.equal(unknown.futureGifPath, null);

const supino = getExerciseMedia('Supino reto');
assert.equal(supino.key, 'supino-reto');
assert.equal(supino.label, 'Supino reto');
assert.equal(supino.name, 'Supino reto');
assert.equal(supino.hasMedia, false);
assert.equal(supino.gif, null);
assert.equal(supino.futureGifPath, '/exercises/gifs/supino-reto.gif');
assert.deepEqual(supino.muscleGroups, ['Peito', 'Triceps', 'Ombros']);
assert.equal(supino.equipment, 'Banco e barra');
assert.equal(supino.primaryMuscle, 'Peito');
assert.equal(supino.level, 'Intermediario');
assert.equal(supino.mediaStatus, 'needs_asset');

const agachamento = getExerciseMedia('Agachamento');
assert.equal(agachamento.key, 'agachamento-livre');
assert.equal(agachamento.hasMedia, false);
assert.deepEqual(agachamento.muscleGroups, ['Quadriceps', 'Gluteos', 'Posteriores', 'Core']);
assert.equal(agachamento.primaryMuscle, 'Quadriceps');

const remada = getExerciseMedia({ name: 'Remada curvada', mediaKey: 'remada-curvada' });
assert.equal(remada.key, 'remada-curvada');
assert.equal(remada.hasMedia, false);
assert.equal(remada.equipment, 'Barra ou halteres');

const puxada = getExerciseMedia('Puxada alta');
assert.equal(puxada.key, 'puxada-alta');
assert.equal(puxada.primaryMuscle, 'Costas');
assert.equal(puxada.level, 'Iniciante');

const elevacao = getExerciseMedia('Elevação lateral');
assert.equal(elevacao.key, 'elevacao-lateral');
assert.equal(elevacao.primaryMuscle, 'Ombros laterais');
assert.equal(elevacao.mediaStatus, 'needs_asset');

const triceps = getExerciseMedia('Tríceps corda');
assert.equal(triceps.key, 'triceps-corda');
assert.equal(triceps.primaryMuscle, 'Triceps');
assert.equal(triceps.equipment, 'Polia e corda');
