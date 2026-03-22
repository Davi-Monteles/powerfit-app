import { useState } from 'react';
import { useAuth, useToast } from '../App';
import { getStudents, saveStudent, getMercadoPagoToken } from '../lib/storage';
import { Star, Zap, Activity, Clock } from 'lucide-react';

export default function PremiumLobby({ onUpgrade }) {
  const { user } = useAuth();
  const addToast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    const token = getMercadoPagoToken();
    try {
      if (!token) throw new Error('Pagamento indisponível: O Personal Trainer ainda não configurou o Token do Mercado Pago nas Configurações.');
      
      const res = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, title: 'PowerFit Premium', price: 24.90, email: user?.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao comunicar com Mercado Pago');
      
      window.location.href = data.init_point;
    } catch (err) {
      addToast(err.message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="premium-lobby animate-fade-in" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--gradient-primary)', borderRadius: '50%', marginBottom: '16px' }}>
          <Star size={48} color="white" />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Desbloqueie o <span style={{ color: 'var(--primary)' }}>PowerFit Premium</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Leve seus resultados ao próximo nível com análises inteligentes e acesso total ao seu histórico de evolução.
        </p>
      </div>

      <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px', textAlign: 'left' }}>
        
        <div className="feature-card card" style={{ padding: '24px' }}>
          <Zap size={28} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>IA Inteligente</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Avisos automáticos e motivacionais baseados nos seus treinos e objetivos.</p>
        </div>

        <div className="feature-card card" style={{ padding: '24px' }}>
          <Activity size={28} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Análise de Evolução</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Acesso ilimitado aos gráficos de medidas corporais e percentual de gordura.</p>
        </div>

        <div className="feature-card card" style={{ padding: '24px' }}>
          <Clock size={28} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Histórico Completo</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Veja todos os seus treinos passados e progresso de força sem limites.</p>
        </div>
      </div>

      <div className="pricing-card card" style={{ padding: '32px', border: '1px solid var(--primary)', background: 'rgba(255, 107, 53, 0.05)' }}>
        <h2 style={{ marginBottom: '8px' }}>Plano Mensal</h2>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '16px 0', color: 'var(--text-primary)' }}>
          R$ 24,90<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/mês</span>
        </div>
        <button 
          className="btn btn-primary btn-lg" 
          style={{ width: '100%', maxWidth: '300px' }}
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? 'Processando...' : 'Assinar Agora'}
        </button>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px' }}>
          Pagamento simulado via PIX ou Cartão. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
}
