import { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getStudentById, saveStudent } from '../lib/storage';
import { Save, ArrowLeft, RefreshCw } from 'lucide-react';
import PremiumLobby from './PremiumLobby';

// Composites of a simple 3D Human
function BodyPart({ position, args, color, name, isSelected, onClick, type = 'box' }) {
  const meshRef = useRef();
  
  // Highlight with neon blue/orange if selected, dark gray otherwise
  const baseColor = isSelected ? '#3B82F6' : '#2A3040';
  const hoverColor = isSelected ? '#60A5FA' : '#3F465C';

  const [hovered, setHover] = useState(false);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(name);
      }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
      castShadow
      receiveShadow
    >
      {type === 'box' && <boxGeometry args={args} />}
      {type === 'cylinder' && <cylinderGeometry args={args} />}
      {type === 'sphere' && <sphereGeometry args={args} />}
      <meshStandardMaterial 
        color={hovered ? hoverColor : baseColor} 
        roughness={0.4} 
        metalness={0.2}
        emissive={isSelected ? '#3B82F6' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
    </mesh>
  );
}

function Humanoid({ selectedParts, onPartClick }) {
  const isSelected = (part) => selectedParts.includes(part);

  return (
    <group position={[0, -2, 0]}>
      {/* Head - Not clickable */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#3F465C" />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.5]} />
        <meshStandardMaterial color="#3F465C" />
      </mesh>

      {/* Torso Top (Chest / Peito) */}
      <BodyPart name="Peito" position={[0, 3.1, 0.2]} args={[1.8, 1.2, 0.6]} isSelected={isSelected('Peito')} onClick={onPartClick} />
      
      {/* Torso Bottom (Abs / Abdômen) */}
      <BodyPart name="Abdômen" position={[0, 1.7, 0.2]} args={[1.5, 1.4, 0.5]} isSelected={isSelected('Abdômen')} onClick={onPartClick} />
      
      {/* Back (Costas) */}
      <BodyPart name="Costas" position={[0, 2.4, -0.2]} args={[1.8, 2.6, 0.5]} isSelected={isSelected('Costas')} onClick={onPartClick} />

      {/* Shoulders (Ombros) */}
      <BodyPart name="Ombros" position={[-1.2, 3.4, 0]} args={[0.5, 32, 32]} type="sphere" isSelected={isSelected('Ombros')} onClick={onPartClick} />
      <BodyPart name="Ombros" position={[1.2, 3.4, 0]} args={[0.5, 32, 32]} type="sphere" isSelected={isSelected('Ombros')} onClick={onPartClick} />

      {/* Arms (Braços) */}
      <BodyPart name="Braços" position={[-1.4, 2.1, 0]} args={[0.35, 0.35, 2.2]} type="cylinder" isSelected={isSelected('Braços')} onClick={onPartClick} />
      <BodyPart name="Braços" position={[1.4, 2.1, 0]} args={[0.35, 0.35, 2.2]} type="cylinder" isSelected={isSelected('Braços')} onClick={onPartClick} />

      {/* Pelvis */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.6, 0.6, 0.8]} />
        <meshStandardMaterial color="#2A3040" />
      </mesh>

      {/* Legs (Pernas) */}
      <BodyPart name="Pernas" position={[-0.45, -1, 0]} args={[0.4, 0.4, 2.8]} type="cylinder" isSelected={isSelected('Pernas')} onClick={onPartClick} />
      <BodyPart name="Pernas" position={[0.45, -1, 0]} args={[0.4, 0.4, 2.8]} type="cylinder" isSelected={isSelected('Pernas')} onClick={onPartClick} />
    </group>
  );
}

export default function BodyTargets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Safe default parsing
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

  if (student && !student.isPremium) {
    return (
      <div className="page-container animate-fade-in" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/aluno')}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ flex: 1, textAlign: 'center' }}>Alvo 3D & Objetivos</h2>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <PremiumLobby onUpgrade={() => {
            saveStudent({ ...student, isPremium: true });
            window.location.reload();
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/aluno')}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ flex: 1, textAlign: 'center' }}>Alvo 3D & Objetivos</h2>
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
          <span className="hide-mobile" style={{ marginLeft: '8px' }}>Salvar Alvos</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden', flexWrap: 'wrap' }}>
        {/* 3D Canvas Area */}
        <div className="card" style={{ flex: '1 1 400px', position: 'relative', overflow: 'hidden', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1F2433 0%, #151821 100%)' }}>
          
          <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc' }}>Gire a câmera em 360°</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc' }}>Clique nas partes para focar</p>
          </div>

          <Canvas shadows camera={{ position: [0, 2, 9], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />
            <pointLight position={[-10, 10, -10]} intensity={0.5} color="#3B82F6" />
            
            <Humanoid selectedParts={selectedParts} onPartClick={togglePart} />
            
            <OrbitControls 
              enablePan={false}
              enableZoom={true}
              minDistance={4}
              maxDistance={12}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.5}
            />
          </Canvas>
          
        </div>

        {/* Configuration Sidebar */}
        <div className="card" style={{ flex: '0 0 320px', padding: '24px', overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Personalização</h3>
          
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ fontWeight: '600' }}>Seu Principal Objetivo</label>
            <select className="form-input" value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="Emagrecimento">🏃 Emagrecimento Acetinado</option>
              <option value="Hipertrofia">💪 Hipertrofia (Ganho de Massa)</option>
              <option value="Condicionamento">🚴 Condicionamento Físico</option>
              <option value="Reabilitação">🏥 Reabilitação Fisioterápica</option>
            </select>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              A IA do PowerFit usará essa informação para calcular dicas específicas nos seus dias de descanso.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '600' }}>Alvos Selecionados</label>
            {selectedParts.length === 0 ? (
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Nenhuma parte do corpo selecionada. Clique no modelo 3D ao lado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedParts.map(part => (
                  <span key={part} className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {part}
                    <button 
                      onClick={() => togglePart(part)}
                      style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 2px', display: 'inline-flex' }}
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
