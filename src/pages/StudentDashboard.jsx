import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/app-context';
import { getStudentVisibleEvolution, calculateIMC, calculateTMB, calculateCalories, getTrainerById, updateWorkoutScheduleStatus, getNotificationsByStudent, markNotificationsAsRead, fetchWorkoutsForStudent, isStudentPremium, resolveStudentProfileForAuthUser, refreshEvolutionFromSupabase, refreshScheduleFromSupabase, getStudentVisibleSchedule, activateStudentProDemo } from '../lib/storage';
import { useStorageSync } from '../lib/useStorageSync';
import { LayoutDashboard, Dumbbell, TrendingUp, Scale, Activity, Flame, Heart, Calendar, Users, Bell, DownloadCloud, ClipboardList, ShieldAlert } from 'lucide-react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PremiumLobby from './PremiumLobby';
import AIAssistantNotice from '../components/AIAssistantNotice';
import AIChat from '../components/AIChat';
import usePWAInstall from '../hooks/usePWAInstall';
import { getStudentIntake, getStudentIntakeSummary, getStudentRiskFlags, hasCompletedStudentIntake } from '../lib/student-intake';
import StudentIntake from './StudentIntake';

const metrics = [
  { key: 'weight', label: 'Peso (kg)', color: '#FF6B35' },
  { key: 'bodyFat', label: 'Gordura (%)', color: '#3B82F6' },
  { key: 'arm', label: 'Braço (cm)', color: '#EC4899' },
];

