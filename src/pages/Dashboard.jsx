import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../lib/app-context';
import { getStudents, getWorkouts, getEvolution, getScheduleByDate, getUserPlan, getStudentUsage, isVipUser, saveNotification, forceSyncData } from '../lib/storage';
import { useStorageSync } from '../lib/useStorageSync';
import { LayoutDashboard, Users, Dumbbell, TrendingUp, Plus, ArrowRight, CalendarDays, Clock, Camera, Settings, Crown, Bell } from 'lucide-react';
import StudentIntakeSummary from '../components/StudentIntakeSummary';
import WorkoutDraftCard from '../components/WorkoutDraftCard';

export default function Dashboard() {
  const { user } = useAuth();
  const addToast = useToast();
  const navigate = useNavigate();
  const plan = getUserPlan();
  const usage = getStudentUsage();
  const isVip = isVipUser(user?.email);
  useStorageSync();

  const students = getStudents();
  const workouts = getWorkouts();
  const evolution = getEvolution();
  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = getScheduleByDate(today);
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

        @media (max-width: 768px) {
          .dashboard-intake-grid,
          .dashboard-main-grid { grid-template-columns: minmax(0, 1fr); }
        }

        @media (max-width: 360px) {
          .dashboard-actions-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </div>
  );
}
