import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  FileText,
  LayoutDashboard,
  Menu,
  Play,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Weight,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../lib/app-context';
import PwaInstallHint from '../components/PwaInstallHint';

const ASSET_PATH = '/powerfit/landing';

const features = [
  {
    icon: Users,
    title: 'Gestao de alunos',
    text: 'Organize sua base de alunos, registre avaliacoes, anamnese e historico completo.',
  },
  {
    icon: Dumbbell,
    title: 'Treinos personalizados',
    text: 'Monte e periodize treinos com facilidade e envie em segundos para seus alunos.',
  },
  {
    icon: TrendingUp,
    title: 'Acompanhamento & evolucao',
    text: 'Acompanhe desempenho, cargas, medidas e progresso com relatorios visuais.',
  },
  {
    icon: Sparkles,
    title: 'IA para personal',
    text: 'Receba insights, sugestoes de ajustes e analises inteligentes para decidir melhor.',
  },
];

const studentPoints = [
  { icon: Smartphone, text: 'Acesso rapido ao treino com videos e instrucoes' },
  { icon: Weight, text: 'Registro de cargas e repeticoes' },
  { icon: CalendarDays, text: 'Historico e evolucao sempre a mao' },
  { icon: Bell, text: 'Lembretes e notificacoes para nao perder o foco' },
];

const personalPoints = [
  { icon: LayoutDashboard, text: 'Alunos e treinos organizados em um so lugar' },
  { icon: AlertTriangle, text: 'Aderencia e alertas rapidos de evolucao' },
  { icon: BarChart3, text: 'Decisoes guiadas por dados e inteligencia' },
  { icon: FileText, text: 'Relatorios completos de progresso' },
];

const exercises = [
  { name: 'Supino reto', sets: '4x10', done: true },
  { name: 'Supino inclinado', sets: '3x12', done: true },
  { name: 'Crucifixo', sets: '3x15', done: false },
  { name: 'Triceps pulley', sets: '4x12', done: false },
];

const students = [
  { name: 'Lucas Mendes', evo: '+67%', last: 'Hoje', adherence: '96%' },
  { name: 'Juliana Santos', evo: '+43%', last: 'Ontem', adherence: '92%' },
  { name: 'Rafael Oliveira', evo: '+75%', last: '2 dias', adherence: '90%' },
  { name: 'Beatriz Lima', evo: '+50%', last: 'Hoje', adherence: '98%' },
];

const galleryImages = [
  'panel-deadlift-1.jpg',
  'panel-deadlift-2.jpg',
  'panel-kettlebell.jpg',
  'panel-grip.jpg',
  'panel-press.jpg',
  'panel-coaching.jpg',
  'panel-review.jpg',
  'panel-boxjump.jpg',
  'panel-sprint.jpg',
  'panel-ropes.jpg',
  'panel-pullup.jpg',
  'panel-deadlift-1.jpg',
];

const tickerItems = ['MENOS PLANILHA', 'MAIS ACOMPANHAMENTO', 'EVOLUCAO REAL'];

