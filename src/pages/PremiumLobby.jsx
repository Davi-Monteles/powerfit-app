import { useState } from 'react';
import { useAuth, useToast } from '../App';
import { STUDENT_PLANS } from '../lib/storage';
import { Crown, Star, CheckCircle, Shield, Zap, TrendingUp } from 'lucide-react';

export default function PremiumLobby({ onUpgrade }) {
  const { user } = useAuth();
  const addToast = useToast();
  const [loading, setLoading] = useState(false);
  const plan = STUDENT_PLANS[1];

  const handleSubscribe = async () => {
    setLoading(true);
    // Para alunos independentes, usamos a funcionalidade de simulação da demo
    setTimeout(() => {
      addToast('Redirecionando para o Checkout Seguro...', 'success');
      // Na demo, simulamos o sucesso após 2 segundos
      setTimeout(() => {
        onUpgrade();
        addToast('Assinatura PRO ativada! Bem-vindo ao próximo nível.', 'success');
      }, 2000);
    }, 1000);
  };

  const benefits = [
    { icon: <Zap size={20} className="text-primary" />, title: "IA Personal Trainer", desc: "Uma inteligência artificial treinada para analisar seus treinos e sugerir ajustes baseados na sua evolução." },
    { icon: <Star size={20} className="text-primary" />, title: "Atlas Anatômico 3D", desc: "Mapeie seu corpo em uma malha 3D interativa para visualizar assimetrias e foco muscular." },
    { icon: <TrendingUp size={20} className="text-primary" />, title: "Gráficos de Evolução Pro", desc: "Acompanhe todo o seu histórico com métricas avançadas e relatórios de desempenho." },
    { icon: <Shield size={20} className="text-primary" />, title: "Treino sem Limites", desc: "Acesse todas as funcionalidades da plataforma mesmo sem um Personal Trainer vinculado." }
  ];

  return (
    <div className="premium-lobby animate-fade-in" style={{ padding: '40px 24px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Banner */}
      <div style={{ textAlign: 'center', background: 'var(--bg-card)', padding: '40px 20px', borderRadius: '24px', border: '1px solid rgba(255,107,53,0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', background: 'var(--primary)', width: '150px', height: '150px', filter: 'blur(100px)', opacity: 0.2 }} />
        <Crown size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Treine como um <span className="text-gradient">PRO</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Desbloqueie o acesso total à IA Personal e ao Atlas 3D para treinar com a tecnologia mais avançada do mercado.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Benefits List */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>O que você ganha no plano PRO:</h2>
          {benefits.map((b, i) => (
            <div key={i} className="card hover-glow" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '20px', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ padding: '10px', background: 'rgba(255, 107, 53, 0.1)', borderRadius: '12px' }}>{b.icon}</div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{b.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Card */}
        <div style={{ flex: '1 1 300px' }}>
          <div className="card" style={{ padding: '32px', textAlign: 'center', border: '2px solid var(--primary)', position: 'sticky', top: '24px' }}>
            <div className="badge badge-primary" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold' }}>EXCLUSIVO ALUNOS</div>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{plan.name}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Autonomia total nos seus treinos.</p>
            
            <div style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0 0 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem', marginTop: '10px', marginRight: '4px' }}>R$</span>
              {plan.price.toString().split('.')[0]}
              <span style={{ fontSize: '1.2rem', marginTop: '10px' }}>,{plan.price.toString().split('.')[1] || '00'}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: '10px', marginLeft: '4px' }}>/mês</span>
            </div>

            <ul style={{ textAlign: 'left', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle size={18} className="text-success" /> IA Trainer 24h Disponível</li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle size={18} className="text-success" /> Atlas Anatômico 3D Completo</li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle size={18} className="text-success" /> Sem anúncios e interrupções</li>
            </ul>

            <button 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', borderRadius: '12px', fontSize: '1.1rem', padding: '16px' }}
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? 'Processando...' : '💳 Assinar e Desbloquear'}
            </button>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
               <Shield size={14} /> Transação Criptografada
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
