import { useState } from 'react';
import { Dumbbell, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { getStudentIntake, getStudentIntakeProfile } from '../lib/student-intake';
import { generateWorkoutDraft } from '../lib/workout-draft';

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

function DraftExercise({ exercise }) {
  return (
    <li className="workout-draft-exercise">
      <strong>{exercise.name}</strong>
      <span>{exercise.sets}x{exercise.reps} · descanso {exercise.rest}s</span>
    </li>
  );
}

export default function WorkoutDraftCard({ students = [] }) {
  const selected = pickStudentProfile(students);
  const [draft, setDraft] = useState(null);
  const [generationCount, setGenerationCount] = useState(0);
  const hasSelectedIntake = !!selected?.intake;

  const handleGenerate = () => {
    if (!selected || !hasSelectedIntake) return;
    setDraft(generateWorkoutDraft(selected.student, selected.intake));
    setGenerationCount(count => count + 1);
  };

  return (
    <section className="card workout-draft-card">
      <WorkoutDraftCardStyles />
      <div className="workout-draft-header">
        <div>
          <p className="workout-draft-kicker">Rascunho de treino</p>
          <h3>Gerar base para revisão</h3>
        </div>
        <Sparkles size={22} style={{ color: 'var(--primary)' }} />
      </div>

      {!selected ? (
        <p className="workout-draft-empty">Nenhum aluno cadastrado ainda para gerar rascunho.</p>
      ) : (
        <>
          <div className="workout-draft-student-row">
            <div className="workout-draft-icon"><Dumbbell size={18} /></div>
            <div>
              <strong>{selected.profile.studentName}</strong>
              <p>Baseado na anamnese local. Não salva treino oficial.</p>
            </div>
          </div>

          {!hasSelectedIntake ? (
            <div className="workout-draft-empty workout-draft-empty-warning">
              Preencha a avaliação inicial do aluno antes de gerar um rascunho.
            </div>
          ) : (
            <button type="button" className="btn btn-primary workout-draft-generate" onClick={handleGenerate}>
              {draft ? <RefreshCw size={16} /> : <Sparkles size={16} />}
              {draft ? 'Regenerar rascunho' : 'Gerar rascunho de treino'}
            </button>
          )}

          {draft?.canGenerate && (
            <div className="workout-draft-result">
              <div className="workout-draft-title-row">
                <div>
                  <strong>{draft.title}</strong>
                  <p>{draft.objective} · {draft.frequency} · {draft.sessionDuration}</p>
                </div>
                <span>v{generationCount}</span>
              </div>

              {draft.safetyAlerts.length > 0 && (
                <div className="workout-draft-alert">
                  <ShieldAlert size={15} />
                  <span>{draft.safetyAlerts[0]}</span>
                </div>
              )}

              <div className="workout-draft-days">
                {draft.days.slice(0, 2).map(day => (
                  <div key={day.title} className="workout-draft-day">
                    <div className="workout-draft-day-heading">
                      <strong>{day.title}</strong>
                      <span>{day.focus}</span>
                    </div>
                    <ul>
                      {day.exercises.slice(0, 4).map(exercise => (
                        <DraftExercise key={`${day.title}-${exercise.name}`} exercise={exercise} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {draft.days.length > 2 && (
                <p className="workout-draft-more">+ {draft.days.length - 2} dia(s) no rascunho completo.</p>
              )}

              <div className="workout-draft-notes">
                {draft.observations.slice(0, 3).map(note => <p key={note}>{note}</p>)}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function WorkoutDraftCardStyles() {
  return (
    <style>{`
      .workout-draft-card {
        padding: 20px;
        min-width: 0;
        overflow: hidden;
        border-color: rgba(6, 182, 212, 0.18);
        background: linear-gradient(145deg, rgba(15,31,53,0.72), rgba(26,35,50,0.9));
      }

      .workout-draft-header,
      .workout-draft-title-row,
      .workout-draft-day-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .workout-draft-header { margin-bottom: 14px; }

      .workout-draft-header h3 {
        font-size: 1.08rem;
        margin: 0;
      }

      .workout-draft-kicker {
        margin: 0 0 4px;
        color: #22d3ee;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .workout-draft-student-row {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        margin-bottom: 12px;
      }

      .workout-draft-student-row strong,
      .workout-draft-title-row strong,
      .workout-draft-day strong,
      .workout-draft-exercise strong {
        overflow-wrap: anywhere;
      }

      .workout-draft-student-row p,
      .workout-draft-title-row p,
      .workout-draft-more,
      .workout-draft-notes p {
        margin: 2px 0 0;
        color: var(--text-muted);
        font-size: 0.78rem;
        line-height: 1.45;
      }

      .workout-draft-icon {
        width: 38px;
        height: 38px;
        flex: 0 0 auto;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
        background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%);
        box-shadow: 0 12px 26px rgba(6,182,212,0.16);
      }

      .workout-draft-generate {
        width: 100%;
        justify-content: center;
        margin-bottom: 12px;
      }

      .workout-draft-empty {
        color: var(--text-secondary);
        font-size: 0.88rem;
        padding: 16px;
        border: 1px dashed var(--border-hover);
        border-radius: var(--radius-md);
        background: rgba(255,255,255,0.025);
      }

      .workout-draft-empty-warning {
        border-color: rgba(245,158,11,0.32);
        color: #fbbf24;
      }

      .workout-draft-result {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .workout-draft-title-row {
        padding: 10px;
        border-radius: var(--radius-md);
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.055);
      }

      .workout-draft-title-row > span {
        flex: 0 0 auto;
        color: #22d3ee;
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .workout-draft-alert {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 9px 10px;
        color: #fbbf24;
        border: 1px solid rgba(245,158,11,0.32);
        border-radius: var(--radius-md);
        background: rgba(245,158,11,0.1);
        font-size: 0.78rem;
        font-weight: 800;
        line-height: 1.35;
      }

      .workout-draft-days {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .workout-draft-day {
        min-width: 0;
        padding: 10px;
        border-radius: var(--radius-md);
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.055);
      }

      .workout-draft-day-heading {
        margin-bottom: 8px;
      }

      .workout-draft-day-heading span {
        color: var(--text-muted);
        font-size: 0.68rem;
        text-align: right;
        overflow-wrap: anywhere;
      }

      .workout-draft-day ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .workout-draft-exercise {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .workout-draft-exercise strong { font-size: 0.8rem; }

      .workout-draft-exercise span {
        color: var(--text-muted);
        font-size: 0.72rem;
      }

      .workout-draft-notes {
        padding-top: 10px;
        border-top: 1px solid var(--border);
      }

      @media (max-width: 640px) {
        .workout-draft-card { padding: 16px; }
        .workout-draft-days { grid-template-columns: minmax(0, 1fr); }
      }
    `}</style>
  );
}
