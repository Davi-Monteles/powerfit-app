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
    title: '�� Bíceps',
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

function assignAIGeneratedWorkout(student) {
  if (!student || typeof window === 'undefined') return;
  try {
    const wStr = localStorage.getItem('powerfit_workouts');
    let allWs = wStr ? JSON.parse(wStr) : [];
    
    // Check if we already created an AI workout recently
    if(allWs.find(w => w.name.includes("Treino Especial da IA"))) return;
    
    // Construct real workout
    const newW = {
      id: "ai_" + Date.now().toString(),
      name: "Treino Especial da IA",
      description: "Planejado segundo as suas métricas e biotipo via Inteligência Artificial.",
      category: "Hipertrofia & Definição",
      exercises: [
        { name: "Agachamento ou Leg Press", reps: "10-12", sets: "4", weight: "" },
        { name: "Supino ou Flexão de Braço", reps: "10-12", sets: "4", weight: "" },
        { name: "Puxada Frente ou Remada", reps: "10-12", sets: "4", weight: "" },
        { name: "Elevação Lateral (Ombros)", reps: "15", sets: "3", weight: "" },
        { name: "Rosca Direta (Bíceps)", reps: "12", sets: "3", weight: "" },
        { name: "Tríceps Polia ou Banco", reps: "12", sets: "3", weight: "" },
        { name: "Abdômen Prancha Isométrica", reps: "45 seg", sets: "3", weight: "" }
      ]
    };
    allWs.push(newW);
    localStorage.setItem('powerfit_workouts', JSON.stringify(allWs));
    
    const sStr = localStorage.getItem('powerfit_students');
    let allSts = sStr ? JSON.parse(sStr) : [];
    const idx = allSts.findIndex(s => s.id === student.id);
    if (idx !== -1) {
      if(!allSts[idx].workoutIds) allSts[idx].workoutIds = [];
      if(!allSts[idx].workoutIds.includes(newW.id)) {
        allSts[idx].workoutIds.push(newW.id);
        localStorage.setItem('powerfit_students', JSON.stringify(allSts));
        window.dispatchEvent(new Event('storage'));
      }
    }
  } catch (e) { console.error('Erro ao injetar treino da IA:', e) }
}

export function generateSmartResponse(userMessage, student) {
  const lower = userMessage.toLowerCase();
  const name = student?.name?.split(' ')[0] || 'Atleta';
  
  if (lower.match(/(me passe|me de|me monte|montar.*treino|fazer.*treino|quero um treino|me dá um treino)/)) {
    assignAIGeneratedWorkout(student);
    return `Eu acabei de gerar um **Treino Full-Body Especializado da IA** para você, ${name}!\n\nAcabei de **atribuir este treino diretamente no seu painel (Aba Meus Treinos)**. Pode conferir lá! \n\nEle foi elaborado priorizando estímulos base na hipertrofia com carga moderada. Lembre-se: por ser IA, caso você precise de ajustes profundos para lesões, comunique um Personal Trainer da equipe PowerFit para adaptações clínicas! 💪`;
  }
  
  if (lower.match(/(oi|olá|ola|hey|bom dia|boa noite)/)) {
    return 'Fala, Atleta! 🔥 Como posso te ajudar a destruir nos treinos hoje? Você já viu o treino que montei no painel? Se não, diga: "Me monte um treino"';
  }

  // Fallback to standard
  return `Fala ${name}! Estou processando seu feedback. Pela sua solicitação inicial: Se precisar que eu gere um treino automático, apenas diga "Me monte um treino". Para dicas musculares isoladas, vá na tela do Atlas Anatômico e marque: bíceps, glúteos, peito, quadríceps, etc. O que mandam hoje? 💪`;
}
