const INTAKE_KEY_PREFIX = 'powerfit_student_intake_';

const REQUIRED_FIELDS = [
  'goal',
  'experienceLevel',
  'daysPerWeek',
  'sessionDuration',
  'equipment',
  'muscleFocus',
  'trainingHistory',
];

const RISK_FLAGS = [
  { key: 'chestPainDuringEffort', label: 'Dor no peito durante esforco' },
  { key: 'dizzinessOrFainting', label: 'Tontura ou desmaio relatado' },
  { key: 'heartOrBloodPressureIssue', label: 'Problema cardiaco ou pressao relatado' },
  { key: 'recentSurgeryOrInjury', label: 'Cirurgia ou lesao recente' },
  { key: 'medicalRestriction', label: 'Restricao medica informada' },
];

function getStorageKey(studentId) {
  const id = String(studentId || '').trim();
  return id ? `${INTAKE_KEY_PREFIX}${id}` : null;
}

function asList(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return String(value || '').trim().length > 0;
}

function normalizeIntake(intake = {}) {
  const safeIntake = intake && typeof intake === 'object' ? intake : {};
  const normalized = {
    equipment: asList(safeIntake.equipment),
    muscleFocus: asList(safeIntake.muscleFocus),
    updatedAt: safeIntake.updatedAt || new Date().toISOString(),
  };

  for (const field of ['goal', 'experienceLevel', 'daysPerWeek', 'sessionDuration', 'trainingHistory', 'limitations', 'notes']) {
    normalized[field] = String(safeIntake[field] || '').trim();
  }

  for (const flag of RISK_FLAGS) {
    normalized[flag.key] = safeIntake[flag.key] === true;
  }

  return normalized;
}

function isComplete(intake) {
  const normalized = normalizeIntake(intake);
  return REQUIRED_FIELDS.every(field => hasValue(normalized[field]));
}

export function getStudentRiskFlags(intake) {
  const normalized = normalizeIntake(intake);
  const flags = [];

  if (normalized.limitations) flags.push('Dor, lesao ou restricao informada');

  for (const flag of RISK_FLAGS) {
    if (normalized[flag.key]) flags.push(flag.label);
  }

  return flags;
}

export function getStudentIntake(studentId) {
  const key = getStorageKey(studentId);
  if (!key || typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStudentIntake(studentId, intake) {
  const key = getStorageKey(studentId);
  if (!key || typeof localStorage === 'undefined') return null;

  const normalized = normalizeIntake({ ...intake, updatedAt: new Date().toISOString() });
  const saved = {
    ...normalized,
    completed: isComplete(normalized),
  };

  localStorage.setItem(key, JSON.stringify(saved));
  return saved;
}

export function hasCompletedStudentIntake(studentId) {
  const intake = getStudentIntake(studentId);
  return !!intake && isComplete(intake);
}

export function getStudentIntakeSummary(intake) {
  const normalized = normalizeIntake(intake);
  const flags = getStudentRiskFlags(normalized);

  return {
    goal: normalized.goal || 'Nao informado',
    daysPerWeek: normalized.daysPerWeek || 'Nao informado',
    sessionDuration: normalized.sessionDuration || 'Nao informado',
    availability: normalized.daysPerWeek && normalized.sessionDuration
      ? `${normalized.daysPerWeek} dias/semana, ${normalized.sessionDuration} por treino`
      : 'Nao informado',
    experienceLevel: normalized.experienceLevel || 'Nao informado',
    equipment: normalized.equipment.length ? normalized.equipment.join(', ') : 'Nao informado',
    muscleFocus: normalized.muscleFocus.length ? normalized.muscleFocus.join(', ') : 'Nao informado',
    trainingHistory: normalized.trainingHistory || 'Nao informado',
    limitations: normalized.limitations || '',
    notes: normalized.notes || '',
    attentionPoints: flags.length ? flags : ['Sem pontos de atenção informados.'],
  };
}

export function getStudentIntakeProfile(student = {}, intake = null) {
  const summary = getStudentIntakeSummary(intake);
  const hasIntake = !!intake && isComplete(intake);
  const riskFlags = getStudentRiskFlags(intake);
  const needsProfessionalReview = riskFlags.length > 0;

  return {
    ...summary,
    studentName: student?.name || student?.fullName || student?.email || 'Aluno',
    hasIntake,
    needsProfessionalReview,
    status: needsProfessionalReview
      ? 'Atenção: revisar com profissional antes de treinar'
      : hasIntake
        ? 'Avaliação inicial concluída'
        : 'Avaliação inicial pendente',
    statusTone: needsProfessionalReview ? 'warning' : hasIntake ? 'success' : 'muted',
    attentionPoints: hasIntake || needsProfessionalReview
      ? summary.attentionPoints
      : ['Este aluno ainda não preencheu a avaliação inicial.'],
  };
}
