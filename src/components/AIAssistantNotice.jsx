import { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';

export default function AIAssistantNotice({ student, workouts, evolution }) {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const targets = student?.targetMuscles || [];
    const goal = student?.objective || 'Hipertrofia';

    let tips = [
      "Excelente evolução essa semana! Mantenha o ritmo constante.",
      "Identifiquei que você tem treinado bastante, não se esqueça do descanso vital!",
      `O seu foco selecionado é ${goal}. Lembre-se de manter sua dieta alinhada a esse objetivo para maximizar resultados.`
    ];

    if (targets.length > 0) {
      const randomTarget = targets[Math.floor(Math.random() * targets.length)];
      tips.push(`No seu Mapa Corporal, você selecionou ${randomTarget}. Lembre-se de intensificar o treino dessa área!`);
      tips.push(`Você destacou ${randomTarget} no seu Alvo 3D. Que tal priorizar os exercícios focados nessa região hoje?`);
    } else {
      tips.push("Personalize seu Mapa Corporal 3D (no menu lateral) para receber dicas direcionadas aos seus músculos alvo!");
    }

    setNotice(tips[Math.floor(Math.random() * tips.length)]);
  }, [student, workouts, evolution]);

  if (!notice) return null;

  return (
    <div className="card animate-slide-up" style={{ 
      padding: '16px 24px', 
      marginBottom: '24px', 
      background: 'linear-gradient(90deg, rgba(255,107,53,0.1) 0%, rgba(59,130,246,0.1) 100%)',
      border: '1px solid rgba(255,107,53,0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', right: '-10px', top: '-20px', opacity: 0.05, transform: 'rotate(15deg)' }}>
        <Bot size={140} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'var(--gradient-primary)', padding: '12px', borderRadius: '50%', flexShrink: 0 }}>
          <Sparkles size={24} color="white" />
        </div>
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            Visão da IA PowerFit <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Premium</span>
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.4' }}>
            {notice}
          </p>
        </div>
      </div>
    </div>
  );
}
