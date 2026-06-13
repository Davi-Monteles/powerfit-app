import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle, ClipboardList, Save, ShieldAlert } from 'lucide-react';
import { useAuth, useToast } from '../lib/app-context';
import {
  getStudentIntake,
  getStudentIntakeSummary,
  getStudentRiskFlags,
  saveStudentIntake,
} from '../lib/student-intake';

const DEFAULT_FORM = {
  goal: '',
  experienceLevel: '',
  daysPerWeek: '',
  sessionDuration: '',
  equipment: [],
  muscleFocus: [],
  trainingHistory: '',
  limitations: '',
  chestPainDuringEffort: false,
  dizzinessOrFainting: false,
  heartOrBloodPressureIssue: false,
  recentSurgeryOrInjury: false,
  medicalRestriction: false,
  notes: '',
};

const SELECT_FIELDS = [
  { name: 'goal', label: 'Objetivo principal *', options: ['Hipertrofia', 'Emagrecimento', 'Condicionamento', 'Força', 'Saúde e rotina'] },
  { name: 'experienceLevel', label: 'Nível de experiência *', options: ['Iniciante', 'Intermediario', 'Avancado', 'Retornando apos pausa'] },
  { name: 'daysPerWeek', label: 'Dias disponíveis por semana *', options: ['2', '3', '4', '5', '6'], suffix: ' dias' },
  { name: 'sessionDuration', label: 'Tempo por treino *', options: ['30 minutos', '45 minutos', '60 minutos', '75 minutos ou mais'] },
];

const EQUIPMENT_OPTIONS = ['Peso livre', 'Halteres', 'Barra', 'Maquinas', 'Elasticos', 'Casa sem equipamento'];
const MUSCLE_OPTIONS = ['Peito', 'Costas', 'Pernas', 'Gluteos', 'Ombros', 'Bracos', 'Core', 'Condicionamento'];

const SAFETY_FIELDS = [
  ['chestPainDuringEffort', 'Dor no peito durante esforço'],
  ['dizzinessOrFainting', 'Tontura ou desmaio'],
  ['heartOrBloodPressureIssue', 'Problema cardíaco ou pressão'],
  ['recentSurgeryOrInjury', 'Cirurgia ou lesão recente'],
  ['medicalRestriction', 'Restrição médica'],
];

function getActiveStudentId(user) {
  const values = user ? [user.id, user.studentId, user.student_id, user.email] : [];
  return values.find(Boolean) || null;
}

function getBackHandler(onBack, navigate) {
  return typeof onBack === 'function' ? onBack : () => navigate('/aluno');
}

function getInitialIntake(studentId) {
  return studentId ? getStudentIntake(studentId) : null;
}

function updateListSelection(form, field, value) {
  const current = Array.isArray(form[field]) ? form[field] : [];
  return {
    ...form,
    [field]: current.includes(value) ? current.filter(item => item !== value) : [...current, value],
  };
}

function applySaveResult(saved, { addToast, setError, setForm, setSavedIntake }) {
  setSavedIntake(saved);

  if (!saved?.completed) {
    setError('Preencha os campos principais antes de salvar a avaliação inicial.');
    return;
  }

  setForm(saved);
  addToast?.('Avaliação inicial salva com segurança local.', 'success');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function StudentIntake({ onBack }) {
  const { user } = useAuth();
  const addToast = useToast();
  const navigate = useNavigate();
  const handleBack = getBackHandler(onBack, navigate);
  const studentId = getActiveStudentId(user);
  const initialIntake = getInitialIntake(studentId);
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM, ...(initialIntake || {}) }));
  const [savedIntake, setSavedIntake] = useState(() => initialIntake);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setError('');
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleListValue = (field, value) => {
    setError('');
    setForm(prev => updateListSelection(prev, field, value));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applySaveResult(saveStudentIntake(studentId, form), { addToast, setError, setForm, setSavedIntake });
  };

  if (!studentId) {
    return <MissingStudentState />;
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader onBack={handleBack} />
      <IntakeSummary intake={savedIntake} />
      <IntakeForm
        error={error}
        form={form}
        hasSavedIntake={savedIntake?.completed}
        onCancel={handleBack}
        onSubmit={handleSubmit}
        onToggleListValue={toggleListValue}
        onUpdateField={updateField}
      />
      <IntakeStyles />
    </div>
  );
}

function MissingStudentState() {
  return (
    <div className="page-container">
      <div className="empty-state">
        <AlertTriangle size={48} />
        <h3>Perfil do aluno não encontrado</h3>
        <p>Entre novamente para preencher a avaliação inicial.</p>
      </div>
    </div>
  );
}

function PageHeader({ onBack }) {
  return (
    <div className="page-header" style={{ alignItems: 'flex-start' }}>
      <div>
        <h2><ClipboardList size={24} style={{ color: 'var(--primary)' }} /> Avaliação inicial</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '8px', maxWidth: '720px' }}>
          Questionário local para orientar a demo e ajudar o personal a entender objetivos, rotina e pontos de atenção do aluno.
        </p>
      </div>
      <button type="button" className="btn btn-outline" onClick={onBack}>
        <ArrowLeft size={18} /> Voltar
      </button>
    </div>
  );
}

