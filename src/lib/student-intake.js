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

const HEALTH_FLAGS = [
  { key: 'continuousMedication', label: 'Medicacao continua informada' },
  { key: 'recentSurgery', label: 'Cirurgia recente informada', legacyKey: 'recentSurgeryOrInjury' },
  { key: 'medicalRestriction', label: 'Restricao medica informada' },
  { key: 'chronicDisease', label: 'Doenca cronica informada' },
  { key: 'familyCardiacHistory', label: 'Historico familiar cardiaco informado' },
];

const LEGACY_RISK_FLAGS = [
  { key: 'chestPainDuringEffort', label: 'Dor no peito durante esforco' },
  { key: 'dizzinessOrFainting', label: 'Tontura ou desmaio relatado' },
  { key: 'heartOrBloodPressureIssue', label: 'Problema cardiaco ou pressao relatado' },
];

export const PAR_Q_FIELDS = [
  { key: 'parqHeartCondition', label: 'Algum medico ja disse que voce possui problema cardiaco e que so deve fazer atividade fisica recomendada por medico?' },
  { key: 'parqChestPainActivity', label: 'Voce sente dor no peito quando pratica atividade fisica?' },
  { key: 'parqChestPainRest', label: 'No ultimo mes, voce sentiu dor no peito quando nao estava praticando atividade fisica?' },
  { key: 'parqDizziness', label: 'Voce perde o equilibrio por tontura ou ja perdeu a consciencia?' },
  { key: 'parqBoneJointProblem', label: 'Voce tem algum problema osseo ou articular que poderia piorar com atividade fisica?' },
  { key: 'parqBloodPressureMedication', label: 'Algum medico ja prescreveu medicamento para pressao arterial ou problema cardiaco?' },
  { key: 'parqOtherReason', label: 'Voce sabe de qualquer outra razao pela qual nao deveria praticar atividade fisica?' },
];

const MEASURE_FIELDS = ['weight', 'height', 'waist', 'hip'];

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

function readBoolean(source, key, legacyKey) {
  return source[key] === true || Boolean(legacyKey && source[legacyKey] === true);
}

function parsePositiveNumber(value) {
  const number = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function classifyBmi(value) {
  if (value < 18.5) return 'Abaixo do peso';
  if (value < 25) return 'Peso normal';
  if (value < 30) return 'Sobrepeso';
  if (value < 35) return 'Obesidade grau I';
  if (value < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

function formatBmi(value) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function normalizeIntake(intake = {}) {
  const safeIntake = intake && typeof intake === 'object' ? intake : {};
  const normalized = {
    equipment: asList(safeIntake.equipment),
    muscleFocus: asList(safeIntake.muscleFocus),
    updatedAt: safeIntake.updatedAt || new Date().toISOString(),
  };

  for (const field of ['goal', 'experienceLevel', 'daysPerWeek', 'sessionDuration', 'trainingHistory', 'limitations', 'notes', 'constantPainLocation', 'sleepHours']) {
    normalized[field] = String(safeIntake[field] || '').trim();
  }

  for (const field of MEASURE_FIELDS) {
    normalized[field] = String(safeIntake[field] || '').trim();
  }

  normalized.constantPain = safeIntake.constantPain === true;

  for (const flag of HEALTH_FLAGS) {
    normalized[flag.key] = readBoolean(safeIntake, flag.key, flag.legacyKey);
  }

  for (const flag of LEGACY_RISK_FLAGS) {
    normalized[flag.key] = safeIntake[flag.key] === true;
  }

  for (const field of PAR_Q_FIELDS) {
    normalized[field.key] = safeIntake[field.key] === true;
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
  if (normalized.constantPain) {
    flags.push(normalized.constantPainLocation ? `Dor constante: ${normalized.constantPainLocation}` : 'Dor constante informada');
  }

  for (const flag of HEALTH_FLAGS) {
    if (normalized[flag.key]) flags.push(flag.label);
  }

  for (const flag of LEGACY_RISK_FLAGS) {
    if (normalized[flag.key]) flags.push(flag.label);
  }

  for (const field of PAR_Q_FIELDS) {
    if (normalized[field.key]) flags.push(`PAR-Q: ${field.label}`);
  }

  return [...new Set(flags)];
}

export function getStudentBmiInfo(intake) {
  const normalized = normalizeIntake(intake);
  const weight = parsePositiveNumber(normalized.weight);
  const height = parsePositiveNumber(normalized.height);

  if (!weight || !height) {
    return { value: null, formatted: 'Nao informado', classification: 'Nao informado', label: 'Nao informado' };
  }

  const value = Math.round((weight / ((height / 100) ** 2)) * 10) / 10;
  const classification = classifyBmi(value);

  return {
    value,
    formatted: formatBmi(value),
    classification,
    label: `${formatBmi(value)} (${classification})`,
  };
}

export function getStudentParQStatus(intake) {
  if (!intake) return { status: 'Nao informado', needsMedicalAttention: false };

  const normalized = normalizeIntake(intake);
  const needsMedicalAttention = PAR_Q_FIELDS.some(field => normalized[field.key]);

  return {
    status: needsMedicalAttention ? 'Atenção' : 'Aprovado',
    needsMedicalAttention,
  };
}

export function getStudentMeasurementsSummary(intake) {
  const normalized = normalizeIntake(intake);
  const values = [
    normalized.weight && `Peso: ${normalized.weight} kg`,
    normalized.height && `Altura: ${normalized.height} cm`,
    normalized.waist && `Cintura: ${normalized.waist} cm`,
    normalized.hip && `Quadril: ${normalized.hip} cm`,
  ].filter(Boolean);
  const bmi = getStudentBmiInfo(normalized);

  if (bmi.value) values.push(`IMC: ${bmi.label}`);
  return values.length ? values.join('; ') : 'Nao informado';
}

export function getStudentHealthSummary(intake) {
  const normalized = normalizeIntake(intake);
  const values = [];

  for (const flag of HEALTH_FLAGS) {
    if (normalized[flag.key]) values.push(flag.label.replace(' informada', '').replace(' informado', ''));
  }

  if (normalized.constantPain) {
    values.push(normalized.constantPainLocation ? `Dor constante: ${normalized.constantPainLocation}` : 'Dor constante');
  }
  if (normalized.sleepHours) values.push(`Sono: ${normalized.sleepHours} h/noite`);

  return values.length ? values.join('; ') : 'Sem alertas de saude informados.';
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
  const bmi = getStudentBmiInfo(normalized);
  const parq = getStudentParQStatus(intake);

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
    continuousMedication: normalized.continuousMedication,
    recentSurgery: normalized.recentSurgery,
    medicalRestriction: normalized.medicalRestriction,
    chronicDisease: normalized.chronicDisease,
    familyCardiacHistory: normalized.familyCardiacHistory,
    constantPain: normalized.constantPain,
    constantPainLocation: normalized.constantPainLocation,
    sleepHours: normalized.sleepHours,
    weight: normalized.weight,
    height: normalized.height,
    waist: normalized.waist,
    hip: normalized.hip,
    bmi: bmi.label,
    bmiClassification: bmi.classification,
    parqStatus: parq.status,
    parqNeedsMedicalAttention: parq.needsMedicalAttention,
    healthSummary: getStudentHealthSummary(normalized),
    measurementsSummary: getStudentMeasurementsSummary(normalized),
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
