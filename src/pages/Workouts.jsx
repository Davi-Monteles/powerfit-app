import { useState, useEffect } from 'react';
import { getWorkouts, saveWorkout, deleteWorkout, getStudents, sendWorkoutViaWhatsApp } from '../lib/storage';
import { generateWorkoutPDF } from '../lib/pdf';
import { useToast } from '../App';
import { Dumbbell, Plus, Search, Edit2, Trash2, X, Send, GripVertical, MessageCircle, FileDown } from 'lucide-react';

const exerciseCategories = ['Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Perna', 'Glúteo', 'Abdômen', 'Cardio', 'Funcional'];

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const addToast = useToast();

  const emptyExercise = { name: '', sets: 3, reps: 12, weight: '', rest: 60, notes: '' };
  const emptyForm = { name: '', description: '', category: 'Musculação', exercises: [{ ...emptyExercise }] };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setWorkouts(getWorkouts());
    setStudents(getStudents());
  }, []);

  const filtered = workouts.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm(emptyForm); setEditingWorkout(null); setShowModal(true); };
  const openEdit = (workout) => { setForm({ ...workout }); setEditingWorkout(workout); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name) { addToast('Nome do treino é obrigatório', 'error'); return; }
    if (form.exercises.some(ex => !ex.name)) { addToast('Preencha o nome de todos os exercícios', 'error'); return; }
    saveWorkout(form);
    setWorkouts(getWorkouts());
    setShowModal(false);
    addToast(editingWorkout ? 'Treino atualizado!' : 'Treino criado!', 'success');
  };

  const handleDelete = (id) => {
    if (!confirm('Tem certeza que deseja excluir este treino?')) return;
    deleteWorkout(id);
    setWorkouts(getWorkouts());
    addToast('Treino excluído', 'info');
  };

  const addExercise = () => {
    setForm({ ...form, exercises: [...form.exercises, { ...emptyExercise }] });
  };

  const removeExercise = (idx) => {
    if (form.exercises.length <= 1) return;
    setForm({ ...form, exercises: form.exercises.filter((_, i) => i !== idx) });
  };

  const updateExercise = (idx, field, value) => {
    const exercises = [...form.exercises];
    exercises[idx] = { ...exercises[idx], [field]: value };
    setForm({ ...form, exercises });
  };

  const openWhatsApp = (workout) => {
    setSelectedWorkout(workout);
    setShowWhatsAppModal(true);
  };

  const handleSendWhatsApp = (student) => {
    if (!student.phone) {
      addToast('Aluno não tem telefone cadastrado', 'error');
      return;
    }
    sendWorkoutViaWhatsApp(student.phone, selectedWorkout, student.name);
    setShowWhatsAppModal(false);
    addToast(`Treino enviado para ${student.name} via WhatsApp!`, 'success');
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><Dumbbell size={24} style={{ color: 'var(--primary)' }} /> Treinos</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search />
            <input className="form-input" placeholder="Buscar treino..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Novo Treino</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Dumbbell size={64} />
          <h3>Nenhum treino encontrado</h3>
          <p>{search ? 'Tente outro termo de busca' : 'Clique em "Novo Treino" para criar'}</p>
          {!search && <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Criar Treino</button>}
        </div>
      ) : (
        <div className="workouts-grid">
          {filtered.map(workout => (
            <div key={workout.id} className="card card-glow workout-card">
              <div className="workout-header">
                <div>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{workout.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{workout.description}</p>
                </div>
                <span className="badge badge-secondary">{workout.category}</span>
              </div>

              <div className="workout-exercises">
                {workout.exercises?.map((ex, i) => (
                  <div key={i} className="workout-exercise">
                    <span className="exercise-number">{i + 1}</span>
                    <div className="exercise-info">
                      <strong>{ex.name}</strong>
                      <span>
                        {ex.sets}x{ex.reps}
                        {ex.weight ? ` • ${ex.weight}kg` : ''}
                        {ex.rest ? ` • ${ex.rest}s` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="workout-actions">
                <button className="btn btn-whatsapp btn-sm" onClick={() => openWhatsApp(workout)}>
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { generateWorkoutPDF(workout); addToast('PDF gerado!', 'success'); }}>
                  <FileDown size={14} /> PDF
                </button>
                <button className="btn btn-ghost btn-icon" onClick={() => openEdit(workout)}><Edit2 size={16} /></button>
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(workout.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workout Creation/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingWorkout ? 'Editar Treino' : 'Novo Treino'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Nome do Treino *</label>
                  <input className="form-input" placeholder="Ex: Treino A - Superior" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option>Musculação</option>
                    <option>Funcional</option>
                    <option>Cardio</option>
                    <option>HIIT</option>
                    <option>Pilates</option>
                    <option>Outro</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input className="form-input" placeholder="Descrição breve do treino" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>Exercícios</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addExercise}><Plus size={14} /> Adicionar</button>
                </div>

                <div className="exercises-list">
                  {form.exercises.map((ex, idx) => (
                    <div key={idx} className="exercise-form-item">
                      <div className="exercise-form-grip">
                        <GripVertical size={16} style={{ color: 'var(--text-muted)' }} />
                        <span className="exercise-form-number">{idx + 1}</span>
                      </div>
                      <div className="exercise-form-fields">
                        <input className="form-input" placeholder="Nome do exercício *" value={ex.name} onChange={e => updateExercise(idx, 'name', e.target.value)} required style={{ gridColumn: '1 / -1' }} />
                        <div className="exercise-form-row">
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Séries</label>
                            <input type="number" className="form-input" min="1" value={ex.sets} onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value) || 1)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Reps</label>
                            <input type="number" className="form-input" min="1" value={ex.reps} onChange={e => updateExercise(idx, 'reps', parseInt(e.target.value) || 1)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Peso (kg)</label>
                            <input type="number" className="form-input" placeholder="—" value={ex.weight} onChange={e => updateExercise(idx, 'weight', e.target.value)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Descanso (s)</label>
                            <input type="number" className="form-input" value={ex.rest} onChange={e => updateExercise(idx, 'rest', parseInt(e.target.value) || 0)} />
                          </div>
                        </div>
                        <input className="form-input" placeholder="Observações (opcional)" value={ex.notes} onChange={e => updateExercise(idx, 'notes', e.target.value)} style={{ gridColumn: '1 / -1' }} />
                      </div>
                      <button type="button" className="exercise-form-delete" onClick={() => removeExercise(idx)} title="Remover">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingWorkout ? 'Salvar Alterações' : 'Criar Treino'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Send Modal */}
      {showWhatsAppModal && (
        <div className="modal-overlay" onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>📱 Enviar via WhatsApp</h3>
              <button className="modal-close" onClick={() => setShowWhatsAppModal(false)}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Enviar <strong>{selectedWorkout?.name}</strong> para qual aluno?
            </p>
            {students.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Nenhum aluno cadastrado</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {students.map(s => (
                  <button key={s.id} className="card" style={{ cursor: 'pointer', textAlign: 'left', padding: '12px 16px' }} onClick={() => handleSendWhatsApp(s)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="student-avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem', background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', flexShrink: 0 }}>
                        {s.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.9rem' }}>{s.name}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.phone || 'Sem telefone'}</p>
                      </div>
                      <Send size={16} style={{ color: 'var(--success)' }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .workouts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 16px;
        }
        
        .workout-card { display: flex; flex-direction: column; gap: 14px; }
        
        .workout-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        
        .workout-exercises {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .workout-exercise {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.02);
          border-radius: var(--radius-sm);
        }
        
        .exercise-number {
          width: 22px;
          height: 22px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .exercise-info {
          display: flex;
          flex-direction: column;
        }
        
        .exercise-info strong { font-size: 0.85rem; }
        .exercise-info span { font-size: 0.75rem; color: var(--text-muted); }
        
        .workout-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        
        .exercises-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .exercise-form-item {
          display: flex;
          gap: 10px;
          padding: 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          align-items: flex-start;
        }
        
        .exercise-form-grip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding-top: 8px;
        }
        
        .exercise-form-number {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--gradient-primary);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .exercise-form-fields {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .exercise-form-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        
        .exercise-form-delete {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          margin-top: 6px;
        }
        
        .exercise-form-delete:hover { color: var(--danger); }

        @media (max-width: 768px) {
          .workouts-grid { grid-template-columns: 1fr; }
          .exercise-form-row { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
