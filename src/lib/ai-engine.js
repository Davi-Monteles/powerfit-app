const MUSCLE_DATABASE = {
  peito: {
    title: '🏋️ Peitoral',
    muscles: ['Peitoral Maior', 'Peitoral Menor'],
    tips: ['Mantenha as escápulas retraídas e o peito expandido durante o supino.', 'Varie os ângulos (inclinado, reto, declinado).', 'Foque na contração.'],
    suggestedExercises: ['Supino Reto', 'Supino Inclinado', 'Crucifixo Máquina', 'Crossover'],
    warmup: 'Rotação de ombros + flexões leves (2x12)',
    commonMistakes: ['Arquear excessivamente a lombar', 'Não retrair as escápulas']
  },
  costas: {
    title: '💪 Dorsal',
    muscles: ['Latíssimo do Dorso', 'Trapézio', 'Romboides'],
    tips: ['Puxe com os cotovelos.', 'Use amplitude completa.'],
    suggestedExercises: ['Puxada Frente', 'Remada Curvada', 'Remada Unilateral', 'Levantamento Terra'],
    warmup: 'Band pull apart (2x15)',
    commonMistakes: ['Usar impulso do corpo']
  },
  quadriceps: {
    title: '🦵 Quadríceps (Coxa Anterior)',
    muscles: ['Quadríceps', 'Vasto Lateral', 'Vasto Medial'],
    tips: ['Agachamento requer boa mobilidade de tornozelo.', 'Leg Press é excelente para hipertrofia com menor demanda técnica.'],
    suggestedExercises: ['Agachamento Livre', 'Leg Press 45°', 'Cadeira Extensora', 'Hack Squat'],
    warmup: 'Agachamento corporal (2x15) + mobilidade de quadril',
    commonMistakes: ['Joelhos colapsando para dentro (valgo)']
  },
  posteriores: {
    title: '🦵 Isquiotibiais (Posterior de Coxa)',
    muscles: ['Isquiotibiais', 'Bíceps Femoral', 'Semimembranoso'],
    tips: ['Isquiotibiais são cruciais — o Stiff é essencial no programa.', 'Concentre-se na flexão do joelho e extensão do quadril.'],
    suggestedExercises: ['Stiff', 'Mesa Flexora', 'Cadeira Flexora', 'Elevação Pélvica Base Unilateral'],
    warmup: 'Mobilidade de quadril e alongamento dinâmico (2x15)',
    commonMistakes: ['Dobrar a lombar no Stiff']
  },
  panturrilhas: {
    title: '🦵 Panturrilhas',
    muscles: ['Gastrocnêmio', 'Sóleo'],
    tips: ['Panturrilha precisa de alto volume e carga elevada.', 'Foque no alongamento máximo no calcanhar.'],
    suggestedExercises: ['Gemeos em Pé', 'Gemeos Sentado', 'Elevacão de calcanhares no Leg Press'],
    warmup: 'Elevações sem peso (2x20)',
    commonMistakes: ['Fazer o movimento muito rápido e quicar']
  },
  biceps: {
    title: '💪 Bíceps',
    muscles: ['Bíceps Braquial', 'Braquial', 'Braquiorradial'],
    tips: ['Estabilize bem o cotovelo e evite balanço. O movimento sai da articulação do cotovelo apenas.', 'Foque na descida lenta.'],
    suggestedExercises: ['Rosca Direta com Barra W', 'Rosca Alternada', 'Rosca Martelo', 'Rosca Scott'],
    warmup: 'Alongamento de antebraço + rosca leve',
    commonMistakes: ['Balançar o tronco para subir o peso']
  },
  triceps: {
    title: '💪 Tríceps',
    muscles: ['Tríceps (Cabeça Longa, Lateral e Medial)'],
    tips: ['Tríceps compõe 2/3 do volume do braço.', 'Para a cabeça longa, faça exercícios acima da cabeça (ex: tríceps francês).'],
    suggestedExercises: ['Tríceps Polia Crossover', 'Tríceps Testa', 'Tríceps Francês', 'Tríceps Mergulho'],
    warmup: 'Aquecimento articular de cotovelos',
    commonMistakes: ['Abrir demais os cotovelos', 'Meia repetição sem prender o cotovelo']
  },
  ombros: {
    title: '🏔️ Deltóides (Ombros)',
    muscles: ['Deltóide Anterior', 'Lateral', 'Posterior'],
    tips: ['Desenvolvimento militar foca no deltóide anterior.', 'Elevações laterais constroem a "largura" do shape.'],
    suggestedExercises: ['Desenvolvimento com Halteres', 'Elevação Lateral', 'Crucifixo Invertido ou Facepull'],
    warmup: 'Rotação externa (2x15)',
    commonMistakes: ['Encolher o trapézio nas elevações']
  },
  core: {
    title: '🧱 Core (Abdômen e Lombar)',
    muscles: ['Reto Abdominal', 'Oblíquos', 'Eretores da Espinha'],
    tips: ['A dieta é que tira a gordura; o abdominal cria apenas suporte estrutural.', 'Prancha melhora estabilidade global.'],
    suggestedExercises: ['Prancha Frontal', 'Abdominal Infra na Paralela', 'Abdominal Supra', 'Treino Lombar (Hiperextensão)'],
    warmup: 'Dead bug (2x10)',
    commonMistakes: ['Puxar o pescoço em vez de contrair o músculo']
  },
  gluteos: {
    title: '🍑 Glúteos',
    muscles: ['Glúteo Máximo', 'Glúteo Médio'],
    tips: ['Hip Thrust é imperativo.', 'Mantenha o olhar pra frente na elevação.'],
    suggestedExercises: ['Hip Thrust (Elevação Pélvica)', 'Agachamento Sumô', 'Levantamento Terra Romeno', 'Abdução Máquina'],
    warmup: 'Clam shell (2x15)',
    commonMistakes: ['Hiperextensão da lombar']
  }
};

