import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { getUserPlan, getStudentUsage, getPlans, setUserPlan, isVipUser } from '../lib/storage';
import { Crown, Zap, Star, Rocket, CheckCircle, ArrowUpCircle, Shield, Users, TrendingUp, Calendar } from 'lucide-react';

export default function MyPlan() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const addToast = useToast();
  const [loading, setLoading] = useState(null);

  const plan = getUserPlan();
  const usage = getStudentUsage();
  const plans = getPlans();
  const isVip = isVipUser(user?.email);

  const planIcons = { starter: Zap, pro: Star, premium: Crown, elite: Rocket };
  const planColors = { starter: '#3B82F6', pro: '#FF6B35', premium: '#F59E0B', elite: '#8B5CF6' };

  const Icon = planIcons[plan?.id] || Zap;
  const color = planColors[plan?.id] || '#3B82F6';

  const handleUpgrade = (planId) => {
    setLoading(planId);
    setTimeout(() => {
      const updatedUser = setUserPlan(planId);
      login(updatedUser);
      addToast(`Upgrade para ${plans.find(p => p.id === planId).name} realizado! 🚀`, 'success');
      setLoading(null);
    }, 1200);
  };

  if (!plan) {
    navigate('/planos');
    return null;
  }

  const usagePercent = usage.limit === Infinity ? 5 : usage.percentage;
  const barColor = usagePercent > 85 ? '#EF4444' : usagePercent > 60 ? '#F59E0B' : '#22C55E';

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><Crown size={24} style={{ color: 'var(--primary)' }} /> Meu Plano</h2>
      </div>

      {/* Current Plan Card */}
      <div className="myplan-current">
        {isVip && (
          <div className="vip-badge">
            <Shield size={14} /> CONTA VIP — Acesso Total Gratuito
          </div>
        )}
        <div className="myplan-icon" style={{ background: `${color}15`, color }}>
          <Icon size={36} />
        </div>
        <div className="myplan-info">
          <h3>Plano {plan.name}</h3>
          <p className="myplan-price">
            {isVip ? 'Gratuito' : plan.priceLabel + '/mês'}
          </p>
          {plan.planActivatedAt && (
            <p className="myplan-since">
              <Calendar size={14} /> Ativo desde {new Date(user?.planActivatedAt || Date.now()).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Usage Card */}
      <div className="myplan-usage card">
        <h4><Users size={18} /> Uso de Alunos</h4>
        <div className="usage-numbers">
          <span className="usage-current">{usage.used}</span>
          <span className="usage-separator">/</span>
          <span className="usage-limit">{usage.limit === Infinity ? '∞' : usage.limit}</span>
        </div>
        <div className="usage-bar-bg">
          <div className="usage-bar-fill" style={{ width: `${Math.min(usagePercent, 100)}%`, background: barColor }} />
        </div>
        <p className="usage-text">
          {usage.limit === Infinity
            ? 'Você tem alunos ilimitados!'
            : usagePercent > 85
              ? '⚠️ Próximo do limite! Considere fazer upgrade.'
              : `${usage.limit - usage.used} vagas restantes`
          }
        </p>
      </div>

      {/* Features */}
      <div className="card" style={{ padding: '24px' }}>
        <h4 style={{ marginBottom: '16px' }}>✨ Recursos inclusos no seu plano</h4>
        <div className="myplan-features">
          {plan.features.map((f, i) => (
            <div key={i} className="myplan-feature">
              <CheckCircle size={16} style={{ color, flexShrink: 0 }} />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Options */}
      {!isVip && plan.id !== 'elite' && (
        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '16px' }}><ArrowUpCircle size={18} /> Fazer Upgrade</h4>
          <div className="upgrade-grid">
            {plans.filter(p => p.price > plan.price).map(p => {
              const UpIcon = planIcons[p.id];
              const upColor = planColors[p.id];
              return (
                <div key={p.id} className="upgrade-card">
                  <div className="upgrade-icon" style={{ background: `${upColor}15`, color: upColor }}>
                    <UpIcon size={22} />
                  </div>
                  <div className="upgrade-info">
                    <h5>{p.name}</h5>
                    <p>{p.priceLabel}/mês • {p.studentLimit === Infinity ? '∞' : p.studentLimit} alunos</p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleUpgrade(p.id)}
                    disabled={loading !== null}
                  >
                    {loading === p.id ? 'Ativando...' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .myplan-current {
          background: var(--bg-card);
          border: 2px solid ${color}40;
          border-radius: 20px;
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }
        .myplan-current::before {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 120px;
          height: 120px;
          background: ${color};
          filter: blur(80px);
          opacity: 0.15;
        }
        .vip-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: white;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .myplan-icon {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .myplan-info h3 {
          font-size: 1.5rem;
          font-weight: 800;
        }
        .myplan-price {
          font-size: 1.1rem;
          color: ${color};
          font-weight: 600;
          margin-top: 4px;
        }
        .myplan-since {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 0.82rem;
          margin-top: 4px;
        }
        .myplan-usage {
          padding: 24px;
          margin-bottom: 20px;
        }
        .myplan-usage h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .usage-numbers {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 12px;
        }
        .usage-current {
          font-size: 2.5rem;
          font-weight: 800;
          color: ${barColor};
        }
        .usage-separator {
          font-size: 1.5rem;
          color: var(--text-muted);
        }
        .usage-limit {
          font-size: 1.5rem;
          color: var(--text-muted);
        }
        .usage-bar-bg {
          width: 100%;
          height: 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .usage-bar-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.8s ease;
        }
        .usage-text {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .myplan-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .myplan-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }
        .upgrade-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .upgrade-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }
        .upgrade-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .upgrade-info {
          flex: 1;
        }
        .upgrade-info h5 {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .upgrade-info p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .myplan-current { flex-direction: column; text-align: center; }
          .myplan-features { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
