const EXERCISE_MEDIA = {
  'supino-reto': {
    label: 'Supino reto',
    gif: '/exercises/gifs/supino-reto.gif',
    muscleGroups: ['Peito', 'Triceps', 'Ombros'],
    equipment: 'Banco e barra',
  },
  'agachamento-livre': {
    label: 'Agachamento livre',
    gif: '/exercises/gifs/agachamento-livre.gif',
    muscleGroups: ['Pernas', 'Gluteos', 'Core'],
    equipment: 'Livre ou barra',
  },
  'remada-curvada': {
    label: 'Remada curvada',
    gif: '/exercises/gifs/remada-curvada.gif',
    muscleGroups: ['Costas', 'Biceps', 'Core'],
    equipment: 'Barra ou halteres',
  },
};

const EXERCISE_ALIASES = {
  agachamento: 'agachamento-livre',
  supino: 'supino-reto',
  remada: 'remada-curvada',
};

export function normalizeExerciseName(exerciseName) {
  return String(exerciseName || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getExerciseLabel(exercise) {
  if (exercise && typeof exercise === 'object') return exercise.name || exercise.mediaKey || '';
  return String(exercise || '');
}

export function getExerciseMedia(exercise) {
  const label = getExerciseLabel(exercise);
  const requestedKey = exercise && typeof exercise === 'object'
    ? exercise.mediaKey || exercise.name
    : exercise;
  const normalizedKey = normalizeExerciseName(requestedKey);
  const key = EXERCISE_ALIASES[normalizedKey] || normalizedKey;
  const mapped = EXERCISE_MEDIA[key];

  if (mapped) {
    return {
      key,
      label: mapped.label,
      gif: mapped.gif,
      muscleGroups: mapped.muscleGroups,
      equipment: mapped.equipment,
      hasMedia: Boolean(mapped.gif),
    };
  }

  return {
    key,
    label: label || 'Exercicio',
    gif: null,
    muscleGroups: [],
    equipment: 'Livre',
    hasMedia: false,
  };
}