export function analyzeMuscleGroup(muscleId) {
  const normalizedId = muscleId?.toLowerCase()?.replace('ô', 'o')?.replace('é', 'e')?.replace('í', 'i');
  
  const groupMap = {
    'peito': 'peito', 'peitoral': 'peito',
    'costas': 'costas', 'dorsal': 'costas',
    'pernas': 'quadriceps', 'quadriceps': 'quadriceps',
    'posteriores': 'posteriores', 'isquiotibiais': 'posteriores',
    'panturrilhas': 'panturrilhas', 'panturrilha': 'panturrilhas',
    'bracos': 'biceps', 'biceps': 'biceps', 'triceps': 'triceps', 'antebraco': 'biceps',
    'ombros': 'ombros', 'deltoides': 'ombros',
    'core': 'core', 'abdomen': 'core', 'abdominal': 'core',
    'gluteos': 'gluteos', 'gluteo': 'gluteos',
  };
  
  const key = groupMap[normalizedId] || normalizedId;
  return MUSCLE_DATABASE[key] || {
    title: '🔍 Análise Muscular', muscles: [], tips: ['Selecione um músculo no atlas.'], suggestedExercises: [], warmup: '', commonMistakes: []
  };
}

export function generateAIFeedback(student) {
  let feedback = [];
  if (!student) return feedback;
  if (student.weight && student.height) {
    const imc = student.weight / Math.pow(student.height / 100, 2);
    if (imc > 30) feedback.push('📊 IMC: Obesidade. A IA sugere exercícios combinados + reeducação alimentar forte.');
    else if (imc > 25) feedback.push('📊 IMC: Sobrepeso. Combine treinos de força com HIIT moderado.');
    else if (imc < 18.5) feedback.push('📊 IMC: Baixo peso. Priorize exercícios compostos com hipertrofia.');
    else feedback.push('✅ IMC: Ideal! Foque na constância, progressão de carga, e refinamento muscular.');
  }
  return feedback;
}

import { supabase } from './supabaseClient'; // import Supabase para tabelas custom

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeAIDay(day) {
  const normalized = String(day || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const days = {
    segunda: 'Segunda', monday: 'Segunda',
    'segunda-feira': 'Segunda',
    terca: 'Terça', terça: 'Terça', tuesday: 'Terça',
    'terca-feira': 'Terça', 'terça-feira': 'Terça',
    quarta: 'Quarta', wednesday: 'Quarta',
    'quarta-feira': 'Quarta',
    quinta: 'Quinta', thursday: 'Quinta',
    'quinta-feira': 'Quinta',
    sexta: 'Sexta', friday: 'Sexta',
    'sexta-feira': 'Sexta',
    sabado: 'Sábado', sábado: 'Sábado', saturday: 'Sábado',
    domingo: 'Domingo', sunday: 'Domingo',
  };

  return days[normalized] || 'Geral';
}

function formatAIDayForMessage(day) {
  const days = {
    Segunda: 'segunda-feira',
    Terça: 'terça-feira',
    Quarta: 'quarta-feira',
    Quinta: 'quinta-feira',
    Sexta: 'sexta-feira',
    Sábado: 'sábado',
    Domingo: 'domingo',
  };

  return days[day] || String(day || '').toLowerCase();
}

function getPowerFitTodayContext(date = new Date()) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const currentWeekday = normalizeAIDay(parts.weekday);

  return {
    currentDate: `${parts.year}-${parts.month}-${parts.day}`,
    displayDate: `${parts.day}/${parts.month}/${parts.year}`,
    currentWeekday,
    currentWeekdayLabel: formatAIDayForMessage(currentWeekday),
  };
}

