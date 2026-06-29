const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

export function isValidYouTubeUrl(value) {
  const url = String(value || '').trim();
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) && YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function normalizeWorkoutExerciseMediaFields(exercise = {}) {
  const imageUrls = Array.isArray(exercise.imageUrls)
    ? exercise.imageUrls.map(url => String(url || '').trim()).filter(Boolean).slice(0, 2)
    : [];

  return {
    ...exercise,
    videoUrl: String(exercise.videoUrl || '').trim(),
    imageUrl: String(exercise.imageUrl || '').trim(),
    imageStartUrl: String(exercise.imageStartUrl || '').trim(),
    imageEndUrl: String(exercise.imageEndUrl || '').trim(),
    imageUrls,
  };
}

export function getExerciseImageFrames(exercise = {}) {
  const frameUrls = Array.isArray(exercise?.imageUrls) && exercise.imageUrls.length > 0
    ? exercise.imageUrls
    : [exercise?.imageStartUrl || exercise?.imageUrl, exercise?.imageEndUrl];
  const urls = new Set();

  for (const value of frameUrls) {
    const url = String(value || '').trim();
    if (url) urls.add(url);
  }

  if (urls.size === 0) {
    const imageUrl = String(exercise?.imageUrl || '').trim();
    if (imageUrl) urls.add(imageUrl);
  }

  return [...urls].slice(0, 2);
}

export function getWorkoutExerciseImageUrls(workouts = []) {
  const urls = new Set();

  for (const workout of workouts) {
    const exercises = Array.isArray(workout?.exercises) ? workout.exercises : [];
    for (const exercise of exercises) {
      getExerciseImageFrames(exercise).forEach(url => urls.add(url));
    }
  }

  return [...urls];
}

export function validateWorkoutExerciseMediaUrls(exercises = []) {
  for (const exercise of exercises) {
    const videoUrl = String(exercise?.videoUrl || '').trim();
    if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
      return {
        valid: false,
        exerciseName: exercise?.name || 'Exercicio',
        message: `Use um link do YouTube no exercicio ${exercise?.name || 'sem nome'}.`,
      };
    }
  }

  return { valid: true };
}

export function canStudentDeleteAIWorkout(workout = {}) {
  return workout?.source === 'student_ai';
}
