import { useMemo } from 'react';
import { Bot, Sparkles, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AIAssistantNotice({ student, workouts, evolution, onClick }) {
  const hasProAccess = student?.isPremium === true;
  const navigate = useNavigate();

  const handleNoticeClick = (e) => {
    if (!hasProAccess) {
      navigate('/upgrade');
    } else {
      if (onClick) onClick(e);
    }
  };

  const notice = useMemo(() => {
    const targets = student?.targetMuscles || student?.target_muscles || [];
    const goal = student?.objective || 'Hipertrofia';

    const tips = [
      "Excelente evolução essa semana! Mantenha o ritmo constante.",
      "Identifiquei que você tem treinado bastante, não se esqueça do descanso vital!",
      `O seu foco selecionado é ${goal}. Lembre-se de manter sua dieta alinhada a esse objetivo para maximizar resultados.`
    ];

    if (targets.length > 0) {
      const targetIndex = Math.abs(String(student?.id || student?.email || '').length + workouts.length + evolution.length) % targets.length;
      const randomTarget = targets[targetIndex];
      tips.push(`No seu Mapa Corporal, você selecionou ${randomTarget}. Lembre-se de intensificar o treino dessa área!`);
      tips.push(`Você destacou ${randomTarget} no seu Alvo 3D. Que tal priorizar os exercícios focados nessa região hoje?`);
    } else {
      tips.push("Personalize seu Mapa Corporal 3D para receber dicas direcionadas!");
    }

    const key = `${student?.id || student?.email || ''}:${goal}:${targets.join(',')}:${workouts.length}:${evolution.length}`;
    const hash = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return tips[hash % tips.length];
  }, [student?.id, student?.email, student?.objective, student?.targetMuscles, student?.target_muscles, workouts.length, evolution.length]);

  if (!notice) return null;

  return (
    <div 
      onClick={handleNoticeClick}
      className={`card animate-slide-up ${hasProAccess ? 'cursor-pointer' : 'cursor-pointer'}`}
      style={{ 
        background: hasProAccess
          ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)' 
          : 'rgba(255, 255, 255, 0.05)', 
        border: "1px solid " + (hasProAccess ? 'rgba(34, 211, 238, 0.3)' : 'rgba(255, 255, 255, 0.1)'),
        position: 'relative',
        overflow: 'hidden',
        padding: '20px',
        marginBottom: '24px',
        filter: hasProAccess ? 'none' : 'grayscale(1)',
        opacity: hasProAccess ? 1 : 0.7,
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '12px', 
          background: hasProAccess ? 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)' : '#4b5563',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: hasProAccess ? '0 4px 12px rgba(6, 182, 212, 0.2)' : 'none',
          flexShrink: 0
        }}>
          {hasProAccess ? <Sparkles color="white" size={24} /> : <Lock color="white" size={20} />}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: hasProAccess ? '#67e8f9' : 'var(--text-muted)' }}>
              PowerFit AI {hasProAccess && <span style={{ fontSize: '0.65rem', background: 'rgba(34, 211, 238, 0.2)', padding: '1px 6px', borderRadius: '8px', color: '#cffafe', marginLeft: '4px' }}>BETA</span>}
            </h4>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
            {hasProAccess
              ? (notice || "Sua assistente pessoal está pronta para analisar seu treino e sugerir ajustes.")
              : "Funcionalidade exclusiva para alunos PRO. Clique para ativar."}
          </p>
        </div>
        
        {hasProAccess && <Bot size={24} style={{ opacity: 0.2, color: '#22d3ee' }} />}
      </div>
    </div>
  );
}