function getWorkoutDay(workout = {}) {
  return normalizeAIDay(workout.day || workout.dayOfWeek || workout.day_of_week);
}

function formatWorkoutExercises(workout = {}, limit = 6) {
  if (!Array.isArray(workout.exercises) || workout.exercises.length === 0) return 'sem exercícios detalhados';

  return workout.exercises.slice(0, limit).map(ex => {
    const sets = ex.sets ? `${ex.sets}x` : '';
    const reps = ex.reps || '';
    return `${ex.name}${sets || reps ? ` (${sets}${reps})` : ''}`;
  }).join(', ');
}

function isTodayWorkoutQuestion(message) {
  const normalized = normalizeAIText(message);

  if (/(monte|crie|gere|passe|quero|fazer|montar).*treino/.test(normalized)) return false;

  return /\bhoje\b/.test(normalized)
    && /\btrein/.test(normalized)
    && /(qual|quais|que|tenho|tem|meu|minha|agenda|programado)/.test(normalized);
}

function normalizeAIText(message) {
  return String(message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const WEEKDAY_REGEX = /\b(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)\b/i;
const WORKOUT_REQUEST_REGEX = /(me passe|me de|me monte|monte.*treino|crie.*treino|gere.*treino|montar.*treino|fazer.*treino|quero um treino|me d[áa] um treino|faça.*treino|faca.*treino)/;

function classifyAIIntent(message) {
  const normalized = normalizeAIText(message);
  if (isTodayWorkoutQuestion(message)) return 'answer_today_workout';
  if (WEEKDAY_REGEX.test(message)) return 'schedule_workout';
  if (WORKOUT_REQUEST_REGEX.test(normalized)) return 'create_workout';
  if (/\b(qual|como|quando|porque|por que|estou|posso|devo|dica|evolu|progresso|medid|peso|treino|agenda)\b/.test(normalized)) return 'answer_question';
  return 'answer_question';
}

function hasMedicalSafetyTopic(message) {
  const normalized = normalizeAIText(message);
  const hasPainOrInjury = /(dor|lesao|lesionado|machuquei|machucado|tendinite|hernia|reabilita|inflam|torci|rompi|ruptura|diagnostico|medico|fisioterapeuta)/.test(normalized);
  const asksSupplementDosage = /(dosagem|dose|quantos?|quanto|gramas?|mg|ml).*(creatina|whey|suplemento|termogenico|cafeina|remedio|medicamento)|(creatina|whey|suplemento|termogenico|cafeina).*(dosagem|dose|quantos?|quanto|gramas?|mg|ml)/.test(normalized);
  const asksClinicalNutrition = /(plano alimentar|cardapio|dieta exata|calorias exatas|macros? exatos?|dieta clinica|restricao alimentar)/.test(normalized);
  const mentionsClinicalCondition = /(pressao|diabetes|cardiaco|doenca)/.test(normalized);

  return hasPainOrInjury || asksSupplementDosage || asksClinicalNutrition || mentionsClinicalCondition;
}

function sanitizeChatHistory(chatHistory = [], includeSafetyHistory = false) {
  return chatHistory
    .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content && String(m.content).trim() !== '')
    .filter(m => includeSafetyHistory || !hasMedicalSafetyTopic(m.content))
    .slice(-8)
    .map(m => ({
      role: m.role,
      content: String(m.content).trim()
    }));
}

async function fetchStudentAIWorkouts(student) {
  const studentId = student?.id || student?.studentId || student?.student_id;
  if (!studentId) return [];

  try {
    const storage = await import('./storage');
    const canonicalId = storage.getCanonicalStudentId(student, student?.email) || studentId;
    return await storage.fetchWorkoutsForStudent(canonicalId, student?.personalId || student?.personal_id, student?.email);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[PowerFit AI] Local workout context warning:', error);
    return [];
  }
}

function formatTodayWorkoutAnswer(name, todayContext, workouts = []) {
  const todayWorkouts = workouts.filter(workout => getWorkoutDay(workout) === todayContext.currentWeekday);

  if (todayWorkouts.length === 0) {
    return `${name}, hoje é ${todayContext.currentWeekdayLabel} (${todayContext.displayDate}) e não encontrei nenhum treino agendado para hoje no seu plano.

Confira "Meus Treinos" ou a agenda para ver os próximos treinos.`;
  }

  const workoutList = todayWorkouts.map((workout, index) => (
    `${index + 1}. ${workout.name || 'Treino sem nome'}\nExercícios: ${formatWorkoutExercises(workout)}`
  )).join('\n\n');

  return `${name}, hoje é ${todayContext.currentWeekdayLabel} (${todayContext.displayDate}). Seu treino de hoje é:

${workoutList}

Siga exatamente o treino atribuído no PowerFit e ajuste carga/execução com segurança.`;
}

function formatKnownValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return 'não informado';
  return `${value}${suffix}`;
}

