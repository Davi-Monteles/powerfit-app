import React, { useState } from 'react';
import { ArrowLeft, Save, RefreshCw, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const muscleGroups = [
  { id: 'peito', name: 'Peito' },
  { id: 'costas', name: 'Costas' },
  { id: 'ombros', name: 'Ombros' },
  { id: 'biceps', name: 'Bíceps e Antebraço' },
  { id: 'triceps', name: 'Tríceps' },
  { id: 'abdomen', name: 'Abdômen' },
  { id: 'quadriceps', name: 'Quadríceps (Coxa Ant.)' },
  { id: 'posteriores', name: 'Posteriores (Coxa Tras.)' },
  { id: 'gluteos', name: 'Glúteos' },
  { id: 'panturrilhas', name: 'Panturrilhas' }
];

export default function BodyTargets() {
  const navigate = useNavigate();
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleGroup = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isSelected = (groupId) => selectedGroups.includes(groupId);
  const switchView = () => setIsFlipped(!isFlipped);
  const handleSave = () => navigate(-1);

  const getOverlayStyle = (id) => ({
    fill: isSelected(id) ? 'rgba(16, 219, 104, 0.65)' : 'transparent',
    stroke: isSelected(id) ? 'rgba(16, 219, 104, 1)' : 'transparent',
    strokeWidth: 3,
    strokeLinejoin: 'round',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer'
  });

  const hoverProps = (id) => ({
    onMouseEnter: (e) => {
      if (!isSelected(id)) e.target.style.fill = 'rgba(16, 219, 104, 0.3)';
    },
    onMouseLeave: (e) => {
      if (!isSelected(id)) e.target.style.fill = 'transparent';
    },
    onClick: () => toggleGroup(id)
  });

  return (
    <div className='page-container' style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
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

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        <div className='card' style={{ 
          flex: '1 1 500px', 
          padding: 0, 
          overflow: 'hidden', 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'var(--bg-card)', 
          minHeight: '700px',
          perspective: '1000px'
        }}>
          
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 20 }}>
            <div className='badge badge-primary' style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(255,107,53,0.9)', border: '1px solid var(--primary)', color: 'white' }}>
              🧍 {isFlipped ? 'TRASEIRO' : 'FRONTAL'}
            </div>
          </div>

          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20, background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '12px' }}>
             <p style={{ margin: 0, fontSize: '0.85rem', color: 'white' }}>{selectedGroups.length} grupo(s)</p>
          </div>

          <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
             <button onClick={switchView} className='btn btn-primary' style={{ 
               fontSize: '0.9rem', 
               background: 'var(--primary)', 
               color: 'white',
               border: 'none', 
               padding: '12px 24px', 
               borderRadius: '30px',
               boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
             }}>
               <RefreshCw size={18} style={{ display: 'inline', marginRight: '8px' }}/> 
               Girar (Frente/Costas)
             </button>
          </div>

          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '650px',
            transition: 'transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}>

            {/* FRENTE */}
            <div style={{
              position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg viewBox='0 0 600 1000' style={{ height: '95%' }} preserveAspectRatio='xMidYMid meet'>
                <defs>
                  <filter id='removeWhiteFix'>
                    <feColorMatrix type='luminanceToAlpha' result='lum'/>
                    <feComponentTransfer in='lum' result='mask'>
                      <feFuncA type='discrete' tableValues='1 1 1 1 1 1 1 1 1 0.4 0' />
                    </feComponentTransfer>
                    <feComposite in='SourceGraphic' in2='mask' operator='in' />
                  </filter>
                </defs>
                <image href='/anatomy-front.jpg' width='600' height='1000' x='0' y='0' filter='url(#removeWhiteFix)' />
                
                {/* Peito */}
                <polygon points='250,165 350,165 355,200 350,235 300,245 250,235 245,200' style={getOverlayStyle('peito')} {...hoverProps('peito')} />
                
                {/* Ombros Frontais */}
                <polygon points='280,145 240,160 215,190 220,215 245,230 250,180' style={getOverlayStyle('ombros')} {...hoverProps('ombros')} />
                <polygon points='320,145 360,160 385,190 380,215 355,230 350,180' style={getOverlayStyle('ombros')} {...hoverProps('ombros')} />
                
                {/* Abdomen */}
                <polygon points='250,235 300,245 350,235 345,300 335,360 300,370 265,360 255,300' style={getOverlayStyle('abdomen')} {...hoverProps('abdomen')} />
                
                {/* Biceps/Antebraço */}
                <polygon points='220,210 200,280 180,335 155,410 135,475 160,485 180,415 205,345 225,285 245,235' style={getOverlayStyle('biceps')} {...hoverProps('biceps')} />
                <polygon points='380,210 400,280 420,335 445,410 465,475 440,485 420,415 395,345 375,285 355,235' style={getOverlayStyle('biceps')} {...hoverProps('biceps')} />
                
                {/* Quadriceps (Pernas Ant) */}
                <polygon points='260,360 300,370 295,460 280,560 245,550 240,460 245,380' style={getOverlayStyle('quadriceps')} {...hoverProps('quadriceps')} />
                <polygon points='340,360 300,370 305,460 320,560 355,550 360,460 355,380' style={getOverlayStyle('quadriceps')} {...hoverProps('quadriceps')} />

                {/* Panturrilhas/Canela Frontal */}
                <polygon points='245,560 280,560 270,680 255,770 235,765 230,680' style={getOverlayStyle('panturrilhas')} {...hoverProps('panturrilhas')} />
                <polygon points='355,560 320,560 330,680 345,770 365,765 370,680' style={getOverlayStyle('panturrilhas')} {...hoverProps('panturrilhas')} />
              </svg>
            </div>

            {/* COSTAS */}
            <div style={{
              position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg viewBox='0 0 600 1000' style={{ height: '95%' }} preserveAspectRatio='xMidYMid meet'>
                <image href='/anatomy-back.jpg' width='600' height='1000' x='0' y='0' filter='url(#removeWhiteFix)' />
                
                {/* Costas */}
                <polygon points='250,160 350,160 355,200 345,280 335,360 300,370 265,360 255,280 245,200' style={getOverlayStyle('costas')} {...hoverProps('costas')} />
                
                {/* Ombros Traseiros */}
                <polygon points='280,145 240,160 215,190 220,215 245,230 250,180' style={getOverlayStyle('ombros')} {...hoverProps('ombros')} />
                <polygon points='320,145 360,160 385,190 380,215 355,230 350,180' style={getOverlayStyle('ombros')} {...hoverProps('ombros')} />
                
                {/* Triceps */}
                <polygon points='220,210 200,280 180,335 155,410 135,475 160,485 180,415 205,345 225,285 245,235' style={getOverlayStyle('triceps')} {...hoverProps('triceps')} />
                <polygon points='380,210 400,280 420,335 445,410 465,475 440,485 420,415 395,345 375,285 355,235' style={getOverlayStyle('triceps')} {...hoverProps('triceps')} />

                {/* Glúteos */}
                <polygon points='260,360 300,370 340,360 355,400 345,440 300,450 255,440 245,400' style={getOverlayStyle('gluteos')} {...hoverProps('gluteos')} />
                
                {/* Posteriores (Pernas Traseiras Altas) */}
                <polygon points='255,440 300,450 295,500 280,560 245,550 240,500' style={getOverlayStyle('posteriores')} {...hoverProps('posteriores')} />
                <polygon points='345,440 300,450 305,500 320,560 355,550 360,500' style={getOverlayStyle('posteriores')} {...hoverProps('posteriores')} />

                {/* Panturrilhas */}
                <polygon points='245,560 280,560 270,680 255,770 235,765 230,680' style={getOverlayStyle('panturrilhas')} {...hoverProps('panturrilhas')} />
                <polygon points='355,560 320,560 330,680 345,770 365,765 370,680' style={getOverlayStyle('panturrilhas')} {...hoverProps('panturrilhas')} />

              </svg>
            </div>

          </div>
        </div>

        {/* Panel remains unchanged */}
        <div className='card' style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span role='img' aria-label='eye' style={{ color: 'var(--primary)' }}>👁️</span>
            Grupos Musculares Específicos
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {muscleGroups.map(mg => {
              const selected = isSelected(mg.id);
              return (
                <button
                  key={mg.id}
                  onClick={() => toggleGroup(mg.id)}
                  style={{
                    background: selected ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                    border: `1px solid ${selected ? '#22c55e' : 'var(--border)'}`,
                    color: selected ? '#22c55e' : 'var(--text-secondary)',
                    padding: '8px 16px',
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s', fontWeight: selected ? '600' : '500'
                  }}
                >
                  {selected && <Check size={14} />} {mg.name}
                </button>
              )
            })}
          </div>
          {selectedGroups.length > 0 && (
            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setSelectedGroups([])} className='btn btn-secondary' style={{ width: '100%' }}>
                Limpar Seleção
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
