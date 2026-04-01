import { useState, useEffect } from 'react';
import { Bot, X, Sparkles, Dumbbell } from 'lucide-react';
import { analyzeMuscleGroup } from '../lib/ai-engine';

export default function AIChatBubble({ selectedMuscle, onClose }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (selectedMuscle) {
      setLoading(true);
      // Simula um "raciocínio" para dar feeling de IA
      const timer = setTimeout(() => {
        setData(analyzeMuscleGroup(selectedMuscle));
        setLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [selectedMuscle]);

  if (!selectedMuscle) return null;

  return (
    <div className="ai-chat-bubble animate-fade-in" style={{
      position: 'absolute',
      bottom: '80px',
      right: '20px',
      width: '300px',
      background: 'rgba(20, 20, 25, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.95rem' }}>
          <Bot size={18} /> IA PowerFit
        </h4>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Sparkles size={16} className="animate-pulse" /> Processando {selectedMuscle}...
        </div>
      ) : data ? (
        <div className="ai-content" style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h5 style={{ fontSize: '1rem', color: 'white' }}>{data.title}</h5>
          
          <div>
            <strong style={{ color: 'var(--primary)' }}>💡 Dicas da IA:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {data.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
            </ul>
          </div>
          
          {data.suggestedExercises.length > 0 && (
            <div style={{ marginTop: '4px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><Dumbbell size={14}/> Exercícios Sugeridos:</strong>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {data.suggestedExercises.map((ex, idx) => (
                  <span key={idx} className="badge" style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(255, 107, 53, 0.2)', color: 'var(--primary)' }}>{ex}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
