import { ClipboardList, ShieldAlert, UserRound } from 'lucide-react';
import { getStudentIntake, getStudentIntakeProfile } from '../lib/student-intake';

function getStudentIdentity(student) {
  return [student?.id, student?.studentId, student?.student_id, student?.email].find(Boolean) || null;
}

function pickStudentProfile(students) {
  const profiles = (students || []).map(student => {
    const intake = getStudentIntake(getStudentIdentity(student));
    return { student, intake, profile: getStudentIntakeProfile(student, intake) };
  });

  return profiles.find(item => item.profile.needsProfessionalReview)
    || profiles.find(item => item.profile.hasIntake)
    || profiles.find(item => item.intake)
    || profiles[0]
    || null;
}

function DetailItem({ label, value, wide = false }) {
  if (!value) return null;
  return (
    <div className={wide ? 'student-intake-detail student-intake-detail-wide' : 'student-intake-detail'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ profile }) {
  return (
    <span className={`student-intake-badge ${profile.statusTone}`}>
      {profile.needsProfessionalReview && <ShieldAlert size={13} />}
      {profile.status}
    </span>
  );
}

export default function StudentIntakeSummary({ students = [] }) {
  const selected = pickStudentProfile(students);

  if (!selected) {
    return (
      <section className="card student-intake-summary-card">
        <StudentIntakeSummaryStyles />
        <div className="student-intake-summary-header">
          <div>
            <p className="student-intake-kicker">Perfil inteligente</p>
            <h3>Resumo da avaliação inicial</h3>
          </div>
          <ClipboardList size={22} style={{ color: 'var(--primary)' }} />
        </div>
        <div className="student-intake-empty">
          Nenhum aluno cadastrado ainda. Quando houver alunos, o resumo da avaliação inicial aparecerá aqui.
        </div>
      </section>
    );
  }

  const { profile } = selected;
  const attentionText = profile.attentionPoints.join('; ');
  const availability = profile.daysPerWeek !== 'Nao informado'
    ? `${profile.daysPerWeek} dias por semana`
    : 'Nao informado';

  return (
    <section className="card student-intake-summary-card">
      <StudentIntakeSummaryStyles />
      <div className="student-intake-summary-header">
        <div>
          <p className="student-intake-kicker">Perfil inteligente</p>
          <h3>Resumo da avaliação inicial</h3>
        </div>
        <ClipboardList size={22} style={{ color: 'var(--primary)' }} />
      </div>

      <div className="student-intake-person-row">
        <div className="student-intake-avatar"><UserRound size={18} /></div>
        <div>
          <strong>{profile.studentName}</strong>
          <p>Informações declaradas pelo aluno</p>
        </div>
      </div>

      <div className="student-intake-badges">
        <StatusBadge profile={profile} />
        <span className="student-intake-badge neutral">Nível: {profile.experienceLevel}</span>
      </div>

      <div className="student-intake-detail-grid">
        <DetailItem label="Objetivo principal" value={profile.goal} />
        <DetailItem label="Disponibilidade" value={availability} />
        <DetailItem label="Tempo por treino" value={profile.sessionDuration} />
        <DetailItem label="Equipamentos" value={profile.equipment} />
        <DetailItem label="Foco muscular" value={profile.muscleFocus} />
        <DetailItem label="Histórico" value={profile.trainingHistory} wide />
        <DetailItem label="Pontos para revisar com o profissional" value={attentionText} wide />
        {profile.notes && <DetailItem label="Observações" value={profile.notes} wide />}
      </div>

      <p className="student-intake-disclaimer">Não substitui avaliação médica, avaliação física presencial ou acompanhamento profissional.</p>
    </section>
  );
}

function StudentIntakeSummaryStyles() {
  return (
    <style>{`
      .student-intake-summary-card {
        padding: 20px;
        min-width: 0;
        overflow: hidden;
        border-color: rgba(255, 107, 53, 0.16);
        background: linear-gradient(145deg, rgba(26,35,50,0.92), rgba(15,31,53,0.52));
      }

      .student-intake-summary-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 14px;
      }

      .student-intake-summary-header h3 {
        font-size: 1.08rem;
        margin: 0;
      }

      .student-intake-kicker {
        margin: 0 0 4px;
        color: var(--primary);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .student-intake-empty {
        color: var(--text-secondary);
        font-size: 0.88rem;
        padding: 16px;
        border: 1px dashed var(--border-hover);
        border-radius: var(--radius-md);
        background: rgba(255,255,255,0.025);
      }

      .student-intake-person-row {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        margin-bottom: 12px;
      }

      .student-intake-person-row strong,
      .student-intake-detail strong {
        overflow-wrap: anywhere;
      }

      .student-intake-person-row p {
        margin: 2px 0 0;
        color: var(--text-muted);
        font-size: 0.78rem;
      }

      .student-intake-avatar {
        width: 38px;
        height: 38px;
        flex: 0 0 auto;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
        background: var(--gradient-primary);
        box-shadow: var(--shadow-glow-orange);
      }

      .student-intake-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 14px;
        min-width: 0;
      }

      .student-intake-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
        border-radius: var(--radius-full);
        padding: 5px 9px;
        font-size: 0.72rem;
        font-weight: 800;
        line-height: 1.2;
        white-space: normal;
        overflow-wrap: anywhere;
      }

      .student-intake-badge.success {
        color: #86efac;
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.28);
      }

      .student-intake-badge.warning {
        color: #fbbf24;
        background: rgba(245,158,11,0.12);
        border: 1px solid rgba(245,158,11,0.32);
      }

      .student-intake-badge.muted,
      .student-intake-badge.neutral {
        color: var(--text-secondary);
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border);
      }

      .student-intake-detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .student-intake-detail {
        min-width: 0;
        padding: 10px;
        border-radius: var(--radius-md);
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.055);
      }

      .student-intake-detail-wide {
        grid-column: 1 / -1;
      }

      .student-intake-detail span {
        display: block;
        margin-bottom: 3px;
        color: var(--text-muted);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .student-intake-detail strong {
        display: block;
        color: var(--text-primary);
        font-size: 0.84rem;
        line-height: 1.35;
      }

      .student-intake-disclaimer {
        margin: 12px 0 0;
        color: var(--text-muted);
        font-size: 0.74rem;
        line-height: 1.45;
      }

      @media (max-width: 480px) {
        .student-intake-summary-card { padding: 16px; }
        .student-intake-detail-grid { grid-template-columns: minmax(0, 1fr); }
      }
    `}</style>
  );
}