function formatLatestEvolution(evolution = {}) {
  if (!evolution || Object.keys(evolution).length === 0) return 'Nenhuma medição de evolução registrada.';

  const metrics = [
    ['Data', evolution.date || evolution.createdAt],
    ['Peso', evolution.weight ? `${evolution.weight}kg` : null],
    ['Gordura corporal', evolution.bodyFat ? `${evolution.bodyFat}%` : null],
    ['Peito', evolution.chest ? `${evolution.chest}cm` : null],
    ['Cintura', evolution.waist ? `${evolution.waist}cm` : null],
    ['Quadril', evolution.hip ? `${evolution.hip}cm` : null],
    ['Coxa', evolution.thigh ? `${evolution.thigh}cm` : null],
    ['Braço', evolution.arm ? `${evolution.arm}cm` : null],
    ['Pernas', evolution.legs ? `${evolution.legs}cm` : null],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');

  return metrics.length > 0
    ? metrics.map(([label, value]) => `${label}: ${value}`).join('; ')
    : 'Nenhuma métrica numérica registrada na última medição.';
}

function formatWorkoutContext(workouts = [], todayContext = null) {
  if (!Array.isArray(workouts) || workouts.length === 0) return 'Nenhum treino atribuído encontrado.';

  return workouts.slice(0, 8).map(workout => {
    const exercises = formatWorkoutExercises(workout, 5);
    const day = getWorkoutDay(workout);
    const todayMarker = todayContext && day === todayContext.currentWeekday ? ' | HOJE' : '';

    return `- ${workout.name || 'Treino sem nome'} | Dia: ${day}${todayMarker} | Categoria: ${workout.category || 'não informada'} | Exercícios: ${exercises}`;
  }).join('\n');
}

function getProfessionalBoundaryResponse(message, name) {
  if (!hasMedicalSafetyTopic(message)) return null;

  return `${name}, para essa pergunta eu preciso ser cuidadoso.

Não posso definir diagnóstico, liberar treino pesado com dor, montar plano nutricional clínico ou indicar dosagem exata de suplemento/remédio pelo chat.

O mais seguro é consultar um profissional qualificado:
- Fisioterapeuta ou médico para dor, lesão ou liberação de treino.
- Nutricionista ou médico para plano alimentar específico e dosagem de suplementos.

Como orientação geral: se existe dor no joelho, evite treinar pesado essa região até ser avaliado. Posso te ajudar com ajustes gerais de treino sem dor e perguntas de fitness gerais. 💪`;
}

function translateBodyTargets(targets = []) {
  return targets.map(t => {
     const map = {
       'trapezius': 'Trapézio', 'chest': 'Peito', 'abs': 'Abdômen', 'obliques': 'Oblíquos',
       'front-deltoids': 'Ombros Frontais', 'biceps': 'Bíceps', 'forearm': 'Antebraços', 'quadriceps': 'Quadríceps',
       'upper-back': 'Dorsal', 'lower-back': 'Lombar', 'back-deltoids': 'Ombros Traseiros', 'triceps': 'Tríceps',
       'gluteal': 'Glúteos', 'hamstring': 'Posterior de Coxa', 'calves': 'Panturrilhas'
     };
     return map[t] || t;
  });
}

function fallbackNormalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getFallbackStudentId(student = {}) {
  return student?.id || student?.studentId || student?.student_id || null;
}

function getStoredBodyTargets(student = {}) {
  if (Array.isArray(student?.target_muscles) && student.target_muscles.length > 0) return student.target_muscles;
  if (Array.isArray(student?.targetMuscles) && student.targetMuscles.length > 0) return student.targetMuscles;
  if (typeof window === 'undefined') return [];

  try {
    const studentId = getFallbackStudentId(student);
    const keys = [
      studentId ? `powerfit_atlas_targets_${studentId}` : null,
      fallbackNormalizeEmail(student?.email) ? `powerfit_atlas_targets_${fallbackNormalizeEmail(student.email)}` : null,
      'powerfit_atlas_targets',
    ].filter(Boolean);

    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[PowerFit AI] Body target fallback warning:', error);
  }

  return [];
}

function formatScheduleContext(scheduleEvents = []) {
  if (!Array.isArray(scheduleEvents) || scheduleEvents.length === 0) return 'Nenhum evento de agenda encontrado.';

  return scheduleEvents
    .filter(event => event?.date)
    .slice(0, 5)
    .map(event => `- ${event.title || event.tittle || 'Evento'} | Data: ${event.date}${event.time ? ` às ${event.time}` : ''}`)
    .join('\n') || 'Nenhum evento de agenda encontrado.';
}

async function loadAIAgentContext(student, todayContext) {
  let resolvedStudent = student;
  let targets;
  let workouts;
  let evolutionRows = [];
  let scheduleEvents = [];

  try {
    const storage = await import('./storage');
    resolvedStudent = typeof storage.resolveStudentProfileForAuthUser === 'function'
      ? await storage.resolveStudentProfileForAuthUser({ ...student, type: 'aluno' }, { persist: false }) || student
      : student;
    targets = typeof storage.getStudentVisibleBodyTargets === 'function'
      ? storage.getStudentVisibleBodyTargets(resolvedStudent)
      : getStoredBodyTargets(resolvedStudent);
    workouts = await storage.fetchWorkoutsForStudent(
      getFallbackStudentId(resolvedStudent),
      resolvedStudent?.personalId || resolvedStudent?.personal_id,
      resolvedStudent?.email || student?.email
    );
    if (navigator.onLine && typeof storage.refreshScheduleFromSupabase === 'function') await storage.refreshScheduleFromSupabase();
    scheduleEvents = typeof storage.getStudentVisibleSchedule === 'function'
      ? storage.getStudentVisibleSchedule(resolvedStudent)
      : [];
    evolutionRows = typeof storage.getStudentVisibleEvolution === 'function'
      ? storage.getStudentVisibleEvolution(resolvedStudent)
      : [];
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[PowerFit AI] Agent context warning:', error);
    targets = getStoredBodyTargets(student);
    workouts = await fetchStudentAIWorkouts(student);
  }

  const translatedTargets = translateBodyTargets(targets);
  const todayWorkouts = todayContext
    ? workouts.filter(workout => getWorkoutDay(workout) === todayContext.currentWeekday)
    : [];

  return {
    student: resolvedStudent || student,
    targets,
    translatedTargets,
    workouts,
    evolutionRows,
    scheduleEvents,
    todayWorkouts,
  };
}

async function getStudentAIContext(student, translatedTargets, todayContext, agentContext = null) {
  const studentId = student?.id || student?.studentId || student?.student_id;
  const workouts = agentContext?.workouts || await fetchStudentAIWorkouts(student);
  let evolutionRows = agentContext?.evolutionRows || [];

  if (!agentContext?.evolutionRows) {
    try {
      const storage = await import('./storage');
      if (studentId && typeof storage.getStudentVisibleEvolution === 'function') evolutionRows = storage.getStudentVisibleEvolution(student);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[PowerFit AI] Local evolution context warning:', error);
    }
  }

  if (navigator.onLine && studentId && UUID_PATTERN.test(studentId)) {
    try {
      const storage = await import('./storage');
      const canonicalStudentId = typeof storage.getCanonicalStudentId === 'function'
        ? storage.getCanonicalStudentId(student, student?.email) || studentId
        : studentId;
      const { data, error } = await supabase
        .from('evolution')
        .select('*')
        .eq('studentId', canonicalStudentId)
        .order('date', { ascending: false })
        .limit(5);

      if (!error && Array.isArray(data) && data.length > 0) {
        const mergedById = new Map();
        [...evolutionRows, ...data].forEach(row => mergedById.set(row.id || `${row.date}-${row.createdAt}`, row));
        evolutionRows = [...mergedById.values()];
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[PowerFit AI] Remote evolution context warning:', error);
    }
  }

  const sortedEvolution = [...evolutionRows].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt || 0).getTime();
    const dateB = new Date(b.date || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const latestEvolution = sortedEvolution[0] || null;
  const recentEvolution = sortedEvolution.slice(0, 3).map(formatLatestEvolution).join('\n');
  const todayWorkouts = todayContext
    ? workouts.filter(workout => getWorkoutDay(workout) === todayContext.currentWeekday)
    : [];

  return `Dados reais do aluno no PowerFit:
- Nome: ${student?.name || 'não informado'}
- Objetivo: ${student?.objective || student?.goal || 'não informado'}
- Treinos por semana: ${formatKnownValue(student?.daysPerWeek, 'x')}
- Turno preferido: ${student?.shift || 'não informado'}
- Altura cadastrada: ${formatKnownValue(student?.height, 'cm')}
- Peso cadastrado no perfil: ${formatKnownValue(student?.weight, 'kg')}
- Focos corporais selecionados: ${translatedTargets.length > 0 ? translatedTargets.join(', ') : 'não informado'}
- Última evolução: ${formatLatestEvolution(latestEvolution)}
- Evoluções recentes: ${recentEvolution || 'Nenhuma evolução registrada.'}

Data atual informada pelo app:
- Data atual em São Paulo: ${todayContext?.displayDate || 'não informada'}
- Dia da semana atual: ${todayContext?.currentWeekday || 'não informado'} (${todayContext?.currentWeekdayLabel || 'não informado'})
- Treinos agendados para hoje: ${todayWorkouts.length > 0 ? todayWorkouts.map(workout => workout.name || 'Treino sem nome').join(', ') : 'nenhum treino encontrado para hoje'}

Treinos atribuídos atualmente:
${formatWorkoutContext(workouts, todayContext)}

Agenda do aluno:
${formatScheduleContext(agentContext?.scheduleEvents || [])}
`;
}

async function assignAIGeneratedWorkout(student, targets) {
  if (!student || typeof window === 'undefined') return null;
  try {
    const wStr = localStorage.getItem('powerfit_workouts');
    let allWs = wStr ? JSON.parse(wStr) : [];
    // Comportamento ADITIVO: não remove treinos anteriores da IA
    
    let exercises = [];
    let isFullBody = (!targets || targets.length === 0);
    
    // Proibido Full-Body se houver alvos
    if (!isFullBody) {
      targets.forEach(t => {
        // Encontrar os recomendados baseados no dictionary
        const key = Object.keys(MUSCLE_DATABASE).find(k => MUSCLE_DATABASE[k].title.includes(t) || t.toLowerCase().includes(k.toLowerCase()));
        if (key && MUSCLE_DATABASE[key].suggestedExercises) {
           MUSCLE_DATABASE[key].suggestedExercises.slice(0, 2).forEach(ex => {
              exercises.push({ name: ex, reps: "10-12", sets: "4", weight: "" });
           });
        }
      });
      // Fallback
      if (exercises.length === 0) {
        exercises.push({ name: "Exercício Isolado Padrão AI", reps: "12", sets: "3", weight: "" });
      }
    } else {
      // Full Body Padrão
      exercises = [
        { name: "Agachamento ou Leg Press", reps: "10-12", sets: "4", weight: "" },
        { name: "Supino ou Flexão de Braço", reps: "10-12", sets: "4", weight: "" },
        { name: "Puxada Frente ou Remada", reps: "10-12", sets: "4", weight: "" },
        { name: "Elevação Lateral (Ombros)", reps: "15", sets: "3", weight: "" },
        { name: "Rosca Direta (Bíceps)", reps: "12", sets: "3", weight: "" },
        { name: "Tríceps Polia ou Banco", reps: "12", sets: "3", weight: "" },
        { name: "Abdômen Prancha Isométrica", reps: "45 seg", sets: "3", weight: "" }
      ];
    }
    
    const now = new Date().toISOString();
    const studentId = student.id || student.studentId || student.student_id || null;
    const newW = {
      id: crypto.randomUUID(),
      personalId: student.personalId || student.personal_id || null,
      studentId,
      assignedTo: studentId,
      name: `Treino Especial da IA ${isFullBody ? '(Full-Body)' : '(Alvo 3D)'}`,
      description: isFullBody ? "Misto englobando o corpo todo." : `Foco em: ${targets.join(', ')}`,
      category: "Hipertrofia & Definição",
      exercises: exercises,
      isAI: true,
      aiGenerated: true,
      source: 'student_ai',
      createdBy: 'student_ai',
      generatedBy: 'student_ai',
      notes: 'source:student_ai',
      createdAt: now,
      updatedAt: now,
    };
    allWs.push(newW);
    localStorage.setItem('powerfit_workouts', JSON.stringify(allWs));

    if (navigator.onLine) {
      const { error } = await supabase.from('workouts').upsert({
        id: newW.id,
        personalId: newW.personalId,
        name: newW.name,
        description: newW.description,
        category: newW.category,
        exercises: newW.exercises,
        notes: newW.notes,
        assigned_to: newW.assignedTo,
        createdAt: newW.createdAt,
        updatedAt: newW.updatedAt,
      });
      if (error) throw error;
    }
    
    const sStr = localStorage.getItem('powerfit_students');
    let allSts = [];
    try {
      allSts = sStr ? JSON.parse(sStr) : [];
    } catch {
      allSts = [];
    }
    const idx = allSts.findIndex(s => s.id === student.id || s.id === student.studentId);
    if (idx !== -1) {
      if(!allSts[idx].workoutIds) allSts[idx].workoutIds = [];
      if(!allSts[idx].workoutIds.includes(newW.id)) {
        allSts[idx].workoutIds.push(newW.id);
        localStorage.setItem('powerfit_students', JSON.stringify(allSts));
      }
    }
    return newW.id;
  } catch (e) { if (import.meta.env.DEV) console.error('Erro ao injetar treino da IA:', e); return null; }
}

export async function generateSmartResponse(userMessage, student, chatHistory = []) {
  const todayContext = getPowerFitTodayContext();
  const intent = classifyAIIntent(userMessage);
  let name = student?.name?.split(' ')[0] || 'Atleta';
  const professionalBoundaryResponse = getProfessionalBoundaryResponse(userMessage, name);
  if (professionalBoundaryResponse) return professionalBoundaryResponse;

  const agentContext = await loadAIAgentContext(student, todayContext);
  const activeStudent = agentContext.student || student;
  name = activeStudent?.name?.split(' ')[0] || name;

  const targets = agentContext.targets;
  const translatedTargets = agentContext.translatedTargets;

  if (intent === 'answer_today_workout') {
    return formatTodayWorkoutAnswer(name, todayContext, agentContext.workouts);
  }

  const diaEncontrado = userMessage.match(WEEKDAY_REGEX);
  
  if (intent === 'schedule_workout' && diaEncontrado) {
    if (!activeStudent) return 'Não consegui identificar seu perfil para o agendamento!';
    const rawDay = diaEncontrado[0].toLowerCase();
    const capDay = normalizeAIDay(rawDay);
    
    // Obter ultimo treino de IA do aluno
    const sStr = localStorage.getItem('powerfit_students');
    const allSts = sStr ? JSON.parse(sStr) : [];
    const mod = await import('./storage');
    const normalizeEmail = typeof mod.normalizeEmail === 'function' ? mod.normalizeEmail : fallbackNormalizeEmail;
    const canonicalStudentId = typeof mod.getCanonicalStudentId === 'function'
      ? mod.getCanonicalStudentId(activeStudent, activeStudent?.email) || getFallbackStudentId(activeStudent)
      : getFallbackStudentId(activeStudent);
    const sData = allSts.find(s => s.id === canonicalStudentId || normalizeEmail(s.email) === normalizeEmail(activeStudent?.email));
    
    let lastAiId = null;
    if (sData?.workoutIds?.length) {
      const allWStr = localStorage.getItem('powerfit_workouts');
      const allWs = allWStr ? JSON.parse(allWStr) : [];
      const myWorks = allWs.filter(w =>
        sData.workoutIds.includes(w.id) &&
        (
          w.isAI === true ||
          w.aiGenerated === true ||
          w.source === 'student_ai' ||
          w.createdBy === 'student_ai' ||
          w.generatedBy === 'student_ai' ||
          String(w.notes || '').includes('source:student_ai') ||
          String(w.name || '').includes('Treino Especial da IA')
        )
      );
      if (myWorks.length > 0) lastAiId = myWorks[myWorks.length - 1].id;
    }
    
    if (lastAiId) {
      await mod.assignWorkoutToStudent(lastAiId, canonicalStudentId, capDay, true);
      window.dispatchEvent(new CustomEvent('powerfit:weekly-schedule-updated'));
      return `Feito! Seu treino ficou agendado para ${formatAIDayForMessage(capDay)} e já vai aparecer em "Meus Treinos".

Mais alguma dúvida?`;
    }
  }

  if (intent === 'create_workout') {
    await assignAIGeneratedWorkout(activeStudent, translatedTargets);
    return `Criei um treino personalizado para você.

Agora me diga em qual dia da semana você quer agendar esse treino.
Exemplo: segunda, quarta ou sexta.`;
  }

  // Contexto muscular com instrução forçada
  let muscleInstruction = '';
  if (translatedTargets.length > 0) {
    muscleInstruction = `USUÁRIO SELECIONOU [${translatedTargets.join(', ')}]. GERE TREINO APENAS PARA ELES.\n`;
  }

  const targetText = translatedTargets.length > 0 
    ? `O usuário marcou os seguintes músculos no seu Atlas Anatômico como focos principais: ${translatedTargets.join(', ')}.` 
    : 'O usuário ainda não selecionou focos musculares no Atlas Anatômico.';

  let imcText = '';
  if (activeStudent?.weight && activeStudent?.height) {
     const w = Number(activeStudent.weight);
     const h = Number(activeStudent.height);
     if (w > 0 && h > 0) {
       const imc = (w / Math.pow(h / 100, 2)).toFixed(1);
       imcText = `O usuário pesa ${w}kg e tem ${h}cm de altura. Seu IMC é ${imc}.`;
     }
  }

  const studentContext = await getStudentAIContext(activeStudent, translatedTargets, todayContext, agentContext);

  const systemPrompt = `${muscleInstruction}You are an expert personal trainer assistant. You have access to the student's fitness data and can give personalized workout and general nutrition advice. For specific medical, clinical nutrition, or injury-related questions, always recommend the student consult a qualified professional such as a nutritionist, doctor, or physiotherapist.

Você é a IA PowerFit, uma assistente especialista em personal training, direta, profissional e motivadora.
Você está conversando com o(a) atleta: ${name}.
${imcText}
${targetText}

${studentContext}

Regras obrigatórias:
1. Responda sempre em português do Brasil.
2. Use os dados reais do aluno acima para personalizar a resposta. Não invente peso, percentual de gordura, medidas, treinos, lesões ou condições médicas.
3. Quando o aluno perguntar sobre evolução, progresso, medidas ou resultados, cite os números reais da última evolução disponível, como peso, gordura corporal, peito, cintura, quadril, coxa, braço ou pernas. Se não houver dados, diga que ainda não há medições registradas.
4. Para dicas gerais de treino, fitness, motivação, hidratação e recuperação, responda livremente como personal trainer.
5. Para nutrição básica e dicas gerais de dieta, dê orientação geral, sem montar plano alimentar clínico, sem prescrever dietas restritivas e sem calcular protocolo individual fechado.
6. Para plano nutricional específico, condição médica, dor, lesão, diagnóstico, reabilitação ou dosagem de suplemento/remédio, recomende consultar um profissional qualificado, como nutricionista, médico ou fisioterapeuta. Não informe doses numéricas ou protocolos exatos para suplementos/remédios.
7. Seja objetivo: o usuário está num chat mobile. Use parágrafos curtos e, quando útil, bullets simples.
8. Se o usuário pedir para montar um treino e não usou as palavras "monte um treino", encoraje-o a solicitar claramente esses termos para que o treino apareça em "Meus Treinos".
9. Quando perguntarem sobre atlas, alvo 3D ou focos corporais, use os focos corporais do contexto.
10. DIRETIVA DE NEGATIVIDADE ESTRITA: VOCÊ NÃO PODE GERAR TREINOS FULL BODY quando houver músculos selecionados no Alvo 3D. Se houver músculos selecionados, foque APENAS neles.
11. Para perguntas como "Qual treino tenho hoje?", use somente o dia da semana atual fornecido pelo app em "Data atual informada pelo app". Compare esse dia com os treinos atribuídos/agendados. Se houver treino marcado para esse dia, responda com esse treino. Se não houver, diga claramente que não há treino agendado para hoje e sugira conferir "Meus Treinos" ou a agenda. Não use segunda-feira ou qualquer outro dia como fallback.
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('AI_AUTH_REQUIRED');

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message: userMessage,
        systemPrompt: String(systemPrompt).trim(),
        chatHistory: sanitizeChatHistory(chatHistory, hasMedicalSafetyTopic(userMessage))
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
       throw new Error(`AI chat endpoint error: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.ok || !data?.message) throw new Error(data?.errorCode || 'AI chat endpoint empty response');
    return data.message;

  } catch (error) {
    if (import.meta.env.DEV) console.error('PowerFit AI chat fallback:', error.message);
    
    // 4. Fallback inteligente: usa MUSCLE_DATABASE se houver targets
    if (translatedTargets.length > 0) {
      const muscleKeys = targets.map(t => {
        const reverseMap = {
          'chest': 'peito', 'upper-back': 'costas', 'quadriceps': 'quadriceps',
          'hamstring': 'posteriores', 'calves': 'panturrilhas', 'biceps': 'biceps',
          'triceps': 'triceps', 'front-deltoids': 'ombros', 'back-deltoids': 'ombros',
          'abs': 'core', 'obliques': 'core', 'gluteal': 'gluteos',
          'trapezius': 'costas', 'lower-back': 'core', 'forearm': 'biceps'
        };
        return reverseMap[t];
      }).filter(Boolean);
      
      const uniqueKeys = [...new Set(muscleKeys)];
      let fallbackParts = [`💪 ${name}, vi que você está focando em **${translatedTargets.join(', ')}**!\n`];
      
      uniqueKeys.slice(0, 3).forEach(key => {
        const data = MUSCLE_DATABASE[key];
        if (data) {
          fallbackParts.push(`\n**${data.title}:**`);
          fallbackParts.push(`• Exercícios: ${data.suggestedExercises.slice(0, 3).join(', ')}`);
          if (data.tips[0]) fallbackParts.push(`• Dica: ${data.tips[0]}`);
        }
      });
      
      fallbackParts.push(`\n\n🔥 Quer um treino completo? Diga: **"monte um treino"**`);
      return fallbackParts.join('\n');
    }
    
    return `💡 ${name}, dica rápida: Foque na execução lenta para maximizar a hipertrofia. O tempo sob tensão é o principal driver de crescimento muscular! 💪\n\n🏋️ Quer um treino personalizado? Diga: **"monte um treino"** 🔥`;
  }
}
