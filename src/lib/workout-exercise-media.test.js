import assert from 'node:assert/strict';
import {
  canStudentDeleteAIWorkout,
  getExerciseImageFrames,
  getWorkoutExerciseImageUrls,
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

const normalizedExerciseFrames = normalizeWorkoutExerciseMediaFields({
  name: 'Supino',
  imageStartUrl: ' https://example.com/supino/0.jpg ',
  imageEndUrl: ' https://example.com/supino/1.jpg ',
  imageUrls: [' https://example.com/supino/0.jpg ', ' https://example.com/supino/1.jpg '],
});
assert.equal(normalizedExerciseFrames.imageStartUrl, 'https://example.com/supino/0.jpg');
assert.equal(normalizedExerciseFrames.imageEndUrl, 'https://example.com/supino/1.jpg');
assert.deepEqual(normalizedExerciseFrames.imageUrls, [
  'https://example.com/supino/0.jpg',
  'https://example.com/supino/1.jpg',
]);

assert.deepEqual(getExerciseImageFrames({
  imageUrls: [' https://example.com/frame-0.jpg ', 'https://example.com/frame-1.jpg', 'https://example.com/extra.jpg'],
}), ['https://example.com/frame-0.jpg', 'https://example.com/frame-1.jpg']);

assert.deepEqual(getExerciseImageFrames({
  imageStartUrl: 'https://example.com/start.jpg',
  imageEndUrl: 'https://example.com/end.jpg',
}), ['https://example.com/start.jpg', 'https://example.com/end.jpg']);

assert.deepEqual(getExerciseImageFrames({ imageUrl: 'https://example.com/static.jpg' }), ['https://example.com/static.jpg']);

assert.deepEqual(getWorkoutExerciseImageUrls([
  { exercises: [{ imageUrl: ' https://example.com/a.jpg ' }, { imageUrl: '' }] },
  { exercises: [{ imageUrl: 'https://example.com/a.jpg' }, { imageUrls: ['https://example.com/b-0.jpg', 'https://example.com/b-1.jpg'] }] },
  { exercises: null },
]), ['https://example.com/a.jpg', 'https://example.com/b-0.jpg', 'https://example.com/b-1.jpg']);

assert.equal(canStudentDeleteAIWorkout({ source: 'student_ai', aiGenerated: false }), true);
assert.equal(canStudentDeleteAIWorkout({ source: 'rascunho_anamnese', aiGenerated: true }), false);
assert.equal(canStudentDeleteAIWorkout({ source: 'student_ai_backup' }), false);
