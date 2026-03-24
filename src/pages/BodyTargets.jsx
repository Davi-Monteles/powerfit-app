import { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getStudentById, saveStudent } from '../lib/storage';
import { Save, ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import PremiumLobby from './PremiumLobby';

// AI Feedback Helper
function getAIFeedback(parts, goal, gender) {
  if (parts.length === 0) return "👉 Clique nas áreas do corpo no qual você deseja colocar mais ênfase inicial em seus treinos.";
  
  const hasFront = parts.includes("Peito") || parts.includes("Abdômen");
  const hasBack = parts.includes("Costas");
  const hasLegs = parts.includes("Pernas");

  if (hasFront && !hasBack) {
    return "💡 Dica da IA: Você selecionou Peito/Abdômen mas esqueceu das Costas. Lembre-se que negligenciar a cadeia posterior gera ombros projetados e má postura.";
  }
  if (!hasLegs) {
    return "💡 Dica da IA: Não pule o treino de pernas! Treinar membros inferiores aumenta a produção natural de testosterona e acelera a queima basal.";
  }
  if (parts.length > 4) {
    return `✅ Seleção completa. Seu instrutor distribuirá os treinos para focar nestas áreas visando seu objetivo de ${goal}.`;
  }
  
  return `💪 Focando em ${parts.join(', ')} para o seu objetivo de ${goal}. Excelente escolha para a anatomia ${gender}!`;
}

// Composites of a realistic 3D Human
function BodyPart({ position, args, rotation, name, isSelected, onClick, type = 'capsule' }) {
  const meshRef = useRef();
  
  const baseColor = isSelected ? '#3B82F6' : '#2A3040';
  const hoverColor = isSelected ? '#60A5FA' : '#3F465C';
  const [hovered, setHover] = useState(false);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation || [0, 0, 0]}
      onClick={(e) => { e.stopPropagation(); if (onClick) onClick(name); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
      castShadow receiveShadow
    >
      {type === 'capsule' && <capsuleGeometry args={args} />}
      {type === 'sphere' && <sphereGeometry args={args} />}
      {type === 'box' && <boxGeometry args={args} />}
      <meshStandardMaterial 
        color={hovered ? hoverColor : baseColor} 
        roughness={0.5} 
        metalness={0.1}
        emissive={isSelected ? '#3B82F6' : '#000000'}
        emissiveIntensity={isSelected ? 0.4 : 0}
      />
    </mesh>
  );
}

function Humanoid({ selectedParts, onPartClick, gender }) {
  const isSelected = (part) => selectedParts.includes(part);
  const isMale = gender === 'Masculino';

  // Proportions based on gender
  const sX = isMale ? 1.4 : 1.1; // Shoulder width
  const aT = isMale ? 0.35 : 0.28; // Arm thickness
  const hX = isMale ? 0.6 : 0.8; // Hip width
  const lT = isMale ? 0.4 : 0.45; // Leg thickness

  return (
    <group position={[0, -2, 0]}>
      {/* Head */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#3F465C" />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.6]} />
        <meshStandardMaterial color="#3F465C" />
      </mesh>

      {/* Chest (Peito) */}
      <BodyPart name="Peito" type="capsule" position={[0, 3.2, 0]} rotation={[0, 0, Math.PI/2]} args={[isMale ? 0.7 : 0.6, isMale ? 1.0 : 0.7, 4, 16]} isSelected={isSelected('Peito')} onClick={onPartClick} />
      
      {/* Abs (Abdômen) */}
      <BodyPart name="Abdômen" type="box" position={[0, 2.0, 0.1]} args={[isMale ? 1.2 : 0.9, 1.4, 0.6]} isSelected={isSelected('Abdômen')} onClick={onPartClick} />
      
      {/* Back (Costas) - Larger box covering the back */}
      <BodyPart name="Costas" type="box" position={[0, 2.5, -0.3]} args={[isMale ? 1.6 : 1.2, 2.2, 0.4]} isSelected={isSelected('Costas')} onClick={onPartClick} />

      {/* Shoulders (Ombros) */}
      <BodyPart name="Ombros" type="sphere" position={[-sX, 3.5, 0]} args={[isMale ? 0.45 : 0.35, 32, 32]} isSelected={isSelected('Ombros')} onClick={onPartClick} />
      <BodyPart name="Ombros" type="sphere" position={[sX, 3.5, 0]} args={[isMale ? 0.45 : 0.35, 32, 32]} isSelected={isSelected('Ombros')} onClick={onPartClick} />

      {/* Arms (Braços) */}
      <BodyPart name="Braços" type="capsule" position={[-sX - 0.2, 2.2, 0]} args={[aT, 1.8, 4, 16]} isSelected={isSelected('Braços')} onClick={onPartClick} />
      <BodyPart name="Braços" type="capsule" position={[sX + 0.2, 2.2, 0]} args={[aT, 1.8, 4, 16]} isSelected={isSelected('Braços')} onClick={onPartClick} />

      {/* Pelvis / Glutes */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[hX, 0.8, 4, 16]} rotation={[0, 0, Math.PI/2]} />
        <meshStandardMaterial color="#2A3040" />
      </mesh>

      {/* Legs (Pernas) */}
      <BodyPart name="Pernas" type="capsule" position={[-0.5, -0.8, 0]} args={[lT, 2.4, 4, 16]} isSelected={isSelected('Pernas')} onClick={onPartClick} />
      <BodyPart name="Pernas" type="capsule" position={[0.5, -0.8, 0]} args={[lT, 2.4, 4, 16]} isSelected={isSelected('Pernas')} onClick={onPartClick} />
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
  const initialGender = student?.gender === 'Feminino' ? 'Feminino' : 'Masculino';

  const [selectedParts, setSelectedParts] = useState(initialTargets);
  const [goal, setGoal] = useState(initialGoal);
  const [gender, setGender] = useState(initialGender);
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
          objective: goal,
          gender: gender
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
            
            <Humanoid selectedParts={selectedParts} onPartClick={togglePart} gender={gender} />
            
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
              <option value="Emagrecimento">🏃 Emagrecimento Acelerado</option>
              <option value="Hipertrofia">💪 Hipertrofia (Ganho de Massa)</option>
              <option value="Condicionamento">🚴 Condicionamento Físico</option>
              <option value="Reabilitação">🏥 Reabilitação Fisioterápica</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ fontWeight: '600' }}>Anatomia do Modelo</label>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button 
                className={`btn ${gender === 'Masculino' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ flex: 1, padding: '8px' }} 
                onClick={() => setGender('Masculino')}
              >
                Masculino
              </button>
              <button 
                className={`btn ${gender === 'Feminino' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ flex: 1, padding: '8px' }} 
                onClick={() => setGender('Feminino')}
              >
                Feminino
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '8px', fontSize: '0.9rem', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} /> Análise da IA PowerFit
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
              {getAIFeedback(selectedParts, goal, gender)}
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
