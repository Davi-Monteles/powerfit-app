import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../lib/app-context';
import { getStudents, getWorkouts, getEvolution, getScheduleByDate, getUserPlan, getStudentUsage, isVipUser, saveNotification, forceSyncData } from '../lib/storage';
import { getTrainerLeads, updateTrainerLeadStatus } from '../lib/trainer-leads';
import { useStorageSync } from '../lib/useStorageSync';
import { LayoutDashboard, Users, Dumbbell, TrendingUp, Plus, ArrowRight, CalendarDays, Clock, Camera, Settings, Crown, Bell, MessageCircle } from 'lucide-react';
import StudentIntakeSummary from '../components/StudentIntakeSummary';
import WorkoutDraftCard from '../components/WorkoutDraftCard';
import { getWorkoutCompletionsForTrainer } from '../lib/workout-completions';

export default function Dashboard() {
  const { user } = useAuth();
  const addToast = useToast();
  const navigate = useNavigate();
  const plan = getUserPlan();
  const usage = getStudentUsage();
  const isVip = isVipUser(user?.email);
  const [trainerLeads, setTrainerLeads] = useState(() => getTrainerLeads());
  useStorageSync();

  const students = getStudents();
  const workouts = getWorkouts();
  const evolution = getEvolution();
  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = getScheduleByDate(today);
  const workoutCompletions = getWorkoutCompletionsForTrainer(user?.id);
  const recentWorkoutCompletions = workoutCompletions.slice(0, 5);
  const completedWorkoutCount = workoutCompletions.filter(item => item.status === 'completed').length;
  const stats = {
    students: students.length,
    workouts: workouts.length,
    evolution: evolution.length,
    premiumCount: students.filter(s => s.isPremium).length,
  };
  const todayEvents = todaySchedule.map(e => {
    const student = students.find(s => s.id === e.studentId) || {};
    return {
      ...e,
      studentName: student.name || "",
      studentPhone: student.phone || student.whatsapp || ""
    };
  });

  useEffect(() => {
    forceSyncData().catch(() => {});
  }, [user]);

  const quickActions = [
    { label: 'Novo Aluno', icon: Users, color: 'orange', path: '/students' },
    { label: 'Novo Treino', icon: Dumbbell, color: 'blue', path: '/workouts' },
    { label: 'Evolução', icon: TrendingUp, color: 'green', path: '/evolution' },
    { label: 'Agenda', icon: CalendarDays, color: 'cyan', path: '/schedule' },
    { label: 'Fotos', icon: Camera, color: 'orange', path: '/photos' },
    { label: 'Configurações', icon: Settings, color: 'blue', path: '/settings' },
  ];

  const EVENT_COLORS = { treino: '#FF6B35', avaliacao: '#3B82F6', consulta: '#22C55E', outro: '#22d3ee' };

  const enviarLembrete = (alunoName, studentId) => {
    if (!studentId) return;
    const message = "Você tem um novo lembrete de treino do seu Personal! Bora pra cima! 💪";
    saveNotification(studentId, message);
    addToast("Lembrete interno enviado com sucesso!", "success");
  };

  const handleLeadStatusChange = (leadId, status) => {
    try {
      updateTrainerLeadStatus(leadId, status);
      setTrainerLeads(getTrainerLeads());
      addToast('Status do interessado atualizado.', 'success');
    } catch {
      addToast('Nao foi possivel atualizar o status.', 'error');
    }
  };

  const formatDisplayDate = (value) => {
    if (!value) return 'Sem data';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sem data';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getCompletionSummary = (completion) => {
    if (completion.status === 'completed') return `Concluído em ${formatDisplayDate(completion.completedAt)}`;
    return `Pendente desde ${formatDisplayDate(completion.updatedAt)}`;
  };

  const getCompletionBadge = (completion) => completion.status === 'completed'
    ? { className: 'badge badge-success', label: 'concluído' }
    : { className: 'badge badge-secondary', label: 'pendente' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><LayoutDashboard size={24} style={{ color: 'var(--primary)' }} /> Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Olá, <strong>{user?.name?.split(' ')[0] || 'Usuário'}</strong>! 👋
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/students')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon orange"><Users size={24} color="white" /></div>
          <div className="stat-info">
            <h4>{stats.students} / {usage.limit === Infinity ? '∞' : usage.limit}</h4>
            <p>Alunos Adicionados</p>
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/workouts')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon blue"><Dumbbell size={24} color="white" /></div>
          <div className="stat-info"><h4>{stats.workouts}</h4><p>Treinos</p></div>
        </div>
        <div className="stat-card" onClick={() => navigate('/schedule')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon cyan"><CalendarDays size={24} color="white" /></div>
          <div className="stat-info"><h4>{todayEvents.length}</h4><p>Hoje na Agenda</p></div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/meu-plano')}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}><Crown size={24} color="white" /></div>
          <div className="stat-info">
            <h4>{isVip ? 'VIP' : plan?.name || 'Sem plano'}</h4>
            <p>{isVip ? 'Acesso Total' : plan ? 'Plano Ativo' : 'Escolher Plano'}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-intake-grid">
        <StudentIntakeSummary students={students} />
        <WorkoutDraftCard students={students} />
      </div>

      <div className="dashboard-main-grid">
        {/* Quick Actions */}
        <div className="card" style={{ padding: '24px', minWidth: 0 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>⚡ Ações Rápidas</h3>
          <div className="dashboard-actions-grid">
            {quickActions.map(action => (
              <button key={action.label} className="btn btn-outline dashboard-action-btn" style={{ justifyContent: 'flex-start', gap: '10px', padding: '12px 14px' }}
                onClick={() => navigate(action.path)}>
                <action.icon size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="card" style={{ padding: '24px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>📅 Agenda de Hoje</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/schedule')}>Ver tudo <ArrowRight size={14} /></button>
          </div>
          {todayEvents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              Nenhum evento agendado para hoje
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayEvents.map(ev => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', borderLeft: "3px solid " + (EVENT_COLORS[ev.type] || EVENT_COLORS.outro) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>{ev.title}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.time} {ev.studentName && "• " + ev.studentName}</p>
                    </div>
                  </div>
                  {ev.studentId && (
                    <button 
                      className="btn btn-ghost btn-sm"
                      title="Enviar Lembrete"
                      onClick={() => enviarLembrete(ev.studentName, ev.studentId)}
                      style={{ color: '#06b6d4', padding: '6px', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '6px' }}
                    >
                      <Bell size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card dashboard-adherence-card" style={{ padding: '24px', marginTop: '20px' }}>
        <div className="dashboard-adherence-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Dumbbell size={18} style={{ color: 'var(--primary)' }} /> Adesão / Treinos concluídos</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>{completedWorkoutCount} treino(s) concluído(s) neste navegador.</p>
          </div>
        </div>
        {recentWorkoutCompletions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
            Nenhum treino publicado foi marcado como concluído ainda.
          </p>
        ) : (
          <div className="dashboard-adherence-list">
            {recentWorkoutCompletions.map(completion => (
              <div className="dashboard-adherence-row" key={completion.id}>
                <div>
                  <strong>{completion.studentName || 'Aluno'}</strong>
                  <p>{completion.workoutName || 'Treino'}</p>
                  <small>{getCompletionSummary(completion)}</small>
                </div>
                <span className={getCompletionBadge(completion).className}>{getCompletionBadge(completion).label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card dashboard-leads-card" style={{ padding: '24px', marginTop: '20px' }}>
        <div className="dashboard-leads-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={18} style={{ color: 'var(--primary)' }} /> Interessados / Leads</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>Captados pelo perfil publico demo /personal/marcio.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setTrainerLeads(getTrainerLeads())}>Atualizar</button>
        </div>
        {trainerLeads.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
            Nenhum interessado capturado neste navegador.
          </p>
        ) : (
          <div className="dashboard-leads-list">
            {trainerLeads.map(lead => (
              <div className="dashboard-lead-row" key={lead.id}>
                <div>
                  <strong>{lead.name || 'Interessado sem nome'}</strong>
                  <p>{lead.objective || 'Objetivo nao informado'}</p>
                  <small>{formatDisplayDate(lead.date)} • {lead.source}</small>
                </div>
                <select className="form-select" value={lead.status} onChange={event => handleLeadStatusChange(lead.id, event.target.value)} aria-label={`Status de ${lead.name || 'interessado'}`}>
                  <option value="novo">novo</option>
                  <option value="contatado">contatado</option>
                  <option value="arquivado">arquivado</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dashboard-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 20px;
          max-width: 100%;
        }

        .dashboard-actions-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .dashboard-intake-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 20px;
          margin-bottom: 20px;
          max-width: 100%;
        }

        .dashboard-action-btn {
          width: 100%;
          min-width: 0;
          overflow: visible;
          white-space: normal;
          line-height: 1.25;
        }

        .dashboard-action-btn span {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .dashboard-leads-header,
        .dashboard-adherence-header,
        .dashboard-adherence-row,
        .dashboard-lead-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .dashboard-leads-list,
        .dashboard-adherence-list {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .dashboard-lead-row,
        .dashboard-adherence-row {
          padding: 12px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.02);
        }

        .dashboard-lead-row p {
          color: var(--text-secondary);
          font-size: 0.84rem;
          margin: 4px 0;
        }

        .dashboard-adherence-row p {
          color: var(--text-secondary);
          font-size: 0.84rem;
          margin: 4px 0;
        }

        .dashboard-lead-row small {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .dashboard-adherence-row small {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .dashboard-lead-row .form-select {
          width: 150px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .dashboard-intake-grid,
          .dashboard-main-grid { grid-template-columns: minmax(0, 1fr); }

          .dashboard-leads-header,
          .dashboard-adherence-header,
          .dashboard-adherence-row,
          .dashboard-lead-row { align-items: stretch; flex-direction: column; }

          .dashboard-lead-row .form-select { width: 100%; }
        }

        @media (max-width: 360px) {
          .dashboard-actions-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </div>
  );
}
