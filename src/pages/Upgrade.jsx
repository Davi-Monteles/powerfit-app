import { useNavigate } from 'react-router-dom';
import { isStudentPremium, resolveStudentProfileFromCache } from '../lib/storage';
import { useAuth } from '../lib/app-context';
import { Crown, Sparkles, Shield, Bot, Target, FileText, Zap, ArrowLeft, Check } from 'lucide-react';

const FEATURES = [
  { icon: Bot, label: 'IA Personal Trainer', desc: 'Assistente inteligente com dicas personalizadas' },
  { icon: FileText, label: 'Relatórios PDF', desc: 'Exporte seus dados e evolução em PDF' },
  { icon: Shield, label: 'Sem Anúncios', desc: 'Experiência limpa e sem interrupções' },
  { icon: Zap, label: 'Suporte Prioritário', desc: 'Atendimento PRO com resposta rápida' },
];

export default function Upgrade() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const resolvedUser = currentUser?.type === 'aluno' ? resolveStudentProfileFromCache(currentUser) : currentUser;
  const hasProAccess = currentUser?.type === 'aluno' && isStudentPremium(resolvedUser);

  // If already PRO, redirect
  if (currentUser && hasProAccess) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.badge}>
            <Crown size={20} color="#fbbf24" />
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>PRO ATIVO</span>
          </div>
          <h1 style={styles.title}>Você já é PRO!</h1>
          <p style={styles.subtitle}>Todos os recursos PRO estão desbloqueados.</p>
          <button onClick={() => navigate(currentUser.type === 'aluno' ? '/aluno' : '/dashboard')} style={styles.btnPrimary}>
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.badge}>
          <Crown size={18} color="#67e8f9" />
          <span style={{ color: '#67e8f9', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>POWERFIT PRO</span>
        </div>
        
        <h1 style={styles.title}>Desbloqueie todo o potencial</h1>
        <p style={styles.subtitle}>Acesso completo à IA, exportação de relatórios PDF e recursos avançados.</p>

        {/* Price */}
        <div style={styles.priceBox}>
          <div style={styles.demoPill}>Em breve</div>
          <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>por apenas</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', justifyContent: 'center' }}>
            <span style={{ fontSize: '1rem', color: '#9ca3af' }}>R$</span>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>29</span>
            <span style={{ fontSize: '1.2rem', color: '#9ca3af' }}>,90</span>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>/mês</span>
          </div>
          <p style={styles.demoCopy}>A contratação será liberada quando o checkout estiver conectado.</p>
        </div>

        {/* Features */}
        <div style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <div key={i} style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <f.icon size={16} color="#67e8f9" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#e5e7eb', fontSize: '0.88rem' }}>{f.label}</div>
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          disabled
          style={{
            ...styles.btnPrimary,
            opacity: 0.65,
            cursor: 'not-allowed',
          }}
        >
          <Sparkles size={18} />
          <span>Indisponível no piloto</span>
        </button>
        
        <p style={{ color: '#4b5563', fontSize: '0.72rem', textAlign: 'center', marginTop: '8px' }}>
          Nenhuma cobrança será realizada
        </p>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={styles.btnBack}>
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #0a1628 50%, #0f0f1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: 'rgba(15, 30, 50, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px 32px',
    maxWidth: '440px',
    width: '100%',
    border: '1px solid rgba(34, 211, 238, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 80px rgba(34, 211, 238, 0.05)',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#fff',
    textAlign: 'center',
    margin: '0 0 8px 0',
    lineHeight: 1.2,
  },
  subtitle: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: '0.9rem',
    margin: '0 0 24px 0',
  },
  priceBox: {
    textAlign: 'center',
    padding: '20px',
    marginBottom: '24px',
    borderRadius: '16px',
    background: 'rgba(34, 211, 238, 0.08)',
    border: '1px solid rgba(34, 211, 238, 0.15)',
  },
  demoPill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 10px',
    borderRadius: '999px',
    marginBottom: '10px',
    background: 'rgba(103, 232, 249, 0.1)',
    border: '1px solid rgba(103, 232, 249, 0.18)',
    color: '#67e8f9',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  demoCopy: {
    color: '#94a3b8',
    fontSize: '0.72rem',
    lineHeight: 1.4,
    margin: '10px 0 0',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '28px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  featureIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(34, 211, 238, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  btnPrimary: {
    width: '100%',
    padding: '16px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)',
  },
  btnBack: {
    width: '100%',
    padding: '12px',
    marginTop: '12px',
    borderRadius: '12px',
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'color 0.2s ease',
  },
};
