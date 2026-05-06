import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { getStudents, getWorkouts, getEvolution, getScheduleByDate, getUserPlan, getStudentUsage, isVipUser, saveNotification, forceSyncData } from '../lib/storage';
import { useStorageSync } from '../lib/useStorageSync';
import { LayoutDashboard, Users, Dumbbell, TrendingUp, Plus, ArrowRight, CalendarDays, Clock, Camera, Settings, Crown, Bell } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const addToast = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, workouts: 0, evolution: 0, premiumCount: 0 });
  const [todayEvents, setTodayEvents] = useState([]);
  const plan = getUserPlan();
  const usage = getStudentUsage();
  const isVip = isVipUser(user?.email);
  const { revision } = useStorageSync();

  useEffect(() => {
    const students = getStudents();
    const workouts = getWorkouts();
    const evolution = getEvolution();
    const today = new Date().toISOString().split('T')[0];
    const todaySchedule = getScheduleByDate(today);
    
    setStats({
      students: students.length,
      workouts: workouts.length,
      evolution: evolution.length,
      premiumCount: students.filter(s => s.isPremium).length,
    });
    // Merge student names
    setTodayEvents(todaySchedule.map(e => {
      const student = students.find(s => s.id === e.studentId) || {};
      return {
        ...e,
        studentName: student.name || "",
        studentPhone: student.phone || student.whatsapp || ""
      };
    }));
  }, [revision]);

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Quick Actions */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>⚡ Ações Rápidas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {quickActions.map(action => (
              <button key={action.label} className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: '10px', padding: '12px 14px' }}
                onClick={() => navigate(action.path)}>
                <action.icon size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="card" style={{ padding: '24px' }}>
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
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
