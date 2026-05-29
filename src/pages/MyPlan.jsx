import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown, ArrowLeft, ShieldCheck, Sparkles, Users, TrendingUp, Lock } from 'lucide-react';
import { createMercadoPagoPreference } from '../services/paymentService';
import { useAuth, useToast } from '../lib/app-context';
import { getUserPlan, getStudentUsage, isStudentPremium, resolveStudentProfileFromCache } from '../lib/storage';
import { PERSONAL_PLANS } from '../lib/plans';

// ─── Ícones por plano ────────────────────────────────────────────────────────
const PlanIcon = ({ planId, color }) => {
  const size = 22;
  if (planId === 'pro') return <Zap size={size} color={color} />;
  if (planId === 'elite') return <Crown size={size} color={color} />;
  return <Star size={size} color={color} />;
};

// ─── Componente principal ────────────────────────────────────────────────────
export default function MyPlan() {
  const navigate = useNavigate();
  const auth = useAuth();
  const addToast = useToast();
  const [loading, setLoading] = useState(null);
  const [hoveredPlan, setHoveredPlan] = useState(null);

  // Guards contra dados ausentes
  const user = auth?.user?.type === 'aluno' ? resolveStudentProfileFromCache(auth.user) : (auth?.user || null);
  const currentPlanData = getUserPlan() || null;
  const usage = getStudentUsage() || { used: 0, limit: 0, percentage: 0 };
  const isVip = user?.type === 'aluno' && isStudentPremium(user);

  const currentPlanId = currentPlanData?.id || null;

  // Progresso de uso (sem Infinity puro — usa 999 como limite para VIP)
  const usageLimit = usage.limit === Infinity ? 999 : (usage.limit || 0);
  const usagePercent = usageLimit > 0 ? Math.min((usage.used / usageLimit) * 100, 100) : 0;
  const usageDisplayLimit = usage.limit === Infinity || usage.limit >= 999 ? '∞' : String(usage.limit);

  // Cor da barra de progresso
  const barColor =
    usagePercent >= 90
      ? 'linear-gradient(90deg,#ef4444,#dc2626)'
      : usagePercent >= 70
      ? 'linear-gradient(90deg,#f97316,#ea580c)'
      : 'linear-gradient(90deg,#f97316,#fb923c)';

  // ── Handler de pagamento ──────────────────────────────────────────────────
  const handleSubscribe = async (plan) => {
    if (!user) {
      if (addToast) addToast('Faça login para continuar.', 'error');
      navigate('/auth');
      return;
    }

    setLoading(plan.id);
    try {
      const preference = await createMercadoPagoPreference({
        userId: user.id || user.email || 'unknown',
        feature: plan.id,
        amount: plan.priceNum,
      });

      if (preference && preference.init_point) {
        window.open(preference.init_point, '_blank');
        if (addToast) {
          const msg = preference.isFallback
            ? 'Redirecionando ao Mercado Pago...'
            : 'Abrindo checkout para o plano ' + plan.name + '...';
          addToast(msg, 'info');
        }
      } else {
        if (addToast) addToast('Nao foi possivel abrir o checkout. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('[MyPlan] Erro ao criar preferencia:', error);
      if (addToast) addToast('Erro ao iniciar pagamento. Tente novamente.', 'error');
    } finally {
      setLoading(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#fff',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: '80px',
    }}>

      {/* Ambient background glows */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.08), transparent)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'fixed',
        top: '60%',
        left: '-20%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.05), transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '32px 20px',
      }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '48px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '20px',
              padding: 0,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#71717a'; }}
          >
            <ArrowLeft size={15} />
            Voltar ao painel
          </button>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', color: '#f97316', textTransform: 'uppercase', marginBottom: '8px' }}>
                PowerFit Academy
              </p>
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
                Gerenciar{' '}
                <span style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Meu Plano
                </span>
              </h1>
            </div>

            {/* Usage card */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '20px 24px',
              minWidth: '260px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#71717a', textTransform: 'uppercase' }}>
                  <Users size={13} />
                  Uso de Alunos
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f97316' }}>
                  {usage.used} / {usageDisplayLimit}
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: usagePercent + '%',
                  background: barColor,
                  borderRadius: '99px',
                  transition: 'width 1s cubic-bezier(.4,0,.2,1)',
                }} />
              </div>
              {currentPlanData && (
                <p style={{ marginTop: '10px', fontSize: '0.72rem', color: '#52525b', fontWeight: 600 }}>
                  Plano atual: <span style={{ color: '#a1a1aa' }}>{currentPlanData.name || currentPlanId}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── VIP Banner ─────────────────────────────────────── */}
        {isVip && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: '20px',
            padding: '16px 24px',
            marginBottom: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <ShieldCheck color="#f97316" size={20} />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fdba74' }}>
              Plano do aluno em modo demo — acesso PRO ativo por ativacao simulada
            </span>
          </div>
        )}

        {/* ── Plans Grid ─────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'stretch',
        }}>
          {PERSONAL_PLANS.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isLoading = loading === plan.id;
            const isHovered = hoveredPlan === plan.id;
            const isDisabled = isLoading || isCurrent;

            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  position: 'relative',
                  borderRadius: '28px',
                  padding: '1px',
                  background: isCurrent
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.5), rgba(16,185,129,0.3))'
                    : plan.isPopular
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.6), rgba(99,102,241,0.4))'
                    : 'rgba(255,255,255,0.08)',
                  transform: plan.isPopular ? 'scale(1.04)' : isHovered ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'transform 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s cubic-bezier(.4,0,.2,1)',
                  boxShadow: plan.isPopular
                    ? '0 0 60px rgba(59,130,246,0.12), 0 24px 48px rgba(0,0,0,0.5)'
                    : isHovered
                    ? '0 24px 48px rgba(0,0,0,0.4)'
                    : '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                {/* Popular badge */}
                {plan.isPopular && (
                  <div style={{
                    position: 'absolute',
                    top: '-16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg,#2563eb,#4f46e5)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    padding: '5px 16px',
                    borderRadius: '99px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                    zIndex: 10,
                    whiteSpace: 'nowrap',
                  }}>
                    <Sparkles size={9} />
                    Recomendado
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: '-16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    padding: '5px 16px',
                    borderRadius: '99px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 4px 16px rgba(34,197,94,0.4)',
                    zIndex: 10,
                    whiteSpace: 'nowrap',
                  }}>
                    <Check size={9} strokeWidth={3} />
                    Plano Ativo
                  </div>
                )}

                {/* Inner card */}
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(160deg, rgba(25,25,25,0.98), rgba(15,15,15,0.99))',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  borderRadius: '27px',
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}>

                  {/* Ambient glow */}
                  <div style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '180px',
                    height: '180px',
                    background: 'radial-gradient(circle, ' + plan.glowColor + ', transparent 70%)',
                    pointerEvents: 'none',
                    borderRadius: '50%',
                  }} />

                  {/* Plan header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid ' + plan.borderColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <PlanIcon planId={plan.id} color={plan.iconColor} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{plan.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#52525b', fontWeight: 500, marginTop: '2px' }}>{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: '28px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#71717a', marginTop: '6px' }}>R$</span>
                      <span style={{ fontSize: '3.2rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {plan.priceDisplay.split(',')[0]}
                      </span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a1a1aa', marginTop: '4px' }}>
                        ,{plan.priceDisplay.split(',')[1]}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#52525b', fontWeight: 600 }}>por mes — cancele quando quiser</p>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '20px' }} />

                  {/* Features */}
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
                    {plan.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid ' + plan.borderColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}>
                          <Check size={11} color={plan.iconColor} strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 500 }}>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    disabled={isDisabled}
                    onClick={() => handleSubscribe(plan)}
                    onMouseEnter={(e) => {
                      if (!isDisabled) e.currentTarget.style.background = plan.btnHoverGradient;
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled) e.currentTarget.style.background = isCurrent ? 'rgba(34,197,94,0.1)' : plan.btnGradient;
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '16px',
                      border: isCurrent ? '1px solid rgba(34,197,94,0.3)' : 'none',
                      background: isCurrent
                        ? 'rgba(34,197,94,0.1)'
                        : plan.btnGradient,
                      color: isCurrent ? '#22c55e' : '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: isDisabled ? 'default' : 'pointer',
                      opacity: isLoading ? 0.7 : 1,
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isCurrent ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span style={{
                          display: 'inline-block',
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'myplan-spin 0.6s linear infinite',
                        }} />
                        Processando...
                      </>
                    ) : isCurrent ? (
                      <>
                        <Check size={14} strokeWidth={3} />
                        Plano Atual
                      </>
                    ) : (
                      <>
                        <TrendingUp size={14} />
                        Fazer Upgrade
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Security footer ────────────────────────────────── */}
        <div style={{
          marginTop: '64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          opacity: 0.4,
        }}>
          {user?.type === 'aluno' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', textAlign: 'center' }}>
              <ShieldCheck size={16} color="#22c55e" />
              <span>Plano do aluno em modo demo; pagamento real ainda não conectado</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                <ShieldCheck size={16} color="#22c55e" />
                <span>Pagamento 100% seguro via Mercado Pago</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                <Lock size={14} />
                <span>Dados protegidos com criptografia SSL</span>
              </div>
            </>
          )}
          <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>
            PowerFit Academy — v4.0
          </p>
        </div>
      </div>

      {/* Keyframe for spinner — inline style tag, no backtick classname */}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes myplan-spin { to { transform: rotate(360deg); } }' }} />
    </div>
  );
}
