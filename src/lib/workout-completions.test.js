import assert from 'node:assert/strict';
import {
  getWorkoutCompletion,
  getWorkoutCompletionsByStudent,
  getWorkoutCompletionsForTrainer,
  markWorkoutCompleted,
  markWorkoutPending,
} from './workout-completions.js';

class MemoryStorage {
  #items = new Map();

  getItem(key) { return this.#items.get(key) ?? null; }
  setItem(key, value) { this.#items.set(key, String(value)); }
  removeItem(key) { this.#items.delete(key); }
  clear() { this.#items.clear(); }
}

globalThis.localStorage = new MemoryStorage();

localStorage.clear();

const student = {
  id: 'student-1',
  studentId: 'student-1',
  email: 'aluna.demo@powerfit.local',
  name: 'Aluna Demo',
  personalId: 'personal-1',
};
const workout = {
  id: 'workout-1',
  name: 'Treino publicado - Aluna Demo',
  source: 'rascunho_anamnese',
  personalId: 'personal-1',
};

assert.deepEqual(getWorkoutCompletionsByStudent(student), []);
assert.deepEqual(getWorkoutCompletionsForTrainer('personal-1'), []);

const first = markWorkoutCompleted(student, workout, {
  now: () => '2026-06-17T15:00:00.000Z',
  id: () => 'completion-1',
});

assert.equal(first.id, 'completion-1');
assert.equal(first.studentId, 'student-1');
assert.equal(first.studentName, 'Aluna Demo');
assert.equal(first.workoutId, 'workout-1');
assert.equal(first.workoutName, 'Treino publicado - Aluna Demo');
assert.equal(first.personalId, 'personal-1');
assert.equal(first.status, 'completed');
assert.equal(first.completedAt, '2026-06-17T15:00:00.000Z');
assert.equal(getWorkoutCompletionsByStudent(student).length, 1);
assert.equal(getWorkoutCompletionsForTrainer('personal-1').length, 1);
assert.equal(getWorkoutCompletion(student, 'workout-1').status, 'completed');

const second = markWorkoutCompleted(student, workout, {
  now: () => '2026-06-17T16:00:00.000Z',
  id: () => 'completion-2',
});

assert.equal(second.id, 'completion-1');
assert.equal(second.completedAt, '2026-06-17T16:00:00.000Z');
assert.equal(getWorkoutCompletionsByStudent(student).length, 1);

const pending = markWorkoutPending(student, workout, { now: () => '2026-06-17T17:00:00.000Z' });
assert.equal(pending.id, 'completion-1');
assert.equal(pending.status, 'pending');
assert.equal(pending.completedAt, null);
assert.equal(pending.updatedAt, '2026-06-17T17:00:00.000Z');
assert.equal(getWorkoutCompletion(student, 'workout-1').status, 'pending');
