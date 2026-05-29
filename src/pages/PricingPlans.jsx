import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../lib/app-context';
import { getPlans, setUserPlan, getUserPlan, isStudentPremium, resolveStudentProfileFromCache } from '../lib/storage';
import { Zap, CheckCircle, Crown, Shield, Star, ArrowRight, User, GraduationCap } from 'lucide-react';

export default function PricingPlans() {
  const { user: authUser, login } = useAuth();
  const user = authUser?.type === 'aluno' ? resolveStudentProfileFromCache(authUser) : authUser;
  const navigate = useNavigate();
  const addToast = useToast();
  const [loading, setLoading] = useState(null);
  const [selectedType, setSelectedType] = useState(user?.type || 'personal');
  const activeType = user?.type || selectedType;
  
  const plans = getPlans(activeType);
  const currentPlan = getUserPlan();
  const isVip = user?.type === 'aluno' && isStudentPremium(user);

  const planIcons = [Zap, Star, Crown];
  const planColors = ['#3B82F6', '#FF6B35', '#F59E0B'];

  const handleSelectPlan = (planId) => {
    if (!user) {
      addToast('Faça login ou cadastre-se para assinar um plano!', 'info');
      navigate('/auth', { state: { redirectTo: '/pricing', planId, type: activeType } });
      return;
    }
    
    setLoading(planId);
    setTimeout(() => {
      const updatedUser = setUserPlan(planId);
      login(updatedUser);
      addToast(`Plano ${plans.find(p => p.id === planId).name} ativado com sucesso! 🎉`, 'success');
      navigate('/dashboard');
    }, 1200);
  };

  if (isVip) {
    setTimeout(() => navigate('/dashboard'), 100);
    return null;
  }

  return (
    <div className="pricing-page">
      <div className="pricing-bg" />
      <div className="pricing-content animate-slide-up">
        <div className="pricing-header">
          <div className="pricing-logo">
            <div className="pricing-logo-icon"><Zap size={24} /></div>
            <span>PowerFit</span>
          </div>
          <h1>Escolha seu <span className="text-gradient">Plano</span></h1>
          <p>
            {activeType === 'aluno' 
              ? 'Desbloqueie IA Personal e Anatomia 3D para treinar em alto nível.' 
              : 'Gerencie seus alunos e escale sua consultoria com ferramentas profissionais.'}
          </p>

          {!user && (
            <div className="type-toggle">
              <button 
                className={`toggle-btn ${activeType === 'personal' ? 'active' : ''}`}
                onClick={() => setSelectedType('personal')}
              >
                <GraduationCap size={18} />
                Sou Personal
              </button>
              <button 
                className={`toggle-btn ${activeType === 'aluno' ? 'active' : ''}`}
                onClick={() => setSelectedType('aluno')}
              >
                <User size={18} />
                Sou Aluno
              </button>
            </div>
          )}
        </div>

        <div className={`plans-grid ${activeType === 'aluno' ? 'plans-grid-center' : ''}`}>
          {plans.map((plan, i) => {
            const Icon = planIcons[i] || Zap;
            const color = planColors[i] || '#3B82F6';
            const isCurrent = currentPlan?.id === plan.id;
            const isPopular = plan.popular;
            const priceDisplay = plan.priceDisplay || Number(plan.price || 0).toFixed(2).replace('.', ',');

            return (
              <div key={plan.id} className={`plan-card ${isPopular ? 'plan-popular' : ''} ${isCurrent ? 'plan-current' : ''}`}>
                {isPopular && (
                  <div className="plan-badge">🔥 Mais Popular</div>
                )}
                {isCurrent && (
                  <div className="plan-badge plan-badge-current">✓ Plano Atual</div>
                )}
                <div className="plan-icon" style={{ background: `${color}15`, color }}>
                  <Icon size={28} />
                </div>
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  <span className="plan-currency">R$</span>
                  <span className="plan-amount">{priceDisplay.split(',')[0]}</span>
                  <span className="plan-decimal">,{priceDisplay.split(',')[1] || '00'}</span>
                  <span className="plan-period">/mês</span>
                </div>

                {activeType === 'aluno' && plan.id === 'student-pro' && (
                  <p className="plan-info plan-demo-note">Modo demo do aluno: Pagamento real ainda não conectado.</p>
                )}

                {plan.studentLimit !== undefined && (
                  <p className="plan-info">
                    {plan.studentLimit === Infinity ? '∞ Alunos ilimitados' : `Até ${plan.studentLimit} alunos`}
                  </p>
                )}
                
                {activeType === 'aluno' && plan.id === 'student-pro' && (
                  <p className="plan-info highlight">Destaque: IA + Atlas 3D</p>
                )}

                <ul className="plan-features">
                  {plan.features.map((f, j) => (
                    <li key={j}>
                      <CheckCircle size={16} style={{ color, flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn ${isPopular ? 'btn-primary' : 'btn-outline'} btn-lg plan-btn`}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading !== null || isCurrent}
                >
                  {loading === plan.id ? (
                    <span className="plan-loading">Ativando...</span>
                  ) : isCurrent ? (
                    'Plano Ativo'
                  ) : activeType === 'aluno' ? (
                    <>Ativar Demo {plan.name} <ArrowRight size={16} /></>
                  ) : (
                    <>Selecionar {plan.name} <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="pricing-footer">
          <Shield size={16} />
          <span>{activeType === 'aluno' ? 'Modo demo do aluno • Pagamento real ainda não conectado' : 'Pagamento seguro • Cancele a qualquer momento • Sem taxas ocultas'}</span>
        </div>
      </div>

      <style>{`
        .pricing-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
        }

        .type-toggle {
          display: inline-flex;
          background: rgba(255,255,255,0.05);
          padding: 4px;
          border-radius: 12px;
          margin-top: 24px;
          border: 1px solid var(--border);
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .toggle-btn.active {
          background: var(--bg-card);
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .pricing-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 20%, rgba(255,107,53,0.06) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 80%, rgba(59,130,246,0.05) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.04) 0%, transparent 40%),
                      var(--bg-primary);
        }

        .pricing-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1100px;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .pricing-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .pricing-logo-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .pricing-logo span {
          font-size: 1.5rem;
          font-weight: 900;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pricing-header h1 {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .pricing-header p {
          color: var(--text-muted);
          font-size: 1.05rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .text-gradient {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .plans-grid-center {
          display: flex;
          justify-content: center;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .plans-grid-center .plan-card {
          width: 100%;
          max-width: 350px;
        }

        .plan-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          transition: all 0.3s ease;
        }

        .plan-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          border-color: rgba(255,255,255,0.1);
        }

        .plan-popular {
          border-color: var(--primary);
          background: linear-gradient(180deg, rgba(255,107,53,0.05) 0%, var(--bg-card) 40%);
          box-shadow: 0 0 30px rgba(255,107,53,0.1);
        }

        .plan-current {
          border-color: #22C55E;
          box-shadow: 0 0 20px rgba(34,197,94,0.1);
        }

        .plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--gradient-primary);
          color: white;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .plan-badge-current {
          background: linear-gradient(135deg, #22C55E, #16A34A);
        }

        .plan-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          margin-top: 8px;
        }

        .plan-name {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .plan-price {
          display: flex;
          align-items: flex-start;
          gap: 0px;
          margin-bottom: 8px;
        }

        .plan-currency {
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 8px;
          color: var(--text-secondary);
        }

        .plan-amount {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
        }

        .plan-decimal {
          font-size: 1.2rem;
          font-weight: 700;
          margin-top: 8px;
        }

        .plan-period {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: auto;
          margin-bottom: 6px;
          margin-left: 4px;
        }

        .plan-info {
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 20px;
          padding: 6px 14px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
        }

        .plan-info.highlight {
          background: rgba(59,130,246,0.1);
          color: #3B82F6;
        }

        .plan-demo-note {
          background: rgba(6,182,212,0.08);
          border: 1px solid rgba(6,182,212,0.18);
          color: #67e8f9;
          font-size: 0.74rem;
          line-height: 1.35;
          margin-bottom: 12px;
        }

        .plan-features {
          list-style: none;
          text-align: left;
          width: 100%;
          margin-bottom: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .plan-features li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .plan-btn {
          width: 100%;
          border-radius: 12px;
          gap: 8px;
        }

        .plan-loading {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .plan-loading::before {
          content: '';
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .pricing-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.82rem;
        }

        @media (max-width: 1024px) {
          .plans-grid { grid-template-columns: repeat(2, 1fr); }
          .plans-grid-center { display: grid; grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .plans-grid, .plans-grid-center { grid-template-columns: 1fr; max-width: 400px; margin-left: auto; margin-right: auto; }
          .pricing-header h1 { font-size: 1.6rem; }
        }
      `}</style>
    </div>
  );
}
