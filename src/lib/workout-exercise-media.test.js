import assert from 'node:assert/strict';
import {
  canStudentDeleteAIWorkout,
  isValidYouTubeUrl,
  normalizeWorkoutExerciseMediaFields,
  validateWorkoutExerciseMediaUrls,
} from './workout-exercise-media.js';

assert.equal(isValidYouTubeUrl('https://www.youtube.com/watch?v=abc123'), true);
assert.equal(isValidYouTubeUrl('https://youtu.be/abc123'), true);
assert.equal(isValidYouTubeUrl('https://youtube.com/shorts/abc123'), true);
assert.equal(isValidYouTubeUrl('https://vimeo.com/abc123'), false);
assert.equal(isValidYouTubeUrl('not a url'), false);

assert.deepEqual(validateWorkoutExerciseMediaUrls([
  { name: 'Supino reto', videoUrl: '', imageUrl: '' },
  { name: 'Remada curvada' },
]), { valid: true });

const invalidVideo = validateWorkoutExerciseMediaUrls([
  { name: 'Supino reto', videoUrl: 'https://vimeo.com/abc123' },
]);
assert.equal(invalidVideo.valid, false);
assert.equal(invalidVideo.exerciseName, 'Supino reto');
assert.match(invalidVideo.message, /YouTube/);

const normalizedExercise = normalizeWorkoutExerciseMediaFields({
  name: 'Agachamento',
  videoUrl: '  https://youtu.be/squat-demo  ',
  imageUrl: '  https://example.com/squat.jpg  ',
});
assert.equal(normalizedExercise.videoUrl, 'https://youtu.be/squat-demo');
assert.equal(normalizedExercise.imageUrl, 'https://example.com/squat.jpg');

assert.equal(canStudentDeleteAIWorkout({ source: 'student_ai', aiGenerated: false }), true);
assert.equal(canStudentDeleteAIWorkout({ source: 'rascunho_anamnese', aiGenerated: true }), false);
assert.equal(canStudentDeleteAIWorkout({ source: 'student_ai_backup' }), false);
