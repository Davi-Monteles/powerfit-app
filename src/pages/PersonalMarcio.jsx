import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Dumbbell, MapPin, MessageCircle, ShieldAlert, Star, Target, Users } from 'lucide-react';
import { saveTrainerLead } from '../lib/trainer-leads';

const MARCIO_TRAINER_ID = '2bc16827-bee6-4b71-b9aa-11cfa46db189';
const whatsappMessage = encodeURIComponent('Oi, Marcio! Vi seu perfil demo no PowerFit e tenho interesse em treinar com voce.');
const differentiators = [
  { icon: Target, title: 'Plano direto ao objetivo', text: 'Treinos demo pensados para hipertrofia, emagrecimento e condicionamento.' },
  { icon: Users, title: 'Acompanhamento proximo', text: 'Check-ins simples para ajustar rotina, carga e frequencia.' },
  { icon: Star, title: 'Experiencia premium', text: 'Organizacao do treino, evolucao e comunicacao em um so app.' },
];

export default function PersonalMarcio() {
  const [form, setForm] = useState({ name: '', objective: '' });
  const [savedLead, setSavedLead] = useState(null);
  const [leadError, setLeadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLeadError('');
    setSavedLead(null);
    setIsSubmitting(true);

    try {
      const lead = await saveTrainerLead(form, MARCIO_TRAINER_ID);
      setSavedLead(lead);
      setForm({ name: '', objective: '' });
    } catch {
      setLeadError('Nao foi possivel enviar agora. Confira sua conexao e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-trainer-page">
      <header className="public-trainer-header">
        <Link to="/" className="public-trainer-logo"><Dumbbell size={18} /> PowerFit</Link>
        <Link to="/auth" className="btn btn-outline btn-sm">Entrar demo</Link>
      </header>

      <main className="public-trainer-shell">
        <section className="public-trainer-hero card">
          <div>
            <span className="badge badge-primary">Personal Trainer Demo</span>
            <h1>Marcio Demo</h1>
            <p className="public-trainer-subtitle">Treinos objetivos, acompanhamento simples e evolucao visivel para alunos que querem constancia.</p>
            <div className="public-trainer-meta">
              <span><MapPin size={16} /> Sao Paulo / Vila Mariana demo</span>
              <span><Dumbbell size={16} /> Hipertrofia, emagrecimento e condicionamento</span>
            </div>
          </div>
          <div className="public-trainer-panel">
            <strong>Especialidades</strong>
            <span>Musculacao</span>
            <span>Definicao corporal</span>
            <span>Treino para iniciantes</span>
            <span>Retorno a rotina</span>
          </div>
        </section>

        <section className="public-trainer-grid">
          {differentiators.map(item => (
            <article className="card public-trainer-card" key={item.title}>
              <item.icon size={22} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="public-trainer-lead card">
          <div>
            <h2>Tenho interesse</h2>
            <p>Deixe seu nome e objetivo. Em breve o personal entra em contato.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <label>
              Nome opcional
              <input className="form-input" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Seu nome" />
            </label>
            <label>
              Objetivo opcional
              <textarea className="form-textarea" value={form.objective} onChange={event => setForm(prev => ({ ...prev, objective: event.target.value }))} placeholder="Ex: ganhar massa, emagrecer, voltar a treinar" />
            </label>
            <div className="public-trainer-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}><CheckCircle2 size={18} /> {isSubmitting ? 'Enviando...' : 'Tenho interesse'}</button>
              <a className="btn btn-whatsapp" href={`https://wa.me/?text=${whatsappMessage}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a>
            </div>
          </form>
          {savedLead && (
            <div className="public-trainer-confirmation" role="status">
              Interessado! Em breve o personal entra em contato.
            </div>
          )}
          {leadError && <div className="public-trainer-error" role="alert">{leadError}</div>}
        </section>

        <aside className="public-trainer-demo-warning">
          <ShieldAlert size={18} /> Ambiente demo. Nao use dados reais.
        </aside>
      </main>

      <style>{`
        .public-trainer-page {
          min-height: 100vh;
          background: radial-gradient(circle at top left, rgba(255, 107, 53, 0.18), transparent 34%), var(--bg-main);
          color: var(--text-primary);
          padding: 20px;
        }

        .public-trainer-header,
        .public-trainer-shell {
          width: min(1080px, 100%);
          margin: 0 auto;
        }

        .public-trainer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .public-trainer-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 800;
        }

        .public-trainer-shell {
          display: grid;
          gap: 18px;
        }

        .public-trainer-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.6fr);
          gap: 22px;
          padding: 28px;
        }

        .public-trainer-hero h1 {
          margin: 14px 0 10px;
          font-size: clamp(2.2rem, 6vw, 4.2rem);
          line-height: 0.95;
        }

        .public-trainer-subtitle {
          color: var(--text-secondary);
          font-size: 1.05rem;
          max-width: 620px;
          line-height: 1.6;
        }

        .public-trainer-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .public-trainer-meta span,
        .public-trainer-panel span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 8px 12px;
          color: var(--text-secondary);
          font-size: 0.86rem;
        }

        .public-trainer-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-self: stretch;
          justify-content: center;
          background: rgba(255, 107, 53, 0.08);
          border: 1px solid rgba(255, 107, 53, 0.22);
          border-radius: var(--radius-lg);
          padding: 18px;
        }

        .public-trainer-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .public-trainer-card {
          padding: 20px;
        }

        .public-trainer-card svg {
          color: var(--primary);
        }

        .public-trainer-card h3 {
          margin: 12px 0 8px;
          font-size: 1rem;
        }

        .public-trainer-card p,
        .public-trainer-lead p {
          color: var(--text-secondary);
          line-height: 1.5;
          font-size: 0.92rem;
        }

        .public-trainer-lead {
          display: grid;
          grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
          gap: 20px;
          padding: 24px;
        }

        .public-trainer-lead form,
        .public-trainer-lead label {
          display: grid;
          gap: 10px;
        }

        .public-trainer-lead form {
          gap: 14px;
        }

        .public-trainer-lead label {
          color: var(--text-secondary);
          font-size: 0.86rem;
          font-weight: 700;
        }

        .public-trainer-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .public-trainer-confirmation,
        .public-trainer-error,
        .public-trainer-demo-warning {
          grid-column: 1 / -1;
          border-radius: var(--radius-md);
          padding: 12px 14px;
          font-size: 0.9rem;
        }

        .public-trainer-confirmation {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.25);
          color: var(--success);
        }

        .public-trainer-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: var(--danger);
        }

        .public-trainer-demo-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.26);
          color: var(--warning);
        }

        @media (max-width: 820px) {
          .public-trainer-hero,
          .public-trainer-lead,
          .public-trainer-grid { grid-template-columns: minmax(0, 1fr); }
        }

        @media (max-width: 520px) {
          .public-trainer-page { padding: 14px; }
          .public-trainer-hero,
          .public-trainer-lead { padding: 18px; }
          .public-trainer-actions .btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}
