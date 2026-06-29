import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle, ClipboardList, Save, ShieldAlert } from 'lucide-react';
import { useAuth, useToast } from '../lib/app-context';
import {
  PAR_Q_FIELDS,
  getStudentBmiInfo,
  getStudentIntake,
  getStudentIntakeSummary,
  getStudentParQStatus,
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
  continuousMedication: false,
  recentSurgery: false,
  medicalRestriction: false,
  chronicDisease: false,
  familyCardiacHistory: false,
  constantPain: false,
  constantPainLocation: '',
  sleepHours: '',
  parqHeartCondition: false,
  parqChestPainActivity: false,
  parqChestPainRest: false,
  parqDizziness: false,
  parqBoneJointProblem: false,
  parqBloodPressureMedication: false,
  parqOtherReason: false,
  weight: '',
  height: '',
  waist: '',
  hip: '',
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

const HEALTH_FIELDS = [
  ['continuousMedication', 'Medicação contínua'],
  ['recentSurgery', 'Cirurgia recente'],
  ['medicalRestriction', 'Restrição médica'],
  ['chronicDisease', 'Doença crônica'],
  ['familyCardiacHistory', 'Histórico familiar cardíaco'],
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
        <SummaryItem label="Saúde" value={summary.healthSummary} />
        <SummaryItem label="PAR-Q" value={summary.parqStatus} />
        <SummaryItem label="Medidas + IMC" value={summary.measurementsSummary} />
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
      <HealthSection form={form} onUpdateField={onUpdateField} />
      <ParQSection form={form} onUpdateField={onUpdateField} />
      <MeasurementsSection form={form} onUpdateField={onUpdateField} />
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

function HealthSection({ form, onUpdateField }) {
  return (
    <>
      <div style={{ margin: '22px 0 12px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} style={{ color: 'var(--warning)' }} /> Saúde
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Responda de forma simples para sinalizar pontos de atenção antes do treino.</p>
      </div>
      <div className="intake-boolean-grid">
        {HEALTH_FIELDS.map(([field, label]) => <BooleanField key={field} label={label} value={form[field]} onChange={value => onUpdateField(field, value)} />)}
      </div>
      <BooleanField label="Dor constante" value={form.constantPain} onChange={value => onUpdateField('constantPain', value)} />
      {form.constantPain && (
        <TextField label="Onde sente dor?" value={form.constantPainLocation} onChange={value => onUpdateField('constantPainLocation', value)} placeholder="Ex: joelho direito, lombar, ombro..." />
      )}
      <TextField label="Horas de sono por noite" type="number" value={form.sleepHours} onChange={value => onUpdateField('sleepHours', value)} placeholder="Ex: 7" min="0" max="24" step="0.5" />
    </>
  );
}

function ParQSection({ form, onUpdateField }) {
  const parqStatus = getStudentParQStatus(form);

  return (
    <>
      <div style={{ margin: '22px 0 12px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} style={{ color: 'var(--warning)' }} /> PAR-Q
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>7 perguntas padrão de prontidão para atividade física.</p>
      </div>
      <div className="intake-parq-list">
        {PAR_Q_FIELDS.map(field => <BooleanField key={field.key} label={field.label} value={form[field.key]} onChange={value => onUpdateField(field.key, value)} />)}
      </div>
      {parqStatus.needsMedicalAttention && (
        <div style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '12px', margin: '12px 0 18px', color: 'var(--warning)', fontSize: '0.88rem', fontWeight: 700 }}>
          Atenção médica: como houve resposta "sim" no PAR-Q, procure liberação profissional antes de iniciar ou intensificar treinos.
        </div>
      )}
    </>
  );
}

function MeasurementsSection({ form, onUpdateField }) {
  const bmi = getStudentBmiInfo(form);

  return (
    <>
      <div style={{ margin: '22px 0 12px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>Medidas básicas</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Medidas opcionais para acompanhar evolução simples na V1.</p>
      </div>
      <div className="intake-form-grid">
        <TextField label="Peso (kg)" type="number" value={form.weight} onChange={value => onUpdateField('weight', value)} placeholder="Ex: 82.5" min="0" step="0.1" />
        <TextField label="Altura (cm)" type="number" value={form.height} onChange={value => onUpdateField('height', value)} placeholder="Ex: 178" min="0" step="1" />
        <TextField label="Cintura (cm)" type="number" value={form.waist} onChange={value => onUpdateField('waist', value)} placeholder="Ex: 88" min="0" step="0.1" />
        <TextField label="Quadril (cm)" type="number" value={form.hip} onChange={value => onUpdateField('hip', value)} placeholder="Ex: 101" min="0" step="0.1" />
      </div>
      <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '18px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>IMC automático</p>
        <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{bmi.label}</strong>
      </div>
    </>
  );
}

function BooleanField({ label, value, onChange }) {
  return (
    <div className="intake-boolean-field">
      <span>{label}</span>
      <div className="intake-boolean-actions" role="group" aria-label={label}>
        <button type="button" className={!value ? 'active' : ''} onClick={() => onChange(false)}>Não</button>
        <button type="button" className={value ? 'active' : ''} onClick={() => onChange(true)}>Sim</button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = 'text', min, max, step }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} min={min} max={max} step={step} />
    </div>
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
      .intake-choice-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
      .intake-choice { white-space: normal; text-align: left; min-height: 40px; }
      .intake-boolean-grid, .intake-parq-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; margin-bottom: 18px; }
      .intake-parq-list { grid-template-columns: 1fr; }
      .intake-boolean-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: rgba(255,255,255,0.02); color: var(--text-secondary); font-size: 0.86rem; }
      .intake-boolean-field > span { line-height: 1.35; }
      .intake-boolean-actions { display: inline-flex; gap: 6px; }
      .intake-boolean-actions button { border: 1px solid var(--border); border-radius: 999px; padding: 6px 10px; background: rgba(255,255,255,0.03); color: var(--text-secondary); font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
      .intake-boolean-actions button.active { border-color: rgba(255,107,53,0.45); background: var(--gradient-primary); color: white; }
      @media (max-width: 480px) {
        .intake-form-grid, .intake-summary-grid { grid-template-columns: 1fr; }
        .intake-choice-grid { flex-direction: column; }
        .intake-choice { width: 100%; justify-content: flex-start; }
        .intake-boolean-grid { grid-template-columns: 1fr; }
        .intake-boolean-field { grid-template-columns: 1fr; align-items: stretch; }
        .intake-boolean-actions button { flex: 1; }
      }
    `}</style>
  );
}
