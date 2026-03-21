import { useState, useEffect } from 'react';
import { getStudents, getEvolutionByStudent, saveEvolutionEntry, deleteEvolutionEntry } from '../lib/storage';
import { useToast } from '../App';
import { TrendingUp, Plus, X, Trash2, Calendar, Scale, Ruler } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const metrics = [
  { key: 'weight', label: 'Peso (kg)', color: '#FF6B35' },
  { key: 'bodyFat', label: 'Gordura (%)', color: '#3B82F6' },
  { key: 'chest', label: 'Peito (cm)', color: '#22C55E' },
  { key: 'waist', label: 'Cintura (cm)', color: '#F59E0B' },
  { key: 'hip', label: 'Quadril (cm)', color: '#8B5CF6' },
  { key: 'arm', label: 'Braço (cm)', color: '#EC4899' },
  { key: 'thigh', label: 'Coxa (cm)', color: '#06B6D4' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', boxShadow: 'var(--shadow-lg)' }}>
      <p style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.8rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '0.8rem' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Evolution() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [evolutionData, setEvolutionData] = useState([]);
  const [activeMetrics, setActiveMetrics] = useState(['weight', 'bodyFat']);
  const [showModal, setShowModal] = useState(false);
  const addToast = useToast();

  const today = new Date().toISOString().split('T')[0];
  const emptyForm = { date: today, weight: '', bodyFat: '', chest: '', waist: '', hip: '', arm: '', thigh: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const studentsList = getStudents();
    setStudents(studentsList);
    if (studentsList.length > 0) {
      setSelectedStudent(studentsList[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      const data = getEvolutionByStudent(selectedStudent);
      setEvolutionData(data);
    }
  }, [selectedStudent]);

  const toggleMetric = (key) => {
    setActiveMetrics(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const chartData = evolutionData.map(e => ({
    ...e,
    date: new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }));

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedStudent) { addToast('Selecione um aluno', 'error'); return; }
    if (!form.date) { addToast('Selecione a data', 'error'); return; }
    
    const entry = { ...form, studentId: selectedStudent };
    // Convert numeric fields
    metrics.forEach(m => {
      if (entry[m.key]) entry[m.key] = parseFloat(entry[m.key]);
      else delete entry[m.key];
    });

    saveEvolutionEntry(entry);
    setEvolutionData(getEvolutionByStudent(selectedStudent));
    setShowModal(false);
    setForm(emptyForm);
    addToast('Medida registrada!', 'success');
  };

  const handleDeleteEntry = (id) => {
    if (!confirm('Excluir este registro?')) return;
    deleteEvolutionEntry(id);
    setEvolutionData(getEvolutionByStudent(selectedStudent));
    addToast('Registro removido', 'info');
  };

  const currentStudent = students.find(s => s.id === selectedStudent);
  const latestData = evolutionData[evolutionData.length - 1];
  const previousData = evolutionData[evolutionData.length - 2];

  const getDelta = (key) => {
    if (!latestData || !previousData || !latestData[key] || !previousData[key]) return null;
    const delta = (latestData[key] - previousData[key]).toFixed(1);
    return delta > 0 ? `+${delta}` : delta;
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><TrendingUp size={24} style={{ color: 'var(--primary)' }} /> Evolução do Aluno</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ maxWidth: '220px' }} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            {students.length === 0 && <option value="">Nenhum aluno</option>}
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={!selectedStudent}>
            <Plus size={18} /> Nova Medida
          </button>
        </div>
      </div>

      {!selectedStudent || students.length === 0 ? (
        <div className="empty-state">
          <TrendingUp size={64} />
          <h3>Nenhum aluno selecionado</h3>
          <p>Cadastre alunos primeiro para acompanhar a evolução</p>
        </div>
      ) : (
        <>
          {/* Current Stats */}
          {latestData && (
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-icon orange"><Scale size={24} color="white" /></div>
                <div className="stat-info">
                  <h4>{latestData.weight || '—'}<small style={{ fontSize: '0.6em', fontWeight: '400' }}>kg</small></h4>
                  <p>Peso Atual {getDelta('weight') && <span style={{ color: getDelta('weight').startsWith('+') ? 'var(--danger)' : 'var(--success)', fontSize: '0.75rem' }}> ({getDelta('weight')})</span>}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><TrendingUp size={24} color="white" /></div>
                <div className="stat-info">
                  <h4>{latestData.bodyFat || '—'}<small style={{ fontSize: '0.6em', fontWeight: '400' }}>%</small></h4>
                  <p>% Gordura {getDelta('bodyFat') && <span style={{ color: getDelta('bodyFat').startsWith('+') ? 'var(--danger)' : 'var(--success)', fontSize: '0.75rem' }}> ({getDelta('bodyFat')})</span>}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><Ruler size={24} color="white" /></div>
                <div className="stat-info">
                  <h4>{latestData.arm || '—'}<small style={{ fontSize: '0.6em', fontWeight: '400' }}>cm</small></h4>
                  <p>Braço {getDelta('arm') && <span style={{ color: getDelta('arm').startsWith('+') ? 'var(--success)' : 'var(--danger)', fontSize: '0.75rem' }}> ({getDelta('arm')})</span>}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple"><Calendar size={24} color="white" /></div>
                <div className="stat-info">
                  <h4>{evolutionData.length}</h4>
                  <p>Avaliações Registradas</p>
                </div>
              </div>
            </div>
          )}

          {/* Metric Toggles */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Selecione as métricas para exibir no gráfico:</p>
            <div className="tag-group">
              {metrics.map(m => (
                <button
                  key={m.key}
                  className={`tag ${activeMetrics.includes(m.key) ? 'active' : ''}`}
                  onClick={() => toggleMetric(m.key)}
                  style={activeMetrics.includes(m.key) ? { background: m.color, borderColor: m.color } : {}}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 ? (
            <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                Evolução - {currentStudent?.name}
              </h4>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {metrics.filter(m => activeMetrics.includes(m.key)).map(m => (
                    <Line
                      key={m.key}
                      type="monotone"
                      dataKey={m.key}
                      name={m.label}
                      stroke={m.color}
                      strokeWidth={2}
                      dot={{ r: 4, fill: m.color }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px', marginBottom: '24px' }}>
              <TrendingUp size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>Dados insuficientes para gráfico</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Registre pelo menos 2 medidas para ver o gráfico de evolução</p>
            </div>
          )}

          {/* History Table */}
          {evolutionData.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                Histórico de Medidas
              </h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Peso</th>
                      <th>Gordura</th>
                      <th>Peito</th>
                      <th>Cintura</th>
                      <th>Quadril</th>
                      <th>Braço</th>
                      <th>Coxa</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...evolutionData].reverse().map(entry => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.date).toLocaleDateString('pt-BR')}</td>
                        <td>{entry.weight || '—'}</td>
                        <td>{entry.bodyFat || '—'}</td>
                        <td>{entry.chest || '—'}</td>
                        <td>{entry.waist || '—'}</td>
                        <td>{entry.hip || '—'}</td>
                        <td>{entry.arm || '—'}</td>
                        <td>{entry.thigh || '—'}</td>
                        <td>
                          <button className="btn btn-ghost btn-icon" onClick={() => handleDeleteEntry(entry.id)} style={{ color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Measurement Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📏 Nova Medida</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Registrar medida para <strong>{currentStudent?.name}</strong>
            </p>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Data *</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Peso (kg)</label>
                  <input type="number" step="0.1" className="form-input" placeholder="Ex: 72.5" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">% Gordura</label>
                  <input type="number" step="0.1" className="form-input" placeholder="Ex: 18.5" value={form.bodyFat} onChange={e => setForm({...form, bodyFat: e.target.value})} />
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', marginTop: '4px' }}>Medidas corporais (cm):</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Peito</label>
                  <input type="number" step="0.1" className="form-input" placeholder="cm" value={form.chest} onChange={e => setForm({...form, chest: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cintura</label>
                  <input type="number" step="0.1" className="form-input" placeholder="cm" value={form.waist} onChange={e => setForm({...form, waist: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Quadril</label>
                  <input type="number" step="0.1" className="form-input" placeholder="cm" value={form.hip} onChange={e => setForm({...form, hip: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Braço</label>
                  <input type="number" step="0.1" className="form-input" placeholder="cm" value={form.arm} onChange={e => setForm({...form, arm: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Coxa</label>
                  <input type="number" step="0.1" className="form-input" placeholder="cm" value={form.thigh} onChange={e => setForm({...form, thigh: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Medida</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