function IntakeSummary({ intake }) {
  if (!intake?.completed) return null;

  const summary = getStudentIntakeSummary(intake);
  const riskFlags = getStudentRiskFlags(intake);

  return (
    <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(34,197,94,0.3)' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div className="stat-icon" style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
          <CheckCircle size={21} color="white" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Resumo salvo</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>Pode editar quando sua rotina, objetivo ou restrições mudarem.</p>
        </div>
      </div>
      {riskFlags.length > 0 && <RiskNotice />}
      <div className="intake-summary-grid">
        <SummaryItem label="Objetivo" value={summary.goal} />
        <SummaryItem label="Disponibilidade" value={summary.availability} />
        <SummaryItem label="Nível" value={summary.experienceLevel} />
        <SummaryItem label="Equipamentos" value={summary.equipment} />
        <SummaryItem label="Foco" value={summary.muscleFocus} />
        <SummaryItem label="Pontos de atenção" value={summary.attentionPoints.join('; ')} />
      </div>
    </div>
  );
}

function IntakeForm({ error, form, hasSavedIntake, onCancel, onSubmit, onToggleListValue, onUpdateField }) {
  return (
    <form className="card" onSubmit={onSubmit} style={{ padding: '24px', overflow: 'hidden' }}>
      <MedicalDisclaimer />
      {error && <div className="auth-error" style={{ marginBottom: '18px' }}>{error}</div>}
      <div className="intake-form-grid">
        {SELECT_FIELDS.map(field => (
          <SelectField key={field.name} field={field} value={form[field.name]} onChange={value => onUpdateField(field.name, value)} />
        ))}
      </div>
      <ChoiceGroup label="Equipamentos disponíveis *" options={EQUIPMENT_OPTIONS} selected={form.equipment} onToggle={value => onToggleListValue('equipment', value)} />
      <ChoiceGroup label="Foco muscular *" options={MUSCLE_OPTIONS} selected={form.muscleFocus} onToggle={value => onToggleListValue('muscleFocus', value)} />
      <TextareaField label="Histórico de treino *" value={form.trainingHistory} onChange={value => onUpdateField('trainingHistory', value)} placeholder="Ex: treinei por 1 ano, parei por 3 meses, faço caminhada..." required />
      <TextareaField label="Lesões, dor ou restrições" value={form.limitations} onChange={value => onUpdateField('limitations', value)} placeholder="Informe dores, lesões, restrições ou deixe em branco se não houver." />
      <SafetySection form={form} onUpdateField={onUpdateField} />
      {getStudentRiskFlags(form).length > 0 && <RiskNotice spaced />}
      <TextareaField label="Observações livres" value={form.notes} onChange={value => onUpdateField('notes', value)} placeholder="Preferências, horários, exercícios que gosta ou evita..." />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', marginTop: '22px' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary"><Save size={18} /> {hasSavedIntake ? 'Editar avaliação' : 'Salvar avaliação'}</button>
      </div>
    </form>
  );
}

function MedicalDisclaimer() {
  return (
    <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '22px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
      Esta avaliação não substitui consulta médica, avaliação física presencial ou acompanhamento profissional. O PowerFit não dá diagnóstico médico e não promete resultado.
    </div>
  );
}

function SelectField({ field, value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{field.label}</label>
      <select className="form-select" value={value} onChange={event => onChange(event.target.value)} required>
        <option value="">Selecione</option>
        {field.options.map(option => <option key={option} value={option}>{option}{field.suffix || ''}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, required = false }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <textarea className="form-textarea" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} required={required} />
    </div>
  );
}

function ChoiceGroup({ label, options, selected, onToggle }) {
  const values = Array.isArray(selected) ? selected : [];
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="intake-choice-grid">
        {options.map(option => <ChoiceButton key={option} active={values.includes(option)} label={option} onClick={() => onToggle(option)} />)}
      </div>
    </div>
  );
}

function ChoiceButton({ active, label, onClick }) {
  return <button type="button" className={`btn intake-choice ${active ? 'btn-primary' : 'btn-outline'}`} onClick={onClick}>{label}</button>;
}

function SafetySection({ form, onUpdateField }) {
  return (
    <>
      <div style={{ margin: '22px 0 12px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} style={{ color: 'var(--warning)' }} /> Perguntas básicas de segurança
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Marque qualquer item que se aplique. Em caso de dúvida, revise com um profissional antes de treinar.</p>
      </div>
      <div className="intake-check-grid">
        {SAFETY_FIELDS.map(([field, label]) => <SafetyCheck key={field} label={label} checked={form[field]} onChange={value => onUpdateField(field, value)} />)}
      </div>
    </>
  );
}

function SafetyCheck({ label, checked, onChange }) {
  return (
    <label className="intake-check">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function RiskNotice({ spaced = false }) {
  return (
    <div style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '12px', margin: spaced ? '18px 0' : '0 0 14px', color: 'var(--warning)', fontSize: '0.88rem', fontWeight: 700 }}>
      Atenção: revisar com profissional antes de treinar.
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</p>
      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{value}</strong>
    </div>
  );
}

function IntakeStyles() {
  return (
    <style>{`
      .intake-form-grid, .intake-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
      .intake-choice-grid, .intake-check-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
      .intake-choice { white-space: normal; text-align: left; min-height: 40px; }
      .intake-check { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: rgba(255,255,255,0.02); color: var(--text-secondary); font-size: 0.86rem; cursor: pointer; }
      .intake-check input { accent-color: var(--primary); }
      @media (max-width: 480px) {
        .intake-form-grid, .intake-summary-grid { grid-template-columns: 1fr; }
        .intake-choice-grid, .intake-check-grid { flex-direction: column; }
        .intake-choice, .intake-check { width: 100%; justify-content: flex-start; }
      }
    `}</style>
  );
}
