import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getStudentById, getWorkouts, getEvolutionByStudent, calculateIMC, calculateTMB, calculateCalories } from '../lib/storage';
import { LayoutDashboard, Dumbbell, TrendingUp, Scale, Activity, Flame, Heart, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PremiumLobby from './PremiumLobby';
import AIAssistantNotice from '../components/AIAssistantNotice';

const metrics = [
  { key: 'weight', label: 'Peso (kg)', color: '#FF6B35' },
  { key: 'bodyFat', label: 'Gordura (%)', color: '#3B82F6' },
  { key: 'arm', label: 'Braço (cm)', color: '#EC4899' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [evolution, setEvolution] = useState([]);

  useEffect(() => {
    if (user?.studentId) {
      const s = getStudentById(user.studentId);
      setStudent(s);
      if (s) {
        const all = getWorkouts();
        // legacy support
        const legacyWorkouts = all.filter(w => s.workoutIds?.includes(w.id)).map(w => ({ ...w, day: 'Geral' }));
        // new schedule support
        const scheduledWorkouts = (s.workoutSchedule || []).map(schedule => {
          const workout = all.find(w => w.id === schedule.workoutId);
          return workout ? { ...workout, scheduleId: schedule.id, day: schedule.day } : null;
        }).filter(Boolean);

        setWorkouts([...legacyWorkouts, ...scheduledWorkouts]);
        setEvolution(getEvolutionByStudent(s.id));
      }
    }
  }, [user]);

  useEffect(() => {
    if (student && !student.isPremium) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        import('../lib/storage').then(({ saveStudent, getStudentById }) => {
          saveStudent({ ...student, isPremium: true });
          window.history.replaceState({}, document.title, window.location.pathname);
          setStudent(getStudentById(student.id));
        });
      }
    }
  }, [student]);

  if (!student) return (
    <div className="page-container"><div className="empty-state"><Activity size={64} /><h3>Perfil não encontrado</h3><p>Contate seu personal trainer</p></div></div>
  );

  const latestEvo = evolution[evolution.length - 1];
  const weight = latestEvo?.weight || student.weight;
  const height = student.height;
  
  let age = null;
  if (student.birthDate) {
    const bd = new Date(student.birthDate);
    age = Math.floor((Date.now() - bd.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  const imc = calculateIMC(weight, height);
  const tmb = calculateTMB(weight, height, age, student.gender);
  const calories = calculateCalories(tmb, student.daysPerWeek || 3);

  const chartData = evolution.map(e => ({
    ...e,
    date: new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }));

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><LayoutDashboard size={24} style={{ color: 'var(--primary)' }} /> Olá, {student.name.split(' ')[0]}! 👋</h2>
      </div>

      {!student.isPremium ? (
        <PremiumLobby onUpgrade={() => setStudent(prev => ({...prev, isPremium: true}))} />
      ) : (
        <>
          <AIAssistantNotice student={student} workouts={workouts} evolution={evolution} />
          
          {/* Metrics */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon orange"><Scale size={22} color="white" /></div>
          <div className="stat-info"><h4>{weight || '—'}<small style={{ fontSize: '0.5em' }}>kg</small></h4><p>Peso Atual</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Activity size={22} color="white" /></div>
          <div className="stat-info"><h4>{imc ? imc.value : '—'}</h4><p>IMC {imc && <span style={{ fontSize: '0.65rem' }}>({imc.classification})</span>}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Flame size={22} color="white" /></div>
          <div className="stat-info"><h4>{tmb || '—'}<small style={{ fontSize: '0.5em' }}>kcal</small></h4><p>TMB</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Heart size={22} color="white" /></div>
          <div className="stat-info"><h4>{calories ? calories.maintenance : '—'}<small style={{ fontSize: '0.5em' }}>kcal</small></h4><p>Cal. Diária</p></div>
        </div>
      </div>

      {calories && (
        <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>🎯 Calorias Recomendadas</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="badge badge-success">🔻 Perda: ~{calories.loss} kcal</div>
            <div className="badge badge-warning">⚖️ Mantém: ~{calories.maintenance} kcal</div>
            <div className="badge badge-primary">🔺 Ganho: ~{calories.gain} kcal</div>
          </div>
        </div>
      )}

      {/* My Workouts */}
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Dumbbell size={20} style={{ color: 'var(--primary)' }} /> Meus Treinos
      </h3>
      {workouts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px', marginBottom: '24px', color: 'var(--text-muted)' }}>
          Nenhum treino atribuído pelo personal
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Geral'].map(day => {
            const dayWorkouts = workouts.filter(w => w.day === day);
            if (dayWorkouts.length === 0) return null;

            return (
              <div key={day} className="card card-glow" style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                   <Calendar size={18} /> {day}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dayWorkouts.map((w, idx) => (
                    <div key={w.scheduleId || idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                      <h5 style={{ marginBottom: '6px', fontSize: '1rem' }}>{w.name}</h5>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{w.description}</p>
                      {w.exercises?.map((ex, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 10px', marginBottom: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', flexShrink: 0 }}>{i+1}</span>
                          <span style={{ fontWeight: '600' }}>{ex.name}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {ex.sets}x{ex.reps} {ex.weight ? `• ${ex.weight}kg` : ''} {ex.rest ? `• ${ex.rest}s` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evolution Chart */}
      {chartData.length > 1 && (
        <>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} /> Minha Evolução
          </h3>
          <div className="card" style={{ padding: '20px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }} />
                <Legend />
                {metrics.map(m => (
                  <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2} dot={{ r: 4, fill: m.color }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}
