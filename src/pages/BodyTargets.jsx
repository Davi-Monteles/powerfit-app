import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getStudentById, saveStudent } from '../lib/storage';
import { Save, ArrowLeft, RefreshCw, Info } from 'lucide-react';

function SvgPart({ d, cx, cy, r, name, isSelected, onClick, type = "path" }) {
  const baseFill = "rgba(255, 255, 255, 0.05)";
  const selectedFill = "var(--primary)";
  const hoverFill = "rgba(255, 107, 53, 0.4)";
  
  const [hover, setHover] = useState(false);

  const props = {
    className: "svg-body-part",
    style: {
      fill: isSelected ? selectedFill : (hover ? hoverFill : baseFill),
      stroke: "rgba(255,255,255,0.2)",
      strokeWidth: "2",
      cursor: "pointer",
      transition: "all 0.3s ease"
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onClick: () => onClick(name)
  };

  if (type === "circle") {
    return <circle cx={cx} cy={cy} r={r} {...props} />;
  }
  return <path d={d} {...props} />;
}

export default function BodyTargets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const student = user?.studentId ? getStudentById(user.studentId) : null;
  const initialTargets = student?.targetMuscles || [];
  const initialGoal = student?.objective || 'Hipertrofia';

  const [selectedParts, setSelectedParts] = useState(initialTargets);
  const [goal, setGoal] = useState(initialGoal);
  const [isSaving, setIsSaving] = useState(false);

  const togglePart = (partName) => {
    setSelectedParts(prev => 
      prev.includes(partName) ? prev.filter(p => p !== partName) : [...prev, partName]
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      if (student) {
        saveStudent({
          ...student,
          targetMuscles: selectedParts,
          objective: goal
        });
      }
      navigate('/aluno');
    }, 800);
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/aluno')}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ flex: 1, textAlign: 'center' }}>Alvo Muscular (2D)</h2>
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
          <span className="hide-mobile" style={{ marginLeft: '8px' }}>Salvar Alvos</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 400px', padding: '32px 24px', display: 'flex', justifyContent: 'center', gap: '60px', background: 'radial-gradient(circle at center, #1F2433 0%, #151821 100%)', flexWrap: 'wrap' }}>
          
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Frente</h4>
            <svg width="180" height="320" viewBox="0 0 100 200">
              {/* Head */}
              <circle cx="50" cy="20" r="14" fill="#2A3040" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
              
              {/* Chest */}
              <SvgPart name="Peito" type="path" d="M32,45 L68,45 L62,75 L38,75 Z" isSelected={selectedParts.includes("Peito")} onClick={togglePart} />
              
              {/* Abs */}
              <SvgPart name="Abdômen" type="path" d="M38,75 L62,75 L58,110 L42,110 Z" isSelected={selectedParts.includes("Abdômen")} onClick={togglePart} />
              
              {/* Shoulders */}
              <SvgPart name="Ombros" type="circle" cx="22" cy="48" r="10" isSelected={selectedParts.includes("Ombros")} onClick={togglePart} />
              <SvgPart name="Ombros" type="circle" cx="78" cy="48" r="10" isSelected={selectedParts.includes("Ombros")} onClick={togglePart} />
              
              {/* Arms */}
              <SvgPart name="Braços" type="path" d="M15,55 L5,110 L18,110 L26,55 Z" isSelected={selectedParts.includes("Braços")} onClick={togglePart} />
              <SvgPart name="Braços" type="path" d="M85,55 L95,110 L82,110 L74,55 Z" isSelected={selectedParts.includes("Braços")} onClick={togglePart} />
              
              {/* Pelvis */}
              <path d="M42,110 L58,110 L60,125 L40,125 Z" fill="#2A3040" />

              {/* Legs */}
              <SvgPart name="Pernas" type="path" d="M40,125 L25,190 L42,190 L48,125 Z" isSelected={selectedParts.includes("Pernas")} onClick={togglePart} />
              <SvgPart name="Pernas" type="path" d="M60,125 L75,190 L58,190 L52,125 Z" isSelected={selectedParts.includes("Pernas")} onClick={togglePart} />
            </svg>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h4 style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Costas</h4>
            <svg width="180" height="320" viewBox="0 0 100 200">
              {/* Head */}
              <circle cx="50" cy="20" r="14" fill="#2A3040" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
              
              {/* Back */}
              <SvgPart name="Costas" type="path" d="M30,45 L70,45 L58,110 L42,110 Z" isSelected={selectedParts.includes("Costas")} onClick={togglePart} />
              
              {/* Shoulders */}
              <SvgPart name="Ombros" type="circle" cx="22" cy="48" r="10" isSelected={selectedParts.includes("Ombros")} onClick={togglePart} />
              <SvgPart name="Ombros" type="circle" cx="78" cy="48" r="10" isSelected={selectedParts.includes("Ombros")} onClick={togglePart} />
              
              {/* Arms */}
              <SvgPart name="Braços" type="path" d="M15,55 L5,110 L18,110 L26,55 Z" isSelected={selectedParts.includes("Braços")} onClick={togglePart} />
              <SvgPart name="Braços" type="path" d="M85,55 L95,110 L82,110 L74,55 Z" isSelected={selectedParts.includes("Braços")} onClick={togglePart} />
              
              {/* Glutes */}
              <SvgPart name="Pernas" type="path" d="M42,110 L58,110 L62,130 L38,130 Z" isSelected={selectedParts.includes("Pernas")} onClick={togglePart} />

              {/* Legs */}
              <SvgPart name="Pernas" type="path" d="M38,130 L25,190 L42,190 L48,130 Z" isSelected={selectedParts.includes("Pernas")} onClick={togglePart} />
              <SvgPart name="Pernas" type="path" d="M62,130 L75,190 L58,190 L52,130 Z" isSelected={selectedParts.includes("Pernas")} onClick={togglePart} />
            </svg>
          </div>

        </div>

        <div className="card" style={{ flex: '0 0 320px', padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Personalização</h3>
          
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ fontWeight: '600' }}>Seu Principal Objetivo</label>
            <select className="form-input" value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="Emagrecimento">🏃 Emagrecimento</option>
              <option value="Hipertrofia">💪 Hipertrofia (Massa)</option>
              <option value="Condicionamento">🚴 Condicionamento</option>
              <option value="Reabilitação">🏥 Reabilitação</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="var(--primary)" /> Alvos Selecionados
            </label>
            {selectedParts.length === 0 ? (
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Clique nos músculos dos diagramas ao lado para definir seus alvos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedParts.map(part => (
                  <span key={part} className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {part}
                    <button 
                      onClick={() => togglePart(part)}
                      style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 2px' }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
