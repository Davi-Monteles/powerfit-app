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
    <div className='page-container' style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} className='btn btn-secondary' style={{ padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <span role='img' aria-label='dna'>🧬</span> Atlas Anatômico 3D PRO
          </h2>
        </div>
        <button onClick={handleSave} className='btn btn-primary' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={18} /> Salvar
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        <div className='card' style={{ 
          flex: '1 1 500px', 
          padding: 0, 
          overflow: 'hidden', 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'var(--bg-card)', 
          minHeight: '850px', // Aumentado para mostrar o corpo todo
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          border: '1px solid var(--border)'
        }}>
          
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 20 }}>
            <div className='badge badge-primary' style={{ fontSize: '0.85rem', padding: '8px 16px', background: 'rgba(255,107,53,1)', border: 'none', color: 'white', fontWeight: 'bold' }}>
              🧍 {isFlipped ? 'VISÃO POSTERIOR' : 'VISÃO ANTERIOR'}
            </div>
          </div>

          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20, background: 'rgba(0,0,0,0.7)', padding: '6px 14px', borderRadius: '12px' }}>
             <p style={{ margin: 0, fontSize: '0.9rem', color: '#10DB68', fontWeight: 'bold' }}>{selectedGroups.length} selecionados</p>
          </div>

          <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
             <button onClick={switchView} className='btn btn-primary' style={{ 
               fontSize: '1rem', 
               background: 'var(--primary)', 
               color: 'white',
               border: 'none', 
               padding: '14px 32px', 
               borderRadius: '50px',
               boxShadow: '0 10px 20px rgba(255,107,53,0.3)',
               fontWeight: 'bold',
               display: 'flex',
               alignItems: 'center',
               gap: '10px',
               transition: 'all 0.3s'
             }}>
               <RefreshCw size={20} /> 
               Girar Boneco (360º)
             </button>
          </div>

          <div style={{
            position: 'relative',
            width: '100%',
            height: '750px', // Altura fixa para garantir que o SVG não seja cortado
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Model
              data={data}
              style={{ height: '100%', width: '100%' }}
              highlightedColors={['#10DB68']}
              onClick={handleModelClick}
              type={isFlipped ? "posterior" : "anterior"}
            />
          </div>
        </div>

        {/* Panel Grupos */}
        <div className='card' style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', minHeight: '850px' }}>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
            <span role='img' aria-label='bullet'>🚀</span> Seleção por Grupos
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {currentGroups.map(mg => {
              const selected = isSelected(mg.id);
              return (
                <button
                  key={mg.id}
                  onClick={() => toggleGroup(mg.id)}
                  style={{
                    background: selected ? 'rgba(16, 219, 104, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${selected ? '#10DB68' : 'var(--border)'}`,
                    color: selected ? '#10DB68' : 'var(--text-secondary)',
                    padding: '12px 18px',
                    borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                    fontWeight: selected ? '700' : '500',
                    fontSize: '0.95rem'
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


