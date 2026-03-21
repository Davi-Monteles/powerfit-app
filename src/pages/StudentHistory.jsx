import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudentById, getWorkouts, getEvolutionByStudent, calculateIMC, calculateTMB, calculateCalories } from '../lib/storage';
import { History, ArrowLeft, Dumbbell, TrendingUp, Scale, Activity, Heart, Flame } from 'lucide-react';

export default function StudentHistory() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [evolution, setEvolution] = useState([]);

  useEffect(() => {
    const s = getStudentById(studentId);
    setStudent(s);
    if (s) {
      const allWorkouts = getWorkouts();
      const studentWorkouts = allWorkouts.filter(w => s.workoutIds?.includes(w.id));
      setWorkouts(studentWorkouts);
      setEvolution(getEvolutionByStudent(studentId));
    }
  }, [studentId]);

  if (!student) return <div className="page-container"><p>Aluno não encontrado</p></div>;

  const latestEvo = evolution[evolution.length - 1];
  const weight = latestEvo?.weight || student.weight;
  const height = student.height;

  // Calculate age
  let age = null;
  if (student.birthDate) {
    const bd = new Date(student.birthDate);
    age = Math.floor((Date.now() - bd.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  const imc = calculateIMC(weight, height);
  const tmb = calculateTMB(weight, height, age, student.gender);
  const calories = calculateCalories(tmb, student.daysPerWeek || 3);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/students" className="btn btn-ghost btn-icon"><ArrowLeft size={20} /></Link>
          <History size={24} style={{ color: 'var(--primary)' }} /> {student.name}
        </h2>
      </div>

      {/* IMC & Metrics Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} style={{ color: 'var(--primary)' }} /> Calculadora de Métricas
        </h3>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <div className="stat-icon orange"><Scale size={22} color="white" /></div>
            <div className="stat-info">
              <h4>{imc ? imc.value : '—'}</h4>
              <p>IMC {imc && <span style={{ fontSize: '0.7rem' }}>({imc.classification})</span>}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Flame size={22} color="white" /></div>
            <div className="stat-info">
              <h4>{tmb || '—'}<small style={{ fontSize: '0.5em', fontWeight: '400' }}> kcal</small></h4>
              <p>Taxa Metabólica Basal</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><Heart size={22} color="white" /></div>
            <div className="stat-info">
              <h4>{calories ? calories.maintenance : '—'}<small style={{ fontSize: '0.5em', fontWeight: '400' }}> kcal</small></h4>
              <p>Calorias Manutenção</p>
            </div>
          </div>
        </div>
        {calories && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
            <div className="badge badge-success">🔻 Emagrecer: ~{calories.loss} kcal/dia</div>
            <div className="badge badge-warning">⚖️ Manter: ~{calories.maintenance} kcal/dia</div>
            <div className="badge badge-primary">🔺 Ganhar massa: ~{calories.gain} kcal/dia</div>
          </div>
        )}
      </div>

      {/* Workout History */}
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Dumbbell size={20} style={{ color: 'var(--primary)' }} /> Treinos Atribuídos
      </h3>
      {workouts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Nenhum treino atribuído</div>
      ) : (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {workouts.map(w => (
            <div key={w.id} className="card card-glow" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ fontSize: '1rem' }}>{w.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.description}</p>
                </div>
                <span className="badge badge-secondary">{w.category}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {w.exercises?.map((ex, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.82rem', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', flexShrink: 0 }}>{i+1}</span>
                    <strong>{ex.name}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{ex.sets}x{ex.reps} {ex.weight ? `• ${ex.weight}kg` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evolution Summary */}
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={20} style={{ color: 'var(--primary)' }} /> Histórico de Evolução
      </h3>
      {evolution.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Nenhum registro de evolução</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Data</th><th>Peso</th><th>Gordura</th><th>Peito</th><th>Cintura</th><th>Braço</th><th>Coxa</th></tr>
            </thead>
            <tbody>
              {[...evolution].reverse().map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                  <td>{e.weight || '—'}</td>
                  <td>{e.bodyFat ? `${e.bodyFat}%` : '—'}</td>
                  <td>{e.chest || '—'}</td>
                  <td>{e.waist || '—'}</td>
                  <td>{e.arm || '—'}</td>
                  <td>{e.thigh || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