export default function StudentDashboard() {
  const { user, login: setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [personal, setPersonal] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [evolution, setEvolution] = useState([]);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [showStudentIntake, setShowStudentIntake] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pendingCompletionId, setPendingCompletionId] = useState(null);
  const workoutsInitRef = useRef(false);
  const paymentProcessedRef = useRef(false);
  const { revision } = useStorageSync('notifications');
  const { canInstall, installApp, isInstalling } = usePWAInstall();
  const activeStudentId = student?.id || student?.studentId || student?.student_id;
  const studentPersonalId = student?.personalId;
  const studentEmail = student?.email;

  // Safe workout init — runs once per mount via ref guard
  useEffect(() => {
    if (!user?.id || workoutsInitRef.current) return;
    workoutsInitRef.current = true;
    const saved = JSON.parse(localStorage.getItem("workouts_" + user.id) || '[]');
    if (saved.length) {
      setWorkouts(saved);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    if (user?.email || user?.type === 'aluno') {
      let isMounted = true;
      const fetchFreshData = async () => {
        let s = null;
        
        // Resolve once by normalized email so duplicated student rows prefer the trainer-linked profile.
        try {
          s = await resolveStudentProfileForAuthUser(user, { persist: true });
        } catch (e) {
          console.error("🔥 Error syncing fresh student data:", e);
        }

        if (!isMounted) return;

        s = s ? { ...s, isPremium: isStudentPremium(s) } : { ...user, isPremium: isStudentPremium(user) };
        
        setStudent(s);

        if (s) {
          if (s.personalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.personalId)) {
            getTrainerById(s.personalId).then(myTrainer => {
              if (myTrainer && isMounted) setPersonal(myTrainer);
            }).catch(() => {});
          }

          const activeStudentId = s.id || s.studentId || s.student_id;

          try {
            const freshWorkouts = await fetchWorkoutsForStudent(activeStudentId, s.personalId, s.email || user.email);
            if (isMounted && Array.isArray(freshWorkouts)) {
              localStorage.setItem("workouts_" + activeStudentId, JSON.stringify(freshWorkouts));
              setWorkouts(freshWorkouts);
            }
          } catch (error) {
            console.warn('[StudentDashboard] Workouts sync warning:', error);
          }

          if (!isMounted) return;

          await refreshEvolutionFromSupabase(s);
          setEvolution(getStudentVisibleEvolution(s));
          await refreshScheduleFromSupabase();
          setScheduleEvents(getStudentVisibleSchedule(s));
          const notifs = getNotificationsByStudent(activeStudentId);
          setNotifications(notifs.filter(n => !n.read));
        }
      };

      // Execute explicitly
      fetchFreshData();
      return () => { isMounted = false; };
    }
  }, [user, revision]);

  useEffect(() => {
    if (!activeStudentId) return;

    let isMounted = true;
    const refreshWeeklyWorkouts = async () => {
      try {
        const freshWorkouts = await fetchWorkoutsForStudent(activeStudentId, studentPersonalId, studentEmail || user?.email);
        if (isMounted && Array.isArray(freshWorkouts)) {
          setWorkouts(freshWorkouts);
        }
      } catch (error) {
        console.warn('[StudentDashboard] Weekly schedule refresh warning:', error);
      }
    };

    window.addEventListener('powerfit:weekly-schedule-updated', refreshWeeklyWorkouts);
    return () => {
      isMounted = false;
      window.removeEventListener('powerfit:weekly-schedule-updated', refreshWeeklyWorkouts);
    };
  }, [activeStudentId, studentPersonalId, studentEmail, user?.email]);

  const applyWorkoutStatus = (scheduleId, status) => {
    if (!student) return;
    updateWorkoutScheduleStatus(student.id || student.studentId || student.student_id, scheduleId, status);
    setStudent(prev => {
      if (!prev) return null;
      const newSchedule = (prev.workoutSchedule || []).map(w => 
        w.id === scheduleId ? { ...w, status, completed: status === 'completed' || status === 'archived' } : w
      );
      return { ...prev, workoutSchedule: newSchedule };
    });
    
    setWorkouts(prev => prev.map(w => 
      w.scheduleId === scheduleId ? { ...w, status, completed: status === 'completed' || status === 'archived' } : w
    ));
    setPendingCompletionId(null);
  };

  const handleToggleWorkout = (workout) => {
    if (!workout?.scheduleId) return;
    if (workout.status === 'completed') {
      applyWorkoutStatus(workout.scheduleId, 'pending');
      return;
    }

    setPendingCompletionId(workout.scheduleId);
  };

  const handleAIClick = () => {
    if (isStudentPremium(student)) {
      setIsAIChatOpen(true);
    } else {
      navigate('/upgrade');
    }
  };

  const handleStudentProUpgrade = () => {
    const upgraded = activateStudentProDemo(student || user);
    if (upgraded && typeof upgraded === 'object') {
      setAuthUser(upgraded);
      setStudent({ ...upgraded, isPremium: isStudentPremium(upgraded) });
    }
  };

  useEffect(() => {
    if (paymentProcessedRef.current) return;
    if (student && !student.isPremium) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        paymentProcessedRef.current = true;
        import('../lib/storage').then(({ saveStudent, getStudentById: getById }) => {
          saveStudent({ ...student, isPremium: true });
          window.history.replaceState({}, document.title, window.location.pathname);
          setStudent(getById(student.id || student.studentId));
        });
      }
    }
  }, [student]);

  // PREVENT BLACK SCREEN — early return AFTER all hooks
  if (!user) return null;

  if (!student) return (
    <div className="page-container"><div className="empty-state"><Activity size={64} /><h3>Perfil não encontrado</h3><p>Contate seu personal trainer</p></div></div>
  );

  
  // Safe stats calculations — force Number() to prevent string math
  const weight = Number(student?.weight) || 0;
  const height = Number(student?.height) || 0;
  const age = student?.birthDate 
    ? Math.floor((Date.now() - new Date(student.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
  
  const imc = calculateIMC(weight, height);
  const tmb = calculateTMB(weight, height, age, student?.gender);
    
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });

  const calories = calculateCalories(tmb, student.daysPerWeek || 3);
  const activeWorkouts = workouts.filter(w => w.status !== 'archived');
  const hasPremiumAccess = isStudentPremium(student);
  const studentIntake = getStudentIntake(activeStudentId);
  const hasIntake = hasCompletedStudentIntake(activeStudentId);
  const intakeSummary = getStudentIntakeSummary(studentIntake);
  const intakeRiskFlags = getStudentRiskFlags(studentIntake);

  const chartData = evolution.map(e => ({
    ...e,
    date: new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }));

  const upcomingEvents = scheduleEvents
    .filter(event => event.date)
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`))
    .slice(0, 3);

  if (showStudentIntake) {
    return <StudentIntake onBack={() => setShowStudentIntake(false)} />;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header" style={{ marginBottom: "8px" }}>
        <h2>
          <LayoutDashboard size={24} style={{ color: "var(--primary)" }} />
          Olá, {student.name ? student.name.split(" ")[0] : "Atleta"}! 👋
          {hasPremiumAccess && <span className="badge badge-primary" style={{ marginLeft: '10px', verticalAlign: 'middle' }}>⭐ PRO</span>}
        </h2>
        {canInstall && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={installApp}
            disabled={isInstalling}
            style={{ borderRadius: '8px', minHeight: '40px' }}
          >
            <DownloadCloud size={18} />
            {isInstalling ? 'Instalando...' : 'Instalar Aplicativo'}
          </button>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="card" style={{ marginBottom: "24px", background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Bell size={24} style={{ color: "#06b6d4" }} />
              <div>
                <strong style={{ color: "#06b6d4" }}>Você tem {notifications.length} novo(s) lembrete(s) de treino!</strong>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Seu personal enviou um aviso para você manter o foco.</p>
              </div>
            </div>
            <button 
              className="btn btn-sm" 
              style={{ background: "#06b6d4", color: "#000", fontWeight: "bold", padding: "6px 12px" }}
              onClick={() => {
                markNotificationsAsRead(student.id || student.studentId);
                setNotifications([]);
              }}
            >
              Marcar como lido
            </button>
          </div>
        </div>
      )}
      {student.personalId ? (
        personal && (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={14} /> Seu Personal: <strong style={{ color: "#06b6d4" }}>{personal.name}</strong>
          </p>
        )
      ) : (
        <div className="card" style={{ marginBottom: "24px", padding: "12px 16px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.08)", border: "1px solid rgba(6, 182, 212, 0.2)", display: "flex", alignItems: "center", gap: "12px" }}>
          <Users size={20} style={{ color: "#06b6d4", flexShrink: 0 }} />
          <div>
            <strong style={{ color: "#06b6d4", fontSize: "0.9rem", display: "block", marginBottom: "2px" }}>Aluno</strong>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>Você ainda não está vinculado a um Personal Trainer. Use nossos treinos IA ou encontre um treinador.</p>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px', padding: '18px', borderColor: hasIntake ? 'rgba(34,197,94,0.28)' : 'rgba(255,107,53,0.28)', background: hasIntake ? 'rgba(34,197,94,0.04)' : 'rgba(255,107,53,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: '1 1 280px' }}>
            <div className="stat-icon" style={{ width: '42px', height: '42px', background: hasIntake ? 'linear-gradient(135deg, #22C55E, #16A34A)' : 'var(--gradient-primary)', flexShrink: 0 }}>
              <ClipboardList size={21} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{hasIntake ? 'Avaliação inicial concluída' : 'Preencher avaliação inicial'}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                {hasIntake
                  ? `${intakeSummary.goal} · ${intakeSummary.availability} · ${intakeSummary.experienceLevel}`
                  : 'Informe objetivo, rotina, equipamentos e pontos de segurança para uma demo mais completa.'}
              </p>
              {hasIntake && intakeRiskFlags.length > 0 && (
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontSize: '0.8rem', marginTop: '8px', fontWeight: 700 }}>
                  <ShieldAlert size={14} /> Atenção: revisar com profissional antes de treinar.
                </p>
              )}
            </div>
          </div>
          <button type="button" className={hasIntake ? 'btn btn-outline' : 'btn btn-primary'} onClick={() => setShowStudentIntake(true)}>
            {hasIntake ? 'Editar avaliação' : 'Preencher avaliação'}
          </button>
        </div>
      </div>


      {hasPremiumAccess ? (
        <>
          <AIAssistantNotice 
            student={{ ...student, isPremium: true }}
            workouts={workouts} 
            evolution={evolution} 
            onClick={handleAIClick}
          />
           
          <AIChat student={student} isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
        </>
      ) : (
        <PremiumLobby onUpgrade={handleStudentProUpgrade} />
      )}



          {/* Metrics */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon orange"><Scale size={22} color="white" /></div>
          <div className="stat-info"><h4>{Number(weight) > 0 ? weight : '—'}{Number(weight) > 0 && <small style={{ fontSize: '0.5em' }}>kg</small>}</h4><p>Peso Atual</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Activity size={22} color="white" /></div>
          <div className="stat-info"><h4>{imc ? imc.value : '—'}</h4><p>IMC {imc && <span style={{ fontSize: '0.65rem' }}>({imc.classification})</span>}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Flame size={22} color="white" /></div>
          <div className="stat-info"><h4>{Number(tmb) > 0 ? tmb : '—'}{Number(tmb) > 0 && <small style={{ fontSize: '0.5em' }}>kcal</small>}</h4><p>TMB</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}><Heart size={22} color="white" /></div>
          <div className="stat-info"><h4>{calories && calories.maintenance > 0 ? calories.maintenance : '—'}{calories && calories.maintenance > 0 && <small style={{ fontSize: '0.5em' }}>kcal</small>}</h4><p>Cal. Diária</p></div>
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

      {upcomingEvents.length > 0 && (
        <>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--primary)' }} /> Agendamentos
          </h3>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {upcomingEvents.map(event => (
              <div key={event.id} className="card" style={{ padding: '16px', borderLeft: '4px solid var(--primary)' }}>
                <h5 style={{ margin: 0, marginBottom: '6px', fontSize: '0.95rem' }}>{event.title}</h5>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {new Date(`${event.date}T12:00:00`).toLocaleDateString('pt-BR')} {event.time ? `às ${event.time}` : ''}
                </p>
                {event.notes && <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{event.notes}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Weekly Planner — always show all 7 days */}
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={20} style={{ color: 'var(--primary)' }} /> Plano Semanal
      </h3>
      <div style={{ display: 'grid', gap: '12px', marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => {
          const dayWorkouts = activeWorkouts.filter(w => w.day === day);
          const isToday = today.toLowerCase().includes(day.toLowerCase().replace('á','a').replace('ç','c'));
          return (
            <div key={day} className="card" style={{ 
              padding: '16px', 
              borderLeft: isToday ? '4px solid var(--primary)' : '4px solid transparent',
              background: isToday ? 'rgba(255,107,53,0.04)' : 'var(--bg-card)',
              minHeight: '100px'
            }}>
              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: isToday ? 'var(--primary)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                <Calendar size={16} /> {day} {isToday && <span style={{ fontSize: '0.65rem', background: 'var(--gradient-primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>HOJE</span>}
              </h4>
              {dayWorkouts.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.6, fontStyle: 'italic' }}>Descanso</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayWorkouts.map((w, idx) => {
                    const isCompleted = w.status === 'completed';
                    return (
                      <div key={w.scheduleId || idx} style={{ 
                        padding: '12px', 
                        background: isCompleted ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)', 
                        borderRadius: 'var(--radius-md)',
                        borderLeft: isCompleted ? '3px solid #22c55e' : '3px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <h5 style={{ fontSize: '0.88rem', color: isCompleted ? '#22c55e' : 'inherit', margin: 0 }}>
                            {w.name} {isCompleted && '✓'}
                          </h5>
                          {w.scheduleId && (
                            <button 
                              onClick={() => handleToggleWorkout(w)}
                              className={isCompleted ? "btn btn-sm btn-success" : "btn btn-sm btn-outline"}
                              style={{ padding: "2px 10px", fontSize: "0.7rem", height: "auto", minHeight: "26px" }}
                            >
                              {isCompleted ? '✓' : 'Concluir'}
                            </button>
                          )}
                        </div>
                        {w.exercises?.slice(0, 3).map((ex, i) => (
                          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.78rem', padding: '3px 0', color: 'var(--text-secondary)' }}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: isCompleted ? '#22c55e' : 'var(--gradient-primary)', color: 'white', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', flexShrink: 0 }}>{i+1}</span>
                            <span>{ex.name}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.7 }}>{ex.sets}x{ex.reps}</span>
                          </div>
                        ))}
                        {w.exercises?.length > 3 && (
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>+{w.exercises.length - 3} exercícios</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Treinos gerais (não associados a dia) */}
      {activeWorkouts.filter(w => w.day === 'Geral').length > 0 && (
        <>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dumbbell size={20} style={{ color: 'var(--primary)' }} /> Treinos Gerais
          </h3>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {activeWorkouts.filter(w => w.day === 'Geral').map((w, idx) => (
              <div key={w.scheduleId || idx} className="card" style={{ padding: '16px' }}>
                <h5 style={{ marginBottom: '6px', fontSize: '0.95rem' }}>{w.name}</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Evolution Chart */}
      {chartData.length > 1 ? (
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
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '28px', marginBottom: '24px' }}>
          <TrendingUp size={36} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>{evolution.length === 0 ? 'Nenhuma evolução registrada ainda' : 'Dados insuficientes para gráfico'}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{evolution.length === 0 ? 'Quando seu personal registrar medidas, elas aparecerão aqui.' : 'Com pelo menos 2 medidas, o gráfico será exibido.'}</p>
        </div>
      )}

      {pendingCompletionId && (
        <div className="modal-overlay" onClick={() => setPendingCompletionId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Treino concluído</h3>
              <button className="modal-close" onClick={() => setPendingCompletionId(null)}>x</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              O que deseja fazer com este treino agora?
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => applyWorkoutStatus(pendingCompletionId, 'completed')}>Manter treino</button>
              <button className="btn btn-primary" onClick={() => applyWorkoutStatus(pendingCompletionId, 'archived')}>Arquivar treino</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
