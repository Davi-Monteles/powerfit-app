import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  MessageCircle,
  Radio,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../App';

const features = [
  {
    icon: Users,
    title: 'Gestão de Alunos',
    description: 'Cadastre perfis completos, organize vínculos e acompanhe cada aluno em uma visão profissional.',
  },
  {
    icon: Dumbbell,
    title: 'Criação de Treinos',
    description: 'Monte treinos com exercícios, séries, repetições, observações e rotina semanal em poucos minutos.',
  },
  {
    icon: BarChart3,
    title: 'Evolução com Gráficos',
    description: 'Visualize peso, gordura e medidas para transformar acompanhamento em evidência clara de progresso.',
  },
  {
    icon: Sparkles,
    title: 'IA Personal para Alunos',
    description: 'Entregue respostas mais personalizadas com contexto real de treinos, evolução e objetivo do aluno.',
  },
  {
    icon: MessageCircle,
    title: 'Envio via WhatsApp',
    description: 'Compartilhe treinos e informações importantes pelo canal que seus alunos já usam todos os dias.',
  },
  {
    icon: Radio,
    title: 'Atualizações em Tempo Real',
    description: 'Mantenha treinos, agenda e dados sincronizados para reduzir retrabalho e melhorar a experiência.',
  },
];

const previewMetrics = [
  { label: 'Peso', value: '70kg', trend: '+ consistência' },
  { label: 'Gordura', value: '15%', trend: 'última medição' },
  { label: 'Semana', value: '4x', trend: 'treinos ativos' },
];