const footerLinks = [
  {
    title: 'Produto',
    links: [
      { label: 'Produto', href: '#produto' },
      { label: 'Recursos', href: '#recursos' },
      { label: 'Para Personal', href: '#personal' },
      { label: 'Para Aluno', href: '#alunos' },
      { label: 'Atualizações', to: '/atualizacoes' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nós', to: '/sobre' },
      { label: 'Contato', href: 'https://wa.me/5598988666810', external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Termos', to: '/termos' },
      { label: 'Privacidade', to: '/privacidade' },
      { label: 'Segurança', to: '/seguranca' },
    ],
  },
];

function FooterLink({ link }) {
  if (link.to) return <Link to={link.to}>{link.label}</Link>;
  return (
    <a
      href={link.href}
      target={link.external ? '_blank' : undefined}
      rel={link.external ? 'noreferrer' : undefined}
      onClick={event => handleSectionLinkClick(event, link.href)}
    >
      {link.label}
    </a>
  );
}

function handleSectionLinkClick(event, href) {
  if (!href?.startsWith('#')) return;
  const section = document.querySelector(href);
  if (!section) return;

  event.preventDefault();
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.pushState(null, '', href);
}

function LogoMark() {
  return (
    <Link to="/" className="pf-logo" aria-label="PowerFit">
      <span><Zap size={18} fill="currentColor" /></span>
      <strong>PowerFit</strong>
    </Link>
  );
}

function AuthCta({ user, onCreateOther, compact = false }) {
  if (user) {
    return (
      <>
        <Link to={user.type === 'aluno' ? '/aluno' : '/dashboard'} className={`pf-button primary ${compact ? '' : 'large'}`}>
          Acessar painel <ArrowRight size={17} />
        </Link>
        {!compact && (
          <button type="button" className="pf-button outline large" onClick={onCreateOther}>
            Criar outra conta
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <Link to="/auth?type=personal" className={`pf-button primary ${compact ? '' : 'large'}`}>
        Comecar agora <ChevronRight size={17} />
      </Link>
      {!compact && (
        <Link to="/auth?type=aluno" className="pf-button outline large">
          Entrar como aluno
        </Link>
      )}
    </>
  );
}

function WorkoutPhone() {
  return (
    <div className="pf-phone-mockup" aria-label="Mockup do treino do aluno">
      <div className="pf-phone-notch" aria-hidden="true" />
      <div className="pf-phone-screen">
        <span className="pf-overline">Treino de hoje</span>
        <h3>Peito e triceps</h3>
        <div className="pf-exercise-list">
          {exercises.map(exercise => (
            <div className="pf-exercise-row" key={exercise.name}>
              <span className={exercise.done ? 'done' : ''}>{exercise.done && <Check size={12} />}</span>
              <div>
                <strong>{exercise.name}</strong>
                <small>{exercise.sets}</small>
              </div>
            </div>
          ))}
        </div>
        <span className="pf-phone-cta">Iniciar treino</span>
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="pf-dashboard-mockup" aria-label="Mockup do painel do personal">
      <div className="pf-dashboard-topbar">
        <LogoMark />
      </div>
      <div className="pf-dashboard-body">
        <aside>
          {['Visao geral', 'Alunos', 'Treinos', 'Avaliacoes', 'Relatorios', 'Mensagens', 'Configuracoes'].map((item, index) => (
            <span className={index === 1 ? 'active' : ''} key={item}>{item}</span>
          ))}
        </aside>
        <div className="pf-dashboard-main">
          <div className="pf-dashboard-heading">
            <h3>Alunos</h3>
            <div>
              <span>Todos</span>
              <span className="active">Ativos</span>
            </div>
          </div>
          <div className="pf-search-preview">Buscar aluno...</div>
          <div className="pf-students-preview">
            {students.map((student, index) => (
              <div className="pf-student-preview" key={student.name}>
                <i style={{ background: `linear-gradient(135deg, hsl(${210 + index * 22}, 42%, 35%), hsl(${210 + index * 22}, 34%, 18%))` }} />
                <strong>{student.name}</strong>
                <span>{student.evo}</span>
                <small>{student.last}</small>
                <em>{student.adherence}</em>
              </div>
            ))}
          </div>
          <button type="button">Ver todos os alunos</button>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCreateOther = () => {
    logout();
    navigate('/auth');
  };

  const handleCloseMenu = () => setMobileMenuOpen(false);

  return (
    <main className="pf-landing">
      <header className="pf-nav-shell">
        <div className="pf-container pf-nav-inner">
          <LogoMark />

          <nav className="pf-nav-links" aria-label="Navegacao principal">
            <a href="#recursos" onClick={event => handleSectionLinkClick(event, '#recursos')}>Recursos</a>
            <a href="#personal" onClick={event => handleSectionLinkClick(event, '#personal')}>Para Personal</a>
            <a href="#alunos" onClick={event => handleSectionLinkClick(event, '#alunos')}>Para Aluno</a>
          </nav>

          <div className="pf-nav-actions">
            {user ? (
              <Link to={user.type === 'aluno' ? '/aluno' : '/dashboard'} className="pf-login-link">Meu painel</Link>
            ) : (
              <Link to="/auth" className="pf-login-link">Entrar</Link>
            )}
            <AuthCta user={user} onCreateOther={handleCreateOther} compact />
          </div>

          <button
            type="button"
            className="pf-menu-button"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(open => !open)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="pf-mobile-menu">
            <a href="#recursos" onClick={event => { handleSectionLinkClick(event, '#recursos'); handleCloseMenu(); }}>Recursos</a>
            <a href="#personal" onClick={event => { handleSectionLinkClick(event, '#personal'); handleCloseMenu(); }}>Para Personal</a>
            <a href="#alunos" onClick={event => { handleSectionLinkClick(event, '#alunos'); handleCloseMenu(); }}>Para Aluno</a>
            <Link to="/auth" onClick={handleCloseMenu}>Entrar</Link>
            <Link to="/auth?type=personal" className="pf-button primary" onClick={handleCloseMenu}>Comecar agora</Link>
          </div>
        )}
      </header>

      <section className="pf-hero" id="produto" aria-labelledby="pf-hero-title">
        <div className="pf-hero-image" aria-hidden="true">
          <img src={`${ASSET_PATH}/hero-trainer.jpg`} alt="" />
        </div>
        <div className="pf-hero-grain" aria-hidden="true" />
        <div className="pf-container pf-hero-content">
          <div className="pf-hero-copy">
            <span className="pf-kicker">Plataforma para personal</span>
            <h1 id="pf-hero-title">
              Treinos, alunos e <br /><span>evolucao</span> em um <br />so lugar.
            </h1>
            <p>Organize treinos, acompanhe progresso e use IA como apoio para cuidar melhor da evolucao dos seus alunos.</p>
            <div className="pf-hero-actions">
              <AuthCta user={user} onCreateOther={handleCreateOther} />
              <a href="#recursos" className="pf-button outline large" onClick={event => handleSectionLinkClick(event, '#recursos')}>
                <Play size={15} fill="currentColor" /> Ver como funciona
              </a>
            </div>
            <PwaInstallHint />
            <div className="pf-status-row" aria-label="Status do produto">
              <span><Check size={15} /> Projeto em evolucao com primeiros parceiros</span>
              <span><Check size={15} /> Foco em alunos, treinos e evolucao</span>
            </div>
          </div>
        </div>
      </section>

      <div className="pf-ticker" aria-hidden="true">
        <div>
          {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`}>* {item}</span>
          ))}
        </div>
      </div>

      <section className="pf-section pf-features" id="recursos">
        <div className="pf-container">
          <div className="pf-section-heading centered">
            <h2>Tudo que o personal precisa<br /> para <span>entregar mais resultados</span></h2>
            <p>Ferramentas completas para organizar, acompanhar e evoluir.</p>
          </div>
          <div className="pf-feature-grid">
            {features.map(feature => {
              const Icon = feature.icon;
              return (
                <article className="pf-feature-card" key={feature.title}>
                  <div className="pf-grain" aria-hidden="true" />
                  <div><Icon size={26} strokeWidth={1.6} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pf-section pf-experience" id="alunos">
        <div className="pf-grain" aria-hidden="true" />
        <div className="pf-container pf-experience-stack">
          <div className="pf-experience-row student">
            <div className="pf-mockup-wrap">
              <WorkoutPhone />
            </div>
            <div className="pf-experience-copy">
              <span className="pf-kicker">Experiencia do aluno</span>
              <h2>O treino fica simples no celular.</h2>
              <p>O aluno ve o treino do dia, registra progresso e entende o que fazer sem depender de mensagens soltas.</p>
              <div className="pf-point-list">
                {studentPoints.map(point => {
                  const Icon = point.icon;
                  return <span key={point.text}><Icon size={17} /> {point.text}</span>;
                })}
              </div>
            </div>
          </div>

          <div className="pf-experience-row personal" id="personal">
            <div className="pf-experience-copy">
              <span className="pf-kicker">Experiencia do personal</span>
              <h2>Controle para acompanhar de perto.</h2>
              <p>O personal enxerga rotina, aderencia e resultados para ajustar treinos com mais seguranca.</p>
              <div className="pf-point-list">
                {personalPoints.map(point => {
                  const Icon = point.icon;
                  return <span key={point.text}><Icon size={17} /> {point.text}</span>;
                })}
              </div>
            </div>
            <div className="pf-mockup-wrap wide">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      <section className="pf-ai-section" id="ia">
        <div className="pf-container pf-ai-heading">
          <span className="pf-kicker">Inteligencia artificial</span>
          <h2>IA que entende o que seus alunos precisam</h2>
        </div>
        <div className="pf-gallery" aria-label="Cenas de treino usadas como referencia visual">
          {galleryImages.map((image, index) => (
            <figure className="pf-gallery-panel" key={`${image}-${index}`}>
              <img src={`${ASSET_PATH}/${image}`} alt={`Cena de treino ${index + 1}`} />
            </figure>
          ))}
        </div>
        <div className="pf-container">
          <div className="pf-ai-card">
            <div className="pf-ai-orb" aria-hidden="true"><Brain size={30} /></div>
            <h3>A IA do PowerFit analisa padroes de treino, sugere ajustes e ajuda voce a tomar decisoes melhores para cada aluno.</h3>
          </div>
        </div>
      </section>

      <section className="pf-final-cta" id="comece">
        <div className="pf-container pf-final-card">
          <h2>Pronto para evoluir seus alunos com o <span>PowerFit</span>?</h2>
          <p>Comece pela rotina essencial: alunos, treinos, evolucao e uma experiencia mobile mais profissional.</p>
          <div className="pf-final-actions">
            <AuthCta user={user} onCreateOther={handleCreateOther} />
          </div>
          <div className="pf-final-notes">
            <span><Check size={15} /> Primeira versao focada no essencial</span>
            <span><Check size={15} /> IA como apoio do personal</span>
          </div>
        </div>
      </section>

      <footer className="pf-footer">
        <div className="pf-container pf-footer-grid">
          <div className="pf-footer-brand">
            <LogoMark />
            <p>Treinos, alunos e evolucao.<br />Tudo em um so lugar.</p>
            <a className="pf-footer-whatsapp" href="https://wa.me/5598988666810" target="_blank" rel="noreferrer">
              Falar no WhatsApp
            </a>
          </div>
          {footerLinks.map(({ title, links }) => (
            <div className="pf-footer-column" key={title}>
              <h3>{title}</h3>
              {links.map(link => <FooterLink link={link} key={link.label} />)}
            </div>
          ))}
        </div>
        <div className="pf-footer-bottom">© 2026 PowerFit. Todos os direitos reservados.</div>
      </footer>

      <style>{`
        .pf-landing {
          min-height: 100vh;
          overflow-x: hidden;
          background: #050914;
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .pf-container {
          width: min(1280px, calc(100% - 48px));
          margin: 0 auto;
        }

        #produto,
        #recursos,
        #personal,
        #alunos,
        #comece {
          scroll-margin-top: 86px;
        }

        .pf-nav-shell {
          position: fixed;
          inset: 0 0 auto 0;
          z-index: 50;
          min-height: 72px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(5, 9, 20, 0.62);
          backdrop-filter: blur(14px);
        }

        .pf-nav-inner {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }

        .pf-logo {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #fff;
          letter-spacing: -0.03em;
        }

        .pf-logo span {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #ff5b22;
          color: #fff;
          box-shadow: 0 14px 30px rgba(255, 91, 34, 0.28);
        }

        .pf-logo strong {
          color: #fff;
          font-size: 1.05rem;
          font-weight: 800;
        }

        .pf-nav-links,
        .pf-nav-actions {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .pf-nav-links a,
        .pf-login-link {
          color: rgba(226, 232, 240, 0.68);
          font-size: 0.82rem;
          font-weight: 600;
          transition: color 180ms ease;
        }

        .pf-nav-links a:hover,
        .pf-login-link:hover,
        .pf-footer a:hover {
          color: #fff;
        }

        .pf-menu-button {
          display: none;
          width: 40px;
          height: 40px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
        }

        .pf-mobile-menu {
          display: grid;
          gap: 8px;
          width: min(100% - 32px, 480px);
          margin: 0 auto 16px;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          background: rgba(7, 17, 31, 0.96);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.36);
        }

        .pf-mobile-menu a {
          padding: 10px;
          color: rgba(226, 232, 240, 0.76);
          font-size: 0.92rem;
          font-weight: 700;
        }

        .pf-button {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 17px;
          border: 1px solid transparent;
          border-radius: 8px;
          color: #fff;
          font-family: inherit;
          font-size: 0.84rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
        }

        .pf-button:hover {
          transform: translateY(-2px);
        }

        .pf-button.primary {
          background: #ff5b22;
          box-shadow: 0 18px 36px rgba(255, 91, 34, 0.24);
        }

        .pf-button.primary:hover {
          background: #ff7444;
          box-shadow: 0 20px 42px rgba(255, 91, 34, 0.34);
        }

        .pf-button.outline {
          border-color: rgba(255, 255, 255, 0.24);
          background: rgba(255, 255, 255, 0.02);
        }

        .pf-button.outline:hover {
          border-color: rgba(255, 91, 34, 0.58);
          color: #ff9a76;
        }

        .pf-button.large {
          min-height: 52px;
          padding: 0 26px;
          font-size: 0.95rem;
        }

        .pf-hero {
          position: relative;
          min-height: 760px;
          display: flex;
          align-items: center;
          overflow: hidden;
          isolation: isolate;
        }

        .pf-hero-image {
          position: absolute;
          inset: 0;
          z-index: -2;
        }

        .pf-hero-image img {
          width: 100%;
          height: 116%;
          object-fit: cover;
          object-position: 58% 30%;
          filter: saturate(0.94) contrast(1.12) brightness(0.76);
        }

        /* Dither overlay: breaks up 8-bit gradient banding ("chuvisco") on dark
           panels. Sub-perceptible at 1x; only randomizes the quantization steps. */
        .pf-hero-grain {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'160'%20height%3D'160'%3E%3Cfilter%20id%3D'n'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'0.9'%20numOctaves%3D'2'%20stitchTiles%3D'stitch'%2F%3E%3CfeColorMatrix%20type%3D'saturate'%20values%3D'0'%2F%3E%3CfeComponentTransfer%3E%3CfeFuncR%20type%3D'linear'%20slope%3D'1.35'%20intercept%3D'-0.1750'%2F%3E%3CfeFuncG%20type%3D'linear'%20slope%3D'1.35'%20intercept%3D'-0.1750'%2F%3E%3CfeFuncB%20type%3D'linear'%20slope%3D'1.35'%20intercept%3D'-0.1750'%2F%3E%3C%2FfeComponentTransfer%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23n)'%2F%3E%3C%2Fsvg%3E");
          background-size: 64px 64px;
          mix-blend-mode: overlay;
          opacity: 0.6;
        }

        .pf-grain {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'160'%20height%3D'160'%3E%3Cfilter%20id%3D'n'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'0.9'%20numOctaves%3D'2'%20stitchTiles%3D'stitch'%2F%3E%3CfeColorMatrix%20type%3D'saturate'%20values%3D'0'%2F%3E%3CfeComponentTransfer%3E%3CfeFuncR%20type%3D'linear'%20slope%3D'1.35'%20intercept%3D'-0.1750'%2F%3E%3CfeFuncG%20type%3D'linear'%20slope%3D'1.35'%20intercept%3D'-0.1750'%2F%3E%3CfeFuncB%20type%3D'linear'%20slope%3D'1.35'%20intercept%3D'-0.1750'%2F%3E%3C%2FfeComponentTransfer%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23n)'%2F%3E%3C%2Fsvg%3E");
          background-size: 64px 64px;
          mix-blend-mode: overlay;
          opacity: 0.6;
        }

        .pf-hero::before,
        .pf-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
        }

        .pf-hero::before {
          background:
            linear-gradient(90deg, #050914 0%, rgba(5, 9, 20, 0.98) 30%, rgba(5, 9, 20, 0.72) 54%, rgba(5, 9, 20, 0.18) 76%, rgba(5, 9, 20, 0.04) 100%),
            radial-gradient(circle at 18% 44%, rgba(255, 91, 34, 0.16), transparent 30%);
        }

        .pf-hero::after {
          background:
            linear-gradient(0deg, #050914 0%, rgba(5, 9, 20, 0.86) 12%, rgba(5, 9, 20, 0) 38%),
            linear-gradient(180deg, rgba(5, 9, 20, 0.36), rgba(5, 9, 20, 0) 30%);
        }

        .pf-hero-content {
          position: relative;
          z-index: 2;
          padding-top: 72px;
        }

        .pf-hero-copy {
          max-width: 720px;
          padding: 112px 0 78px;
        }

        .pf-kicker {
          display: inline-flex;
          align-items: center;
          color: #ff5b22;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pf-hero h1 {
          margin: 20px 0 22px;
          max-width: 760px;
          color: #fff;
          font-size: clamp(3.25rem, 6.35vw, 6rem);
          line-height: 0.98;
          letter-spacing: -0.068em;
          font-weight: 900;
        }

        .pf-hero h1 span,
        .pf-section-heading h2 span,
        .pf-final-card h2 span {
          color: #ff5b22;
        }

        .pf-hero p {
          max-width: 540px;
          color: rgba(236, 242, 250, 0.82);
          font-size: 1.1rem;
          line-height: 1.7;
          text-shadow: 0 1px 24px rgba(0, 0, 0, 0.5);
        }

        .pf-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .pf-hero-actions .pf-button.large {
          min-width: 178px;
        }

        .pf-status-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 28px;
          color: rgba(226, 232, 240, 0.68);
          font-size: 0.8rem;
          font-weight: 700;
        }

        .pf-status-row span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 34px;
          padding: 0 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(8, 14, 24, 0.56);
        }

        .pf-status-row svg {
          color: #ff6b35;
          flex: 0 0 auto;
        }

        .pf-ticker {
          height: 56px;
          display: flex;
          align-items: center;
          overflow: hidden;
          border-block: 1px solid rgba(255, 255, 255, 0.05);
          background: #0a1422;
        }

        .pf-ticker div {
          display: flex;
          gap: 42px;
          width: max-content;
          animation: pf-marquee 36s linear infinite;
        }

        .pf-ticker span {
          flex: 0 0 auto;
          color: rgba(226, 232, 240, 0.62);
          font-size: 0.73rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pf-section {
          padding: 106px 0;
        }

        .pf-section-heading {
          margin-bottom: 54px;
        }

        .pf-section-heading.centered {
          text-align: center;
        }

        .pf-section-heading h2,
        .pf-experience-copy h2,
        .pf-ai-heading h2,
        .pf-final-card h2 {
          color: #fff;
          font-size: clamp(2.2rem, 4.7vw, 4.6rem);
          line-height: 1.02;
          letter-spacing: -0.06em;
          font-weight: 900;
        }

        .pf-section-heading p,
        .pf-experience-copy p,
        .pf-final-card p {
          color: rgba(226, 232, 240, 0.62);
          font-size: 1rem;
          line-height: 1.72;
        }

        .pf-section-heading p {
          max-width: 560px;
          margin: 18px auto 0;
        }

        .pf-feature-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .pf-feature-card {
          position: relative;
          overflow: hidden;
          min-height: 250px;
          padding: 28px;
          border: 1px solid rgba(255, 255, 255, 0.075);
          border-radius: 24px;
          background: linear-gradient(145deg, rgba(12, 23, 39, 0.94), rgba(8, 15, 27, 0.86));
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
          transition: transform 220ms ease, border-color 220ms ease;
        }

        .pf-feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.75;
          background: radial-gradient(circle at 12% 0%, rgba(255, 91, 34, 0.18), transparent 34%);
          pointer-events: none;
        }

        .pf-feature-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 91, 34, 0.26);
        }

        .pf-feature-card > * {
          position: relative;
          z-index: 1;
        }

        .pf-feature-card > .pf-grain {
          z-index: 0;
        }

        .pf-feature-card div {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 91, 34, 0.34);
          border-radius: 15px;
          color: #ff6b35;
          background: rgba(255, 91, 34, 0.06);
        }

        .pf-feature-card h3 {
          margin: 28px 0 12px;
          color: #fff;
          font-size: 1.18rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .pf-feature-card p {
          color: rgba(226, 232, 240, 0.58);
          font-size: 0.94rem;
          line-height: 1.65;
        }

        .pf-experience {
          position: relative;
          isolation: isolate;
          background: linear-gradient(180deg, #050914 0%, #07111f 48%, #050914 100%);
        }

        .pf-experience-stack {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 116px;
        }

        .pf-experience-row {
          display: grid;
          grid-template-columns: minmax(280px, 0.92fr) minmax(0, 1.08fr);
          align-items: center;
          gap: 72px;
        }

        .pf-experience-row.personal {
          grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
        }

        .pf-experience-copy h2 {
          margin: 16px 0 18px;
          max-width: 600px;
          font-size: clamp(2.25rem, 4vw, 4rem);
        }

        .pf-experience-copy p {
          max-width: 570px;
        }

        .pf-point-list {
          display: grid;
          gap: 16px;
          margin-top: 30px;
        }

        .pf-point-list span {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(226, 232, 240, 0.72);
          font-size: 0.96rem;
          font-weight: 600;
        }

        .pf-point-list svg {
          color: #ff5b22;
          flex: 0 0 auto;
        }

        .pf-mockup-wrap {
          position: relative;
          display: grid;
          place-items: center;
          min-height: 420px;
        }

        .pf-mockup-wrap::before {
          content: '';
          position: absolute;
          width: 72%;
          aspect-ratio: 1;
          border-radius: 999px;
          background: rgba(255, 91, 34, 0.08);
          filter: blur(56px);
        }

        .pf-phone-mockup {
          position: relative;
          z-index: 1;
          width: min(320px, 100%);
          overflow: hidden;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-radius: 42px;
          background: #0b1120;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.54);
        }

        .pf-phone-notch {
          position: absolute;
          top: 0;
          left: 50%;
          z-index: 2;
          width: 112px;
          height: 24px;
          transform: translateX(-50%);
          border-radius: 0 0 20px 20px;
          background: #000;
        }

        .pf-phone-screen {
          min-height: 445px;
          padding: 48px 22px 24px;
        }

        .pf-overline {
          color: rgba(226, 232, 240, 0.5);
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pf-phone-screen h3 {
          margin: 5px 0 18px;
          color: #ff5b22;
          font-size: 1.16rem;
          font-weight: 900;
        }

        .pf-exercise-list {
          display: grid;
          gap: 11px;
        }

        .pf-exercise-row {
          display: grid;
          grid-template-columns: 24px 1fr;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.035);
        }

        .pf-exercise-row > span {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 7px;
          color: #fff;
        }

        .pf-exercise-row > span.done {
          border-color: transparent;
          background: #ff5b22;
        }

        .pf-exercise-row strong,
        .pf-exercise-row small {
          display: block;
        }

        .pf-exercise-row strong {
          color: #fff;
          font-size: 0.83rem;
          font-weight: 800;
        }

        .pf-exercise-row small {
          color: rgba(226, 232, 240, 0.5);
          font-size: 0.7rem;
          font-weight: 700;
        }

        .pf-phone-cta {
          height: 42px;
          display: grid;
          place-items: center;
          margin-top: 18px;
          border-radius: 13px;
          background: #ff5b22;
          color: #fff;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .pf-dashboard-mockup {
          position: relative;
          z-index: 1;
          width: 100%;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          background: #0b1120;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.46);
        }

        .pf-dashboard-topbar {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.055);
        }

        .pf-dashboard-topbar .pf-logo span {
          width: 24px;
          height: 24px;
          border-radius: 6px;
        }

        .pf-dashboard-topbar .pf-logo strong {
          font-size: 0.8rem;
        }

        .pf-dashboard-body {
          display: grid;
          grid-template-columns: 148px 1fr;
        }

        .pf-dashboard-body aside {
          display: grid;
          align-content: start;
          gap: 4px;
          min-height: 345px;
          padding: 15px;
          border-right: 1px solid rgba(255, 255, 255, 0.055);
        }

        .pf-dashboard-body aside span,
        .pf-dashboard-heading span {
          padding: 8px 10px;
          border-radius: 10px;
          color: rgba(226, 232, 240, 0.48);
          font-size: 0.68rem;
          font-weight: 800;
        }

        .pf-dashboard-body aside span.active,
        .pf-dashboard-heading span.active {
          background: rgba(255, 91, 34, 0.11);
          color: #ff7a44;
        }

        .pf-dashboard-main {
          padding: 18px;
        }

        .pf-dashboard-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .pf-dashboard-heading h3 {
          color: #fff;
          font-size: 1rem;
        }

        .pf-dashboard-heading div {
          display: flex;
          gap: 6px;
        }

        .pf-search-preview {
          height: 34px;
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding: 0 12px;
          border: 1px solid rgba(255, 255, 255, 0.055);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.045);
          color: rgba(226, 232, 240, 0.45);
          font-size: 0.72rem;
          font-weight: 700;
        }

        .pf-students-preview {
          display: grid;
          gap: 8px;
        }

        .pf-student-preview {
          display: grid;
          grid-template-columns: 28px 1fr auto auto auto;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.026);
        }

        .pf-student-preview i {
          width: 28px;
          height: 28px;
          border-radius: 999px;
        }

        .pf-student-preview strong {
          overflow: hidden;
          color: #fff;
          font-size: 0.75rem;
          font-style: normal;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pf-student-preview span,
        .pf-student-preview em,
        .pf-student-preview small {
          font-size: 0.68rem;
          font-style: normal;
          font-weight: 900;
        }

        .pf-student-preview span { color: #34d399; }
        .pf-student-preview small { color: rgba(226, 232, 240, 0.5); }
        .pf-student-preview em { color: #ff7a44; }

        .pf-dashboard-main button {
          width: 100%;
          min-height: 38px;
          margin-top: 12px;
          border: 1px solid rgba(255, 91, 34, 0.24);
          border-radius: 12px;
          background: transparent;
          color: #ff7a44;
          font-family: inherit;
          font-size: 0.72rem;
          font-weight: 900;
        }

        .pf-ai-section {
          overflow: hidden;
          padding: 58px 0 108px;
          background: #050914;
        }

        .pf-ai-heading {
          padding-bottom: 30px;
        }

        .pf-ai-heading h2 {
          max-width: 780px;
          margin-top: 14px;
        }

        .pf-gallery {
          display: flex;
          gap: 28px;
          width: max-content;
          padding: 12px 0 56px 8vw;
          animation: pf-gallery-drift 46s linear infinite;
        }

        .pf-gallery-panel {
          position: relative;
          flex: 0 0 320px;
          height: 480px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: #07111f;
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.34);
        }

        .pf-gallery-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.42), transparent 45%);
          pointer-events: none;
        }

        .pf-gallery-panel img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.9) contrast(1.08);
          transition: transform 650ms ease;
        }

        .pf-gallery-panel:hover img {
          transform: scale(1.055);
        }

        .pf-ai-card {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .pf-ai-orb {
          position: relative;
          width: 70px;
          height: 70px;
          display: grid;
          place-items: center;
          margin: 0 auto 24px;
          border-radius: 999px;
          color: #ff5b22;
          background: rgba(255, 91, 34, 0.1);
        }

        .pf-ai-orb::before {
          content: '';
          position: absolute;
          inset: -2px;
          border: 2px solid #ff5b22;
          border-radius: inherit;
          animation: pf-pulse 2.2s ease-out infinite;
        }

        .pf-ai-card h3 {
          color: #fff;
          font-size: clamp(1.25rem, 2vw, 1.55rem);
          line-height: 1.42;
          letter-spacing: -0.025em;
        }

        .pf-final-cta {
          position: relative;
          padding: 126px 0 118px;
          background: #050914;
          border-top: 1px solid rgba(255, 255, 255, 0.045);
          isolation: isolate;
        }

        .pf-final-cta::before {
          content: '';
          position: absolute;
          inset: 18px auto auto 50%;
          z-index: -1;
          width: min(780px, 88vw);
          height: 360px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255, 91, 34, 0.1), rgba(7, 17, 31, 0.08) 44%, transparent 72%);
          filter: blur(18px);
          pointer-events: none;
        }

        .pf-final-card {
          display: grid;
          justify-items: center;
          text-align: center;
        }

        .pf-final-card h2 {
          max-width: 840px;
          position: relative;
          z-index: 1;
        }

        .pf-final-card p {
          max-width: 620px;
          margin-top: 20px;
          position: relative;
          z-index: 1;
        }

        .pf-final-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 30px;
        }

        .pf-final-notes {
          display: flex;
          justify-content: center;
          gap: 26px;
          flex-wrap: wrap;
          margin-top: 26px;
          color: rgba(226, 232, 240, 0.56);
          font-size: 0.78rem;
          font-weight: 800;
        }

        .pf-final-notes span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .pf-final-notes svg {
          color: #ff5b22;
        }

        .pf-footer {
          background: #03060d;
        }

        .pf-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr repeat(3, 1fr);
          gap: 54px;
          padding: 64px 0 52px;
        }

        .pf-footer-brand p {
          margin: 18px 0 22px;
          color: rgba(226, 232, 240, 0.54);
          font-size: 0.9rem;
          line-height: 1.65;
        }

        .pf-footer-whatsapp,
        .pf-footer-column a {
          color: rgba(226, 232, 240, 0.48);
          transition: color 180ms ease;
        }

        .pf-footer-whatsapp {
          display: inline-flex;
          align-items: center;
          font-size: 0.84rem;
          font-weight: 800;
        }

        .pf-footer-column {
          display: grid;
          align-content: start;
          gap: 12px;
        }

        .pf-footer-column h3 {
          margin-bottom: 4px;
          color: #fff;
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pf-footer-column a {
          font-size: 0.84rem;
          font-weight: 600;
        }

        .pf-footer-bottom {
          padding: 22px 20px 34px;
          border-top: 1px solid rgba(255, 255, 255, 0.045);
          color: rgba(226, 232, 240, 0.38);
          text-align: center;
          font-size: 0.76rem;
          font-weight: 600;
        }

        @keyframes pf-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }

        @keyframes pf-gallery-drift {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes pf-pulse {
          from { transform: scale(1); opacity: 0.85; }
          to { transform: scale(1.58); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }

        @media (max-width: 1080px) {
          .pf-feature-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .pf-experience-row,
          .pf-experience-row.personal {
            grid-template-columns: 1fr;
            gap: 42px;
          }

          .pf-experience-row.student .pf-mockup-wrap {
            order: 2;
          }

          .pf-experience-row.student .pf-experience-copy {
            order: 1;
          }
        }

        @media (max-width: 820px) {
          .pf-container {
            width: min(100% - 32px, 1280px);
          }

          .pf-nav-links,
          .pf-nav-actions {
            display: none;
          }

          .pf-menu-button {
            display: grid;
          }

          .pf-hero {
            min-height: 690px;
          }

          .pf-hero::before {
            background:
              linear-gradient(90deg, rgba(5, 9, 20, 0.97) 0%, rgba(5, 9, 20, 0.82) 58%, rgba(5, 9, 20, 0.24) 100%),
              linear-gradient(0deg, #050914 0%, rgba(5, 9, 20, 0.1) 48%);
          }

          .pf-hero-image img {
            object-position: 58% 34%;
          }

          .pf-hero-copy {
            max-width: 610px;
            padding: 86px 0 54px;
          }

          .pf-hero h1 {
            font-size: clamp(2.85rem, 13vw, 4.25rem);
            line-height: 0.98;
          }

          .pf-section {
            padding: 82px 0;
          }

          .pf-footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .pf-footer-brand {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 620px) {
          .pf-container {
            width: min(100% - 28px, 1280px);
          }

          .pf-nav-inner {
            min-height: 64px;
          }

          .pf-nav-shell {
            min-height: 64px;
          }

          .pf-hero {
            background:
              radial-gradient(circle at 84% 16%, rgba(255, 91, 34, 0.18), transparent 34%),
              linear-gradient(150deg, #050914 0%, #07111f 58%, #0d1f34 100%);
          }

          .pf-hero-image {
            overflow: hidden;
          }

          .pf-hero-image img {
            height: 100%;
            object-fit: cover;
            object-position: 62% 34%;
          }

          .pf-hero::before {
            background:
              linear-gradient(180deg, rgba(5, 9, 20, 0.08), rgba(5, 9, 20, 0.68) 100%),
              radial-gradient(circle at 18% 42%, rgba(255, 91, 34, 0.16), transparent 36%);
          }

          .pf-hero-content {
            padding-top: 64px;
          }

          .pf-hero-actions,
          .pf-final-actions {
            width: 100%;
          }

          .pf-hero-actions .pf-button,
          .pf-final-actions .pf-button {
            width: 100%;
          }

          .pf-hero p {
            font-size: 1rem;
            line-height: 1.62;
          }

          .pf-status-row {
            display: grid;
            grid-template-columns: 1fr;
            align-items: stretch;
            gap: 8px;
          }

          .pf-status-row span {
            width: 100%;
            height: auto;
            min-height: 36px;
            padding: 8px 12px;
            justify-content: flex-start;
            font-size: 0.75rem;
            line-height: 1.35;
            white-space: normal;
          }

          .pf-feature-grid {
            grid-template-columns: 1fr;
          }

          .pf-feature-card {
            min-height: 0;
          }

          .pf-experience-stack {
            gap: 84px;
          }

          .pf-mockup-wrap {
            min-height: 0;
          }

          .pf-phone-mockup {
            width: 100%;
            max-width: 330px;
          }

          .pf-dashboard-body {
            grid-template-columns: 1fr;
          }

          .pf-dashboard-body aside {
            display: none;
          }

          .pf-dashboard-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .pf-student-preview {
            grid-template-columns: 28px 1fr auto;
          }

          .pf-student-preview small,
          .pf-student-preview em {
            display: none;
          }

          .pf-gallery {
            gap: 16px;
            padding-left: 14px;
          }

          .pf-gallery-panel {
            flex-basis: 245px;
            height: 360px;
            border-radius: 16px;
          }

          .pf-footer-grid {
            gap: 34px 24px;
          }

          .pf-final-cta {
            padding: 92px 0 88px;
          }

          .pf-final-cta::before {
            height: 260px;
            filter: blur(14px);
          }
        }
      `}</style>
    </main>
  );
}
