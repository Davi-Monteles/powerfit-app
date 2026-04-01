import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

// Material procedural tech/cyberpunk
const techMaterial = new THREE.MeshStandardMaterial({
  color: '#FF6B35', 
  roughness: 0.2, 
  metalness: 0.8,
  emissive: '#FF6B35',
  emissiveIntensity: 0.1
});

const defaultMaterial = new THREE.MeshStandardMaterial({
  color: '#2a2a35', 
  roughness: 0.7, 
  metalness: 0.2
});

function MuscleGroup({ position, scale, geometry, id, name, selected, onSelect }) {
  const mesh = useRef();
  const [hovered, setHovered] = useState(false);

  // Animação de hover
  useFrame((state) => {
    if (selected === id) {
      mesh.current.scale.lerp(new THREE.Vector3(scale[0] * 1.1, scale[1] * 1.1, scale[2] * 1.1), 0.1);
      mesh.current.material = techMaterial;
    } else {
      mesh.current.scale.lerp(new THREE.Vector3(...scale), 0.1);
      mesh.current.material = hovered ? techMaterial : defaultMaterial;
    }
  });

  return (
    <mesh
      ref={mesh}
      position={position}
      geometry={geometry}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); onSelect(selected === id ? null : id); }}
    />
  );
}

// Boneco procedural (manequim simplificado)
function ProceduralMannequin({ selectedMuscle, onSelectMuscle }) {
  const group = useRef();

  // Geometrias cacheadas para performance
  const { chestGeo, backGeo, legGeo, armGeo, shoulderGeo, headGeo, coreGeo } = useMemo(() => {
    return {
      headGeo: new THREE.SphereGeometry(0.3, 32, 32),
      chestGeo: new THREE.BoxGeometry(0.8, 0.5, 0.4),
      coreGeo: new THREE.BoxGeometry(0.7, 0.4, 0.35),
      backGeo: new THREE.BoxGeometry(0.8, 0.5, 0.1), // Atrás do peito
      shoulderGeo: new THREE.SphereGeometry(0.25, 16, 16),
      armGeo: new THREE.CylinderGeometry(0.12, 0.1, 0.8, 16),
      legGeo: new THREE.CylinderGeometry(0.18, 0.12, 1.2, 16)
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    group.current.position.y = Math.sin(time * 2) * 0.05; // Flutuação suave
  });

  return (
    <group ref={group} position={[0, -0.5, 0]}>
      {/* Cabeça */}
      <mesh geometry={headGeo} position={[0, 1.6, 0]} material={defaultMaterial} />

      {/* Peito */}
      <MuscleGroup id="peito" name="Peito" geometry={chestGeo} position={[0, 1.05, 0.05]} scale={[1, 1, 1]} selected={selectedMuscle} onSelect={onSelectMuscle} />
      
      {/* Costas */}
      <MuscleGroup id="costas" name="Costas" geometry={backGeo} position={[0, 1.05, -0.15]} scale={[1, 1, 1]} selected={selectedMuscle} onSelect={onSelectMuscle} />

      {/* Core / Abdômen */}
      <MuscleGroup id="core" name="Abdômen" geometry={coreGeo} position={[0, 0.55, 0.02]} scale={[1, 1, 1]} selected={selectedMuscle} onSelect={onSelectMuscle} />

      {/* Ombros (Esq, Dir) */}
      <MuscleGroup id="ombros" name="Ombros" geometry={shoulderGeo} position={[-0.55, 1.15, 0]} scale={[1, 1, 1]} selected={selectedMuscle} onSelect={onSelectMuscle} />
      <MuscleGroup id="ombros" name="Ombros" geometry={shoulderGeo} position={[0.55, 1.15, 0]} scale={[1, 1, 1]} selected={selectedMuscle} onSelect={onSelectMuscle} />

      {/* Braços (Esq, Dir) */}
      <MuscleGroup id="bracos" name="Braços" geometry={armGeo} position={[-0.65, 0.6, 0]} scale={[1, 1, 1]} selected={selectedMuscle} onSelect={onSelectMuscle} />
      <MuscleGroup id="bracos" name="Braços" geometry={armGeo} position={[0.65, 0.6, 0]} scale={[1, 1, 1]} selected={selectedMuscle} onSelect={onSelectMuscle} />

      {/* Pernas (Esq, Dir) */}
      <MuscleGroup id="pernas" name="Pernas" geometry={legGeo} position={[-0.22, -0.3, 0]} scale={[1, 1, 1]} selected={selectedMuscle} onSelect={onSelectMuscle} />
      <MuscleGroup id="pernas" name="Pernas" geometry={legGeo} position={[0.22, -0.3, 0]} scale={[1, 1, 1]} selected={selectedMuscle} onSelect={onSelectMuscle} />
    </group>
  );
}

export default function AnatomyAtlas({ selectedMuscle, onSelectMuscle }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        
        <ProceduralMannequin selectedMuscle={selectedMuscle} onSelectMuscle={onSelectMuscle} />

        <ContactShadows position={[0, -1, 0]} opacity={0.5} scale={10} blur={2} far={4} />
        
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.5}
          minDistance={2}
          maxDistance={6}
          autoRotate={!selectedMuscle}
          autoRotateSpeed={1.5}
        />
        
        <Environment preset="city" />
      </Canvas>
      <div style={{ position: 'absolute', top: 10, left: 10, pointerEvents: 'none' }}>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px' }}>
          Interaja com o modelo girando e clicando nos membros
        </p>
      </div>
    </div>
  );
}
