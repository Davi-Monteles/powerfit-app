import assert from 'node:assert/strict';
import { getExerciseMedia, normalizeExerciseName } from './exercise-media.js';

assert.equal(normalizeExerciseName('  Supino Reto  '), 'supino-reto');
assert.equal(normalizeExerciseName('Remada curvada'), 'remada-curvada');
assert.equal(normalizeExerciseName('Agachamento Livre'), 'agachamento-livre');
assert.equal(normalizeExerciseName('Elevação lateral'), 'elevacao-lateral');

const unknown = getExerciseMedia('Exercicio inventado');
assert.equal(unknown.key, 'exercicio-inventado');
assert.equal(unknown.label, 'Exercicio inventado');
assert.equal(unknown.hasMedia, false);
assert.deepEqual(unknown.muscleGroups, []);
assert.equal(unknown.equipment, 'Livre');

const supino = getExerciseMedia('Supino reto');
assert.equal(supino.key, 'supino-reto');
assert.equal(supino.label, 'Supino reto');
assert.equal(supino.hasMedia, true);
assert.equal(supino.gif, '/exercises/gifs/supino-reto.gif');
assert.deepEqual(supino.muscleGroups, ['Peito', 'Triceps', 'Ombros']);
assert.equal(supino.equipment, 'Banco e barra');

const agachamento = getExerciseMedia('Agachamento');
assert.equal(agachamento.key, 'agachamento-livre');
assert.equal(agachamento.hasMedia, true);
assert.deepEqual(agachamento.muscleGroups, ['Pernas', 'Gluteos', 'Core']);

const remada = getExerciseMedia({ name: 'Remada curvada', mediaKey: 'remada-curvada' });
assert.equal(remada.key, 'remada-curvada');
assert.equal(remada.hasMedia, true);
assert.equal(remada.equipment, 'Barra ou halteres');
