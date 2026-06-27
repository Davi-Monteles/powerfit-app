import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const changelogItems = [
  'Captura automática de interessados na página pública do personal',
  'IA gera rascunho de treino personalizado a partir da anamnese do aluno',
  'Publicação de treino do personal para o aluno',
  'Aluno marca exercício e treino como concluído; personal acompanha adesão',
  'Vídeo do YouTube e imagem por exercício',
  'Exclusão segura de treinos gerados por IA',
  'Correções de performance e visual no mobile',
];

function InfoShell({ eyebrow, title, children }) {
  return (
    <main className="info-page">
      <section className="info-card">
        <Link to="/" className="info-back"><ArrowLeft size={17} /> Voltar para PowerFit</Link>
        <span className="info-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </section>
      <style>{`
        .info-page {
          min-height: 100vh;
          padding: 88px 20px;
          display: grid;
          place-items: start center;
          background:
            radial-gradient(circle at 18% 12%, rgba(255, 91, 34, 0.14), transparent 32%),
            linear-gradient(145deg, #050914 0%, #07111f 58%, #0b1728 100%);
          color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .info-card {
          width: min(900px, 100%);
          padding: clamp(28px, 6vw, 56px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.74);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
        }

        .info-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 34px;
          color: rgba(226, 232, 240, 0.76);
          font-weight: 800;
          text-decoration: none;
        }

        .info-eyebrow {
          display: inline-flex;
          margin-bottom: 16px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 91, 34, 0.14);
          color: #ffb190;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .info-card h1 {
          max-width: 720px;
          margin: 0 0 22px;
          font-size: clamp(2rem, 8vw, 4rem);
          line-height: 0.98;
          letter-spacing: -0.07em;
        }

        .info-card p,
        .info-card li {
          color: rgba(226, 232, 240, 0.76);
          font-size: 1rem;
          line-height: 1.75;
        }

        .info-card p {
          max-width: 760px;
          margin: 0 0 16px;
        }

        .info-card ul {
          display: grid;
          gap: 12px;
          padding-left: 20px;
        }

        .info-note {
          margin-top: 28px;
          padding: 16px 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(226, 232, 240, 0.7);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .info-section-title {
          margin: 30px 0 10px;
          color: #fff;
          font-size: 1rem;
          font-weight: 900;
        }

        @media (max-width: 480px) {
          .info-page {
            padding: 72px 14px;
          }

          .info-card {
            border-radius: 22px;
          }
        }
      `}</style>
    </main>
  );
}

function DraftNote({ legal = false }) {
  return (
    <div className="info-note">
      {legal
        ? 'Rascunho-base para revisão. Este texto não substitui revisão jurídica.'
        : 'Rascunho para revisão de texto antes da publicação final.'}
    </div>
  );
}

export function AboutPage() {
  return (
    <InfoShell eyebrow="Rascunho" title="Sobre o PowerFit">
      <p>PowerFit é uma ferramenta criada para personal trainers acompanharem alunos e treinos de forma mais prática.</p>
      <p>A proposta é organizar rotina, treinos, evolução e comunicação em um fluxo simples para personal e aluno.</p>
      <DraftNote />
    </InfoShell>
  );
}

export function UpdatesPage() {
  return (
    <InfoShell eyebrow="Changelog" title="Atualizações do PowerFit">
      <p>Registro simples das melhorias recentes do produto.</p>
      <ul>
        {changelogItems.map(item => <li key={item}>{item}</li>)}
      </ul>
    </InfoShell>
  );
}

function LegalPage({ title, children }) {
  return (
    <InfoShell eyebrow="Rascunho-base" title={title}>
      {children}
      <DraftNote legal />
    </InfoShell>
  );
}

export function TermsPage() {
  return (
    <LegalPage title="Termos de uso">
      <p>PowerFit está em fase piloto. O uso deve acontecer com dados adequados para teste e acompanhamento operacional.</p>
      <p className="info-section-title">Dados coletados</p>
      <p>Podem ser registrados dados de conta, alunos, treinos, agenda, evolução, mídias de exercícios e informações de uso necessárias para operar o app.</p>
      <p className="info-section-title">Backend</p>
      <p>O PowerFit usa Supabase como backend para autenticação, banco de dados e sincronização das informações do produto.</p>
      <p className="info-section-title">Contato</p>
      <p>Dúvidas sobre uso, acesso ou dados podem ser enviadas pelo WhatsApp informado no site.</p>
    </LegalPage>
  );
}

export function PrivacyPage() {
  return (
    <LegalPage title="Privacidade">
      <p>O PowerFit coleta dados fornecidos por personal trainers e alunos para permitir cadastro, criação de treinos, acompanhamento de agenda e histórico de evolução.</p>
      <p>Esses dados podem incluir nome, email, telefone, medidas, objetivos, anamnese, treinos, cargas, progresso, imagens ou links de apoio quando cadastrados.</p>
      <p>O Supabase é usado como backend para armazenar e sincronizar essas informações. O produto está em fase piloto e o texto definitivo deve ser revisado antes de uso comercial amplo.</p>
      <p>Para dúvidas sobre privacidade ou remoção de informações, entre em contato pelo WhatsApp informado no site.</p>
    </LegalPage>
  );
}

export function SecurityPage() {
  return (
    <LegalPage title="Segurança">
      <p><ShieldCheck size={18} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />O PowerFit usa Supabase como backend para autenticação, banco de dados e controle de acesso.</p>
      <p>Dados coletados no piloto podem incluir conta, alunos, treinos, anamnese, evolução e mídias de exercício necessárias para uso do produto.</p>
      <p>Como produto em fase piloto, acessos, permissões e regras de segurança devem ser revisados continuamente antes de uso com maior volume de dados.</p>
      <p>Evite inserir dados sensíveis desnecessários. Dúvidas ou pedidos sobre segurança podem ser enviados pelo WhatsApp informado no site.</p>
    </LegalPage>
  );
}
