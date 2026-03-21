import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getStudents, getWorkouts, getEvolution, getSchedule, getScheduleByDate } from '../lib/storage';
import { LayoutDashboard, Users, Dumbbell, TrendingUp, Plus, ArrowRight, CalendarDays, Clock, Camera, Settings } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, workouts: 0, evolution: 0 });
  const [todayEvents, setTodayEvents] = useState([]);

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
    });
    // Merge student names
    setTodayEvents(todaySchedule.map(e => ({
      ...e,
      studentName: students.find(s => s.id === e.studentId)?.name || '',
    })));
  }, []);

  const quickActions = [
    { label: 'Novo Aluno', icon: Users, color: 'orange', path: '/students' },
    { label: 'Novo Treino', icon: Dumbbell, color: 'blue', path: '/workouts' },
    { label: 'Evolução', icon: TrendingUp, color: 'green', path: '/evolution' },
    { label: 'Agenda', icon: CalendarDays, color: 'purple', path: '/schedule' },
    { label: 'Fotos', icon: Camera, color: 'orange', path: '/photos' },
    { label: 'Configurações', icon: Settings, color: 'blue', path: '/settings' },
  ];

  const EVENT_COLORS = { treino: '#FF6B35', avaliacao: '#3B82F6', consulta: '#22C55E', outro: '#8B5CF6' };

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
          <div className="stat-info"><h4>{stats.students}</h4><p>Alunos</p></div>
        </div>
        <div className="stat-card" onClick={() => navigate('/workouts')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon blue"><Dumbbell size={24} color="white" /></div>
          <div className="stat-info"><h4>{stats.workouts}</h4><p>Treinos</p></div>
        </div>
        <div className="stat-card" onClick={() => navigate('/evolution')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon green"><TrendingUp size={24} color="white" /></div>
          <div className="stat-info"><h4>{stats.evolution}</h4><p>Avaliações</p></div>
        </div>
        <div className="stat-card" onClick={() => navigate('/schedule')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon purple"><CalendarDays size={24} color="white" /></div>
          <div className="stat-info"><h4>{todayEvents.length}</h4><p>Hoje na Agenda</p></div>
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
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${EVENT_COLORS[ev.type] || EVENT_COLORS.outro}` }}>
                  <Clock size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>{ev.title}</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.time} {ev.studentName && `• ${ev.studentName}`}</p>
                  </div>
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