export default function Landing() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleCreateOther = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="landing landing-premium">
      <section className="landing-hero">
        <div className="landing-ambient ambient-one" />
        <div className="landing-ambient ambient-two" />
        <div className="landing-grid-overlay" />

        <div className="landing-shell hero-shell">
          <div className="hero-copy animate-fade-in">
            <div className="brand-lockup">
              <div className="brand-mark"><Zap size={24} /></div>
              <span>PowerFit</span>
            </div>

            <div className="hero-kicker">
              <Activity size={16} /> Plataforma premium para personal trainers
            </div>

            <h1>Treinos, alunos, evolução e IA personal em um só app</h1>
            <p className="hero-subheadline">
              O PowerFit ajuda personal trainers a cadastrar alunos, montar treinos, acompanhar evolução e entregar uma experiência mais profissional com IA personalizada.
            </p>

            <div className="hero-actions">
              {user ? (
                <>
                  <Link to={user.type === 'aluno' ? '/aluno' : '/dashboard'}>
                    <button className="btn btn-primary btn-lg">Acessar Meu Painel <ArrowRight size={20} /></button>
                  </Link>
                  <button className="btn btn-outline btn-lg" onClick={handleCreateOther}>
                    Criar Outra Conta
                  </button>
                </>
              ) : (
                <div className="hero-button-group">
                  <div className="hero-button-wrapper">
                    <Link to="/auth?type=personal">
                      <button className="btn btn-primary btn-lg">Sou Personal Trainer <ArrowRight size={20} /></button>
                    </Link>
                    <span className="button-hint">Gerencie seus alunos</span>
                  </div>
                  <div className="hero-button-wrapper">
                    <Link to="/auth?type=aluno">
                      <button className="btn btn-outline btn-lg">Sou Aluno</button>
                    </Link>
                    <span className="button-hint">IA + Atlas 3D + Treinos</span>
                  </div>
                </div>
              )}
            </div>

            <div className="hero-proof-row" aria-label="PowerFit highlights">
              <span><CheckCircle2 size={16} /> Treinos personalizados</span>
              <span><CheckCircle2 size={16} /> Evolução visual</span>
              <span><CheckCircle2 size={16} /> IA com contexto real</span>
            </div>
          </div>

          <div className="product-preview" aria-label="Preview do produto PowerFit">
            <div className="preview-frame">
              <div className="preview-topbar">
                <div>
                  <span className="window-dot orange" />
                  <span className="window-dot" />
                  <span className="window-dot" />
                </div>
                <span>PowerFit / Aluno</span>
              </div>

              <div className="preview-dashboard">
                <aside className="preview-profile">
                  <div className="avatar-ring">DM</div>
                  <strong>Davi Monteles</strong>
                  <span>Hipertrofia</span>
                  <div className="profile-pill"><Target size={14} /> Foco: Peito + Core</div>
                </aside>

                <main className="preview-main">
                  <div className="preview-card workout-card">
                    <div className="card-label"><CalendarCheck size={15} /> Treino de hoje</div>
                    <h3>Upper força e definição</h3>
                    <div className="exercise-list">
                      <span>Supino reto <strong>4x10</strong></span>
                      <span>Remada curvada <strong>4x12</strong></span>
                      <span>Prancha frontal <strong>3x45s</strong></span>
                    </div>
                  </div>

                  <div className="preview-card progress-card">
                    <div className="card-label"><TrendingUp size={15} /> Evolução</div>
                    <div className="metric-grid">
                      {previewMetrics.map(metric => (
                        <div key={metric.label}>
                          <span>{metric.label}</span>
                          <strong>{metric.value}</strong>
                          <small>{metric.trend}</small>
                        </div>
                      ))}
                    </div>
                    <div className="progress-bars">
                      <i style={{ width: '78%' }} />
                      <i style={{ width: '62%' }} />
                      <i style={{ width: '88%' }} />
                    </div>
                  </div>

                  <div className="preview-card ai-card">
                    <div className="ai-badge"><Sparkles size={15} /> IA Personal</div>
                    <p>Na última medição você estava com 70kg e 15% de gordura. Mantenha a progressão no treino de hoje.</p>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section premium-features">
        <div className="landing-shell">
          <div className="features-header">
            <span className="section-eyebrow">Sistema completo</span>
            <h2>Tudo que o personal precisa para acompanhar alunos de perto</h2>
            <p>Uma experiência mais organizada, bonita e confiável para apresentar treinos, evolução e resultados.</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={feature.title} className="feature-card premium-card animate-slide-up" style={{ animationDelay: `${index * 0.06}s` }}>
                <div className="feature-number">0{index + 1}</div>
                <div className="feature-icon"><feature.icon size={22} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section premium-cta">
        <div className="landing-shell">
          <div className="cta-card premium-cta-card">
            <span className="section-eyebrow">Apresentação pronta</span>
            <h2>Pronto para profissionalizar sua gestão?</h2>
            <p>Teste o PowerFit e veja como fica mais fácil acompanhar treinos, evolução e resultados.</p>
            <Link to="/auth?type=personal">
              <button className="btn btn-primary btn-lg">Começar Agora <ArrowRight size={20} /></button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer premium-footer">
        <div className="footer-logo">
          <Zap size={18} />
          <span>PowerFit</span>
        </div>
        <p>© 2025 PowerFit. Todos os direitos reservados.</p>
      </footer>

      <style>{`
        .landing-premium {
          min-height: 100vh;
          background: #070b14;
          color: #f8fafc;
          overflow: hidden;
        }

        .landing-shell {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .landing-hero {
          position: relative;
          min-height: 760px;
          display: flex;
          align-items: center;
          padding: 84px 0 72px;
          isolation: isolate;
        }

        .landing-grid-overlay {
          position: absolute;
          inset: 0;
          z-index: -3;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(circle at 50% 35%, black, transparent 72%);
        }

        .landing-ambient {
          position: absolute;
          border-radius: 999px;
          filter: blur(12px);
          z-index: -2;
          pointer-events: none;
        }

        .ambient-one {
          width: 520px;
          height: 520px;
          left: -180px;
          top: 40px;
          background: radial-gradient(circle, rgba(255,107,53,0.2), transparent 65%);
        }

        .ambient-two {
          width: 640px;
          height: 640px;
          right: -220px;
          top: 120px;
          background: radial-gradient(circle, rgba(59,130,246,0.14), transparent 68%);
        }

        .hero-shell {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(440px, 1.05fr);
          gap: 56px;
          align-items: center;
        }

        .brand-lockup {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          color: #ffffff;
          font-size: 1.35rem;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .brand-mark {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ff6b35, #ff9a62);
          box-shadow: 0 18px 50px rgba(255,107,53,0.34);
          color: white;
        }

        .hero-kicker,
        .section-eyebrow,
        .card-label,
        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #ffb088;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-kicker {
          padding: 8px 12px;
          margin-bottom: 18px;
          border: 1px solid rgba(255,107,53,0.28);
          border-radius: 999px;
          background: rgba(255,107,53,0.08);
          text-transform: none;
          letter-spacing: 0;
        }

        .hero-copy h1 {
          max-width: 680px;
          margin-bottom: 22px;
          color: #ffffff;
          font-size: clamp(2.55rem, 5vw, 5.25rem);
          font-weight: 950;
          letter-spacing: -0.08em;
          line-height: 0.96;
        }

        .hero-subheadline {
          max-width: 620px;
          margin-bottom: 34px;
          color: #b7c3d4;
          font-size: 1.08rem;
          line-height: 1.75;
        }

        .hero-actions,
        .hero-button-group {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .hero-button-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .button-hint {
          color: #7e8ca3;
          font-size: 0.78rem;
          padding-left: 4px;
        }

        .landing-premium .btn-outline {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.04);
          color: #f8fafc;
          backdrop-filter: blur(14px);
        }

        .landing-premium .btn-outline:hover {
          border-color: rgba(255,107,53,0.7);
          background: rgba(255,107,53,0.08);
        }

        .hero-proof-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 30px;
        }

        .hero-proof-row span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #cbd5e1;
          font-size: 0.86rem;
        }

        .hero-proof-row svg { color: #22c55e; }

        .product-preview {
          position: relative;
        }

        .product-preview::before {
          content: '';
          position: absolute;
          inset: 32px -18px -24px 18px;
          border-radius: 34px;
          background: linear-gradient(135deg, rgba(255,107,53,0.26), rgba(59,130,246,0.1));
          filter: blur(30px);
          opacity: 0.9;
        }

        .preview-frame {
          position: relative;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 30px;
          background:
            linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02)),
            rgba(8, 13, 25, 0.92);
          box-shadow: 0 30px 90px rgba(0,0,0,0.55);
          backdrop-filter: blur(18px);
        }

        .preview-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 6px 14px;
          color: #7f8da4;
          font-size: 0.78rem;
        }

        .window-dot {
          display: inline-block;
          width: 9px;
          height: 9px;
          margin-right: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }

        .window-dot.orange { background: #ff6b35; }

        .preview-dashboard {
          display: grid;
          grid-template-columns: 170px 1fr;
          gap: 14px;
          min-height: 440px;
          padding: 14px;
          border-radius: 22px;
          background:
            radial-gradient(circle at 85% 12%, rgba(255,107,53,0.18), transparent 34%),
            #0b1220;
        }

        .preview-profile,
        .preview-card {
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.055);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
        }

        .preview-profile {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 14px;
          border-radius: 20px;
          text-align: center;
        }

        .avatar-ring {
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
          margin-bottom: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,107,53,0.7);
          background: radial-gradient(circle, rgba(255,107,53,0.24), rgba(255,107,53,0.05));
          color: white;
          font-weight: 900;
        }

        .preview-profile strong { color: white; font-size: 0.95rem; }
        .preview-profile > span { color: #94a3b8; font-size: 0.8rem; margin: 3px 0 22px; }

        .profile-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255,107,53,0.12);
          color: #ffc2a6;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .preview-main {
          display: grid;
          grid-template-rows: 1fr auto auto;
          gap: 14px;
        }

        .preview-card {
          padding: 18px;
          border-radius: 20px;
        }

        .workout-card h3 {
          margin: 16px 0;
          color: white;
          font-size: 1.35rem;
          letter-spacing: -0.04em;
        }

        .exercise-list {
          display: grid;
          gap: 10px;
        }

        .exercise-list span {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.055);
          color: #dbe4ef;
          font-size: 0.84rem;
        }

        .exercise-list strong { color: #ffb088; }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 15px 0;
        }

        .metric-grid div {
          padding: 12px;
          border-radius: 14px;
          background: rgba(3,7,18,0.38);
        }

        .metric-grid span,
        .metric-grid small {
          display: block;
          color: #8391a8;
          font-size: 0.68rem;
        }

        .metric-grid strong {
          display: block;
          margin: 3px 0;
          color: white;
          font-size: 1.1rem;
        }

        .progress-bars {
          display: grid;
          gap: 7px;
        }

        .progress-bars i {
          height: 7px;
          border-radius: 999px;
          background: linear-gradient(90deg, #ff6b35, #ffb088);
          box-shadow: 0 0 18px rgba(255,107,53,0.35);
        }

        .ai-card {
          border-color: rgba(255,107,53,0.24);
          background: linear-gradient(135deg, rgba(255,107,53,0.16), rgba(255,255,255,0.055));
        }

        .ai-card p {
          margin-top: 12px;
          color: #f8fafc;
          font-size: 0.88rem;
          line-height: 1.6;
        }

        .premium-features {
          padding: 90px 0;
          background: linear-gradient(180deg, #070b14, #0b1120 42%, #070b14);
        }

        .features-header {
          max-width: 760px;
          margin: 0 auto 46px;
          text-align: center;
        }

        .features-header h2 {
          margin: 12px 0 14px;
          color: white;
          font-size: clamp(2rem, 4vw, 3.55rem);
          font-weight: 900;
          letter-spacing: -0.06em;
        }

        .features-header p {
          color: #a6b2c3;
          font-size: 1rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .premium-card {
          position: relative;
          min-height: 250px;
          padding: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          background:
            linear-gradient(145deg, rgba(255,255,255,0.085), rgba(255,255,255,0.028)),
            rgba(11,17,32,0.72);
          transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }

        .premium-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,107,53,0.34);
          box-shadow: 0 22px 55px rgba(0,0,0,0.32), 0 0 28px rgba(255,107,53,0.12);
        }

        .feature-number {
          position: absolute;
          right: 22px;
          top: 20px;
          color: rgba(255,255,255,0.1);
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.06em;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          margin-bottom: 30px;
          border-radius: 16px;
          background: rgba(255,107,53,0.12);
          color: #ff8c5a;
          box-shadow: inset 0 0 0 1px rgba(255,107,53,0.2);
        }

        .premium-card h3 {
          margin-bottom: 10px;
          color: #ffffff;
          font-size: 1.08rem;
          letter-spacing: -0.02em;
        }

        .premium-card p {
          color: #9aa7ba;
          font-size: 0.9rem;
          line-height: 1.7;
        }

        .premium-cta {
          padding: 86px 0 96px;
          background: #070b14;
        }

        .premium-cta-card {
          position: relative;
          max-width: 920px;
          margin: 0 auto;
          padding: 64px 42px;
          overflow: hidden;
          border: 1px solid rgba(255,107,53,0.22);
          border-radius: 34px;
          text-align: center;
          background:
            radial-gradient(circle at 50% 0%, rgba(255,107,53,0.24), transparent 42%),
            linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025));
          box-shadow: 0 30px 90px rgba(0,0,0,0.4);
        }

        .premium-cta-card h2 {
          margin: 14px auto;
          max-width: 720px;
          color: white;
          font-size: clamp(2rem, 4vw, 3.6rem);
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .premium-cta-card p {
          max-width: 620px;
          margin: 0 auto 30px;
          color: #b7c3d4;
          font-size: 1.02rem;
          line-height: 1.7;
        }

        .premium-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 32px 0;
          border-top: 1px solid rgba(255,255,255,0.09);
        }

        .footer-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #ff8c5a;
          font-weight: 900;
        }

        .landing-footer p {
          color: #67758a;
          font-size: 0.8rem;
        }

        @media (max-width: 980px) {
          .landing-hero { padding-top: 64px; }
          .hero-shell { grid-template-columns: 1fr; gap: 44px; }
          .hero-copy { text-align: center; }
          .hero-subheadline, .hero-copy h1 { margin-left: auto; margin-right: auto; }
          .hero-actions, .hero-button-group, .hero-proof-row { justify-content: center; }
          .product-preview { max-width: 620px; margin: 0 auto; width: 100%; }
          .features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 640px) {
          .landing-shell { width: min(100% - 28px, 1180px); }
          .landing-hero { min-height: auto; padding: 46px 0 52px; }
          .brand-lockup { margin-bottom: 20px; }
          .hero-kicker { font-size: 0.72rem; }
          .hero-copy h1 { font-size: 2.55rem; }
          .hero-subheadline { font-size: 0.98rem; }
          .hero-button-group, .hero-actions { width: 100%; }
          .hero-button-wrapper, .hero-button-wrapper a, .hero-button-wrapper button { width: 100%; }
          .hero-proof-row { align-items: center; flex-direction: column; }
          .preview-frame { padding: 10px; border-radius: 24px; }
          .preview-dashboard { grid-template-columns: 1fr; min-height: auto; padding: 10px; }
          .preview-profile { flex-direction: row; justify-content: flex-start; gap: 12px; text-align: left; }
          .preview-profile > span { margin: 0; }
          .avatar-ring { width: 54px; height: 54px; margin: 0; }
          .profile-pill { margin-left: auto; }
          .metric-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .premium-features, .premium-cta { padding: 58px 0; }
          .premium-card { min-height: auto; }
          .premium-cta-card { padding: 44px 22px; border-radius: 26px; }
          .premium-footer { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}
