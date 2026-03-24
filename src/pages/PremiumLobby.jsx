import { useState } from 'react';
import { useAuth, useToast } from '../App';
import { getMercadoPagoToken } from '../lib/storage';
import { Crown, Star, CheckCircle, Shield, Zap, TrendingUp } from 'lucide-react';

export default function PremiumLobby({ onUpgrade }) {
  const { user } = useAuth();
  const addToast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    const token = getMercadoPagoToken();
    try {
      if (!token) throw new Error('Pagamento indisponível: Seu Personal ainda não liberou a chave de integração!');
      
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

  const benefits = [
    { icon: <Zap size={20} className="text-primary" />, title: "Mapeamento 3D de Assimetria", desc: "Selecione seus pontos fracos na malha 3D e deixe a IA cuidar do resto." },
    { icon: <Star size={20} className="text-primary" />, title: "IA PowerFit Ativa", desc: "Receba alertas no painel caso seu treino acabe gerando desequilíbrio muscular ou falte cardio." },
    { icon: <TrendingUp size={20} className="text-primary" />, title: "Análise de Físico (Evolução)", desc: "Acompanhe todo o seu histórico de peso e percentual de gordura em gráficos interativos." },
    { icon: <Shield size={20} className="text-primary" />, title: "Treinos Personalizados", desc: "Tenha acesso real ao seu instrutor para ajustes ilimitados na sua planilha semanal." }
  ];

  return (
    <div className="premium-lobby animate-fade-in" style={{ padding: '40px 24px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Banner */}
      <div style={{ textAlign: 'center', background: 'var(--bg-card)', padding: '40px 20px', borderRadius: '24px', border: '1px solid rgba(255,107,53,0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', background: 'var(--primary)', width: '150px', height: '150px', filter: 'blur(100px)', opacity: 0.2 }} />
        <Crown size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Pule para o <span className="text-gradient">Próximo Nível</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Você está prestes a desbloquear o acesso total ao mapa do seu corpo e inteligência artificial exclusiva que previne assimetrias e alavanca seus ganhos.
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
            <div className="badge badge-primary" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold' }}>OFERTA OFICIAL</div>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Plano Mensal PRO</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Acesso contínuo sem taxas escondidas.</p>
            
            <div style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0 0 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem', marginTop: '10px', marginRight: '4px' }}>R$</span>
              24,90
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: '10px', marginLeft: '4px' }}>/mês</span>
            </div>

            <ul style={{ textAlign: 'left', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle size={18} className="text-success" /> Suporte VIP no WhatsApp</li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle size={18} className="text-success" /> Cancelamento a qualquer momento</li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle size={18} className="text-success" /> Pagamento 100% via Mercado Pago</li>
            </ul>

            <button 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', borderRadius: '12px', fontSize: '1.1rem', padding: '16px' }}
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? 'Redirecionando Seguro...' : '💳 Assinar e Desbloquear'}
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
