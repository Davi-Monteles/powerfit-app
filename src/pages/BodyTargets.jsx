import React, { useState } from 'react';
import { ArrowLeft, Save, RefreshCw, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Model from 'react-body-highlighter';
import { fetchSupabaseRowByEmail, getCurrentUser, getStudentVisibleBodyTargets, resolveStudentProfileFromCache } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../lib/app-context';

// Mapeamento dos músculos nativos da react-body-highlighter
// Adicionado trapézio no front para que o usuário possa selecionar via lista se estiver vendo de frente
const muscleGroupsFront = [
  { id: 'trapezius', name: 'Trapézio' },
  { id: 'chest', name: 'Peito' },
  { id: 'abs', name: 'Abdômen' },
  { id: 'obliques', name: 'Oblíquos' },
  { id: 'front-deltoids', name: 'Ombros Frontais' },
  { id: 'biceps', name: 'Bíceps' },
  { id: 'forearm', name: 'Antebraços' },
  { id: 'quadriceps', name: 'Quadríceps' },
];

const muscleGroupsBack = [
  { id: 'trapezius', name: 'Trapézio' },
  { id: 'upper-back', name: 'Dorsal / Costas Altas' },
  { id: 'lower-back', name: 'Lombar' },
  { id: 'back-deltoids', name: 'Ombros Traseiros' },
  { id: 'triceps', name: 'Tríceps' },
  { id: 'gluteal', name: 'Glúteos' },
  { id: 'hamstring', name: 'Posterior de Coxa' },
  { id: 'calves', name: 'Panturrilhas' }
];

const atlasAccent = '#FF6B35';
const atlasAccentMuted = 'rgba(255, 107, 53, 0.18)';
const atlasAccentText = '#FFB08A';
const atlasBodyColor = '#64748B';

const nativeMuscleIds = new Set([
  'trapezius',
  'upper-back',
  'lower-back',
  'chest',
  'biceps',
  'triceps',
  'forearm',
  'back-deltoids',
  'front-deltoids',
  'abs',
  'obliques',
  'adductor',
  'hamstring',
  'quadriceps',
  'abductors',
  'calves',
  'gluteal',
  'head',
  'neck',
  'knees',
  'left-soleus',
  'right-soleus',
]);

const atlasGroupMuscles = {
  trapezius: ['trapezius', 'neck'],
  chest: ['chest'],
  abs: ['abs'],
  obliques: ['obliques'],
  'front-deltoids': ['front-deltoids'],
  biceps: ['biceps'],
  forearm: ['forearm'],
  quadriceps: ['quadriceps'],
  'upper-back': ['upper-back'],
  'lower-back': ['lower-back'],
  'back-deltoids': ['back-deltoids'],
  triceps: ['triceps'],
  gluteal: ['gluteal'],
  hamstring: ['hamstring'],
  calves: ['calves'],
};

const groupIdsByMuscle = Object.entries(atlasGroupMuscles).reduce((map, [groupId, muscles]) => {
  muscles.forEach((muscle) => {
    if (!map[muscle]) map[muscle] = groupId;
  });
  return map;
}, {});

const normalizeSelectedGroups = (groups) => {
  if (!Array.isArray(groups)) return [];

  return [...new Set(groups.map((groupId) => {
    if (atlasGroupMuscles[groupId]) return groupId;
    if (groupIdsByMuscle[groupId]) return groupIdsByMuscle[groupId];
    return nativeMuscleIds.has(groupId) ? groupId : null;
  }).filter(Boolean))];
};

const expandSelectedGroups = (groups) => {
  return [...new Set(normalizeSelectedGroups(groups).flatMap((groupId) => {
    if (atlasGroupMuscles[groupId]) return atlasGroupMuscles[groupId];
    return nativeMuscleIds.has(groupId) ? [groupId] : [];
  }))];
};

const findGroupForModelMuscle = (muscle, currentGroups) => {
  return currentGroups.find((group) => group.id === muscle)
    || currentGroups.find((group) => atlasGroupMuscles[group.id]?.includes(muscle));
};

export default function BodyTargets() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [selectedGroups, setSelectedGroups] = useState(() => {
    const user = resolveStudentProfileFromCache(getCurrentUser());
    return normalizeSelectedGroups(getStudentVisibleBodyTargets(user));
  });
  const [isFlipped, setIsFlipped] = useState(false);

  React.useEffect(() => {
    const loadTargets = async () => {
      const user = resolveStudentProfileFromCache(getCurrentUser());
      if (user?.email && navigator.onLine) {
        try {
          const data = await fetchSupabaseRowByEmail('students', user.email);
          if (data && data.target_muscles) {
            const normalizedTargets = normalizeSelectedGroups(data.target_muscles);
            setSelectedGroups(normalizedTargets);
            const key = data?.id ? `powerfit_atlas_targets_${data.id}` : user?.id ? `powerfit_atlas_targets_${user.id}` : 'powerfit_atlas_targets';
            localStorage.setItem(key, JSON.stringify(normalizedTargets));
          }
        } catch {
          console.error("Failed to load targets from Supabase");
        }
      }
    };
    loadTargets();
  }, []);

  const toggleGroup = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isSelected = (groupId) => selectedGroups.includes(groupId);
  const switchView = () => setIsFlipped(!isFlipped);
  const handleSave = async () => {
    const user = resolveStudentProfileFromCache(getCurrentUser());
    const key = user?.id ? `powerfit_atlas_targets_${user.id}` : 'powerfit_atlas_targets';
    localStorage.setItem(key, JSON.stringify(selectedGroups));
    
    if (user?.email && navigator.onLine) {
        try {
            const student = await fetchSupabaseRowByEmail('students', user.email);
            if (student?.id) await supabase.from('students').update({ target_muscles: selectedGroups }).eq('id', student.id);
        } catch {
            console.error("Erro ao salvar alvo 3D no Supabase");
        }
    }
    
    addToast('Alvo salvo!', 'success');
    navigate(-1);
  };

  const currentGroups = isFlipped ? muscleGroupsBack : muscleGroupsFront;
  const highlightedMuscles = expandSelectedGroups(selectedGroups);
  const data = [
    {
      name: 'Treino Alvo',
      muscles: highlightedMuscles
    }
  ];

  const handleModelClick = ({ muscle }) => {
    const group = findGroupForModelMuscle(muscle, currentGroups);
    toggleGroup(group?.id || muscle);
  };

  return (
    <div className='page-container body-targets-page' style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .body-targets-page {
          padding: clamp(12px, 3vw, 24px) !important;
        }

        .body-targets-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .body-targets-layout {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          align-items: flex-start;
        }

        .body-targets-page button {
          touch-action: manipulation;
        }

        .body-targets-page button:focus-visible {
          outline: 3px solid rgba(255, 176, 138, 0.86);
          outline-offset: 3px;
        }

        .body-targets-model-card {
          flex: 1 1 500px;
          padding: 0;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: clamp(640px, 72vw, 850px);
          border: 1px solid rgba(148, 163, 184, 0.18);
          background:
            radial-gradient(circle at 50% 12%, rgba(255, 107, 53, 0.18), transparent 28%),
            radial-gradient(circle at 50% 50%, rgba(30, 58, 95, 0.45), transparent 46%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(11, 17, 32, 0.98));
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .body-targets-model-card::before {
          content: '';
          position: absolute;
          inset: 18px;
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.09);
          background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0));
          pointer-events: none;
        }

        .body-targets-view-badge,
        .body-targets-count,
        .body-targets-flip {
          position: absolute;
          z-index: 20;
        }

        .body-targets-view-badge { top: 16px; left: 16px; }
        .body-targets-count { top: 16px; right: 16px; }
        .body-targets-flip { bottom: 32px; left: 50%; transform: translateX(-50%); }

        .body-targets-view-badge .badge {
          padding: 8px 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.98), rgba(229, 90, 37, 0.92));
          color: #fff;
          font-size: 0.85rem;
          font-weight: 800;
          box-shadow: 0 12px 26px rgba(255, 107, 53, 0.22);
        }

        .body-targets-count {
          padding: 7px 14px;
          border: 1px solid rgba(255, 107, 53, 0.24);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.76);
          backdrop-filter: blur(12px);
        }

        .body-targets-count p {
          margin: 0;
          color: #FFB08A;
          font-size: 0.88rem;
          font-weight: 800;
        }

        .body-targets-flip-button {
          font-size: 1rem;
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 999px;
          box-shadow: 0 16px 34px rgba(255, 107, 53, 0.28);
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .body-targets-model-shell {
          position: relative;
          width: 100%;
          height: clamp(560px, 62vw, 750px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(64px, 8vw, 80px) clamp(16px, 5vw, 48px) clamp(96px, 10vw, 120px);
        }

        .body-targets-model-shell::before {
          content: '';
          position: absolute;
          width: min(70%, 320px);
          height: 82%;
          border-radius: 999px;
          background: radial-gradient(ellipse, rgba(255, 107, 53, 0.13), transparent 68%);
          filter: blur(8px);
          pointer-events: none;
        }

        .body-targets-model-shell .rbh-wrapper {
          max-width: min(100%, 420px);
          filter: drop-shadow(0 18px 36px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 18px rgba(255, 107, 53, 0.16));
        }

        .body-targets-model-shell .rbh {
          overflow: visible;
        }

        .body-targets-model-shell .rbh polygon {
          stroke: rgba(241, 245, 249, 0.12);
          stroke-width: 0.18;
          transition: fill 160ms ease, opacity 160ms ease, stroke 160ms ease;
          vector-effect: non-scaling-stroke;
        }

        .body-targets-model-shell .rbh polygon:hover {
          fill: #FF8C5A !important;
          stroke: rgba(255, 255, 255, 0.34);
        }

        .body-targets-panel {
          flex: 1 1 350px;
          display: flex;
          flex-direction: column;
          min-height: clamp(560px, 72vw, 850px);
        }

        .body-targets-group-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .body-targets-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .body-targets-save {
            width: 100%;
          }

          .body-targets-layout {
            gap: 16px;
          }

          .body-targets-model-card,
          .body-targets-panel {
            flex-basis: 100%;
          }

          .body-targets-panel {
            min-height: auto;
          }
        }

        @media (max-width: 480px) {
          .body-targets-page h2 {
            font-size: 1.25rem;
          }

          .body-targets-model-card {
            min-height: 590px;
            border-radius: 22px;
          }

          .body-targets-model-card::before {
            inset: 10px;
            border-radius: 18px;
          }

          .body-targets-view-badge { top: 12px; left: 12px; }
          .body-targets-count { top: 12px; right: 12px; padding: 6px 10px; }

          .body-targets-view-badge .badge,
          .body-targets-count p {
            font-size: 0.72rem;
          }

          .body-targets-model-shell {
            height: 530px;
            padding: 68px 8px 96px;
          }

          .body-targets-model-shell .rbh-wrapper {
            max-width: 285px;
          }

          .body-targets-flip {
            bottom: 22px;
            width: calc(100% - 32px);
          }

          .body-targets-flip-button {
            width: 100%;
            justify-content: center;
            padding: 12px 16px;
            font-size: 0.9rem;
          }

          .body-targets-group-grid {
            gap: 10px;
          }
        }
      `}</style>
      
      <div className='body-targets-header'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} className='btn btn-secondary' style={{ padding: '8px' }} aria-label='Voltar'>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <span role='img' aria-label='dna'>🧬</span> Atlas Anatômico 3D PRO
          </h2>
        </div>
        <button onClick={handleSave} className='btn btn-primary body-targets-save' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={18} /> Salvar
        </button>
      </div>

      <div className='body-targets-layout'>
        
        <div className='card body-targets-model-card'>
          
          <div className='body-targets-view-badge'>
            <div className='badge badge-primary'>
              🧍 {isFlipped ? 'VISÃO POSTERIOR' : 'VISÃO ANTERIOR'}
            </div>
          </div>

          <div className='body-targets-count'>
             <p>{selectedGroups.length} selecionados</p>
          </div>

          <div className='body-targets-flip'>
             <button onClick={switchView} className='btn btn-primary body-targets-flip-button'>
               <RefreshCw size={20} /> 
               Girar Boneco (360º)
              </button>
          </div>

          <div className='body-targets-model-shell'>
            <Model
              data={data}
              style={{ height: '100%', width: '100%' }}
              svgStyle={{ overflow: 'visible' }}
              bodyColor={atlasBodyColor}
              highlightedColors={[atlasAccent]}
              onClick={handleModelClick}
              type={isFlipped ? "posterior" : "anterior"}
            />
          </div>
        </div>

        {/* Panel Grupos */}
        <div className='card body-targets-panel'>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
            <span role='img' aria-label='bullet'>🚀</span> Seleção por Grupos
          </h3>
          
          <div className='body-targets-group-grid'>
            {currentGroups.map(mg => {
              const selected = isSelected(mg.id);
              return (
                <button
                  key={mg.id}
                  onClick={() => toggleGroup(mg.id)}
                  style={{
                    background: selected ? atlasAccentMuted : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${selected ? atlasAccent : 'var(--border)'}`,
                    color: selected ? atlasAccentText : 'var(--text-secondary)',
                    padding: '12px 18px',
                    borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontWeight: selected ? '700' : '500',
                    fontSize: '0.95rem',
                    boxShadow: selected ? '0 0 20px rgba(255, 107, 53, 0.16)' : 'none'
                  }}
                >
                  {selected && <Check size={18} />} {mg.name}
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
             <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
               <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Dica Profissional:</span><br/>
               Você pode clicar diretamente em qualquer parte do corpo no modelo ao lado para selecionar ou remover músculos. Use o botão <strong>Girar</strong> para alternar entre as visões frontal e posterior.
             </p>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            {selectedGroups.length > 0 && (
              <button onClick={() => setSelectedGroups([])} className='btn btn-secondary' style={{ width: '100%', marginBottom: '12px', padding: '12px' }}>
                Limpar Tudo
              </button>
            )}
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Atlas Anatômico PowerFit v2.0 - Precisão 3D
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


