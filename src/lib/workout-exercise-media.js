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
  return {
    ...exercise,
    videoUrl: String(exercise.videoUrl || '').trim(),
    imageUrl: String(exercise.imageUrl || '').trim(),
  };
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
