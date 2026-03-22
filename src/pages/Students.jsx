import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, saveStudent, deleteStudent, getWorkouts, assignWorkoutToStudent } from '../lib/storage';
import { useToast } from '../App';
import { Users, Plus, Search, Edit2, Trash2, X, Dumbbell, Phone, Mail, Calendar, Target, History } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [assignDay, setAssignDay] = useState('Segunda');
  const addToast = useToast();
  const navigate = useNavigate();

  const emptyForm = { name: '', email: '', phone: '', birthDate: '', gender: 'Masculino', height: '', weight: '', objective: 'Hipertrofia', daysPerWeek: 3, shift: 'Manhã', address: '', medicalNotes: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setStudents(getStudents());
    setWorkouts(getWorkouts());
  }, []);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm(emptyForm); setEditingStudent(null); setShowModal(true); };
  const openEdit = (student) => { setForm(student); setEditingStudent(student); setShowModal(true); };
  
  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name) { addToast('Nome é obrigatório', 'error'); return; }
    saveStudent(form);
    setStudents(getStudents());
    setShowModal(false);
    addToast(editingStudent ? 'Aluno atualizado!' : 'Aluno cadastrado!', 'success');
  };

  const handleDelete = (id) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    deleteStudent(id);
    setStudents(getStudents());
    addToast('Aluno excluído', 'info');
  };

  const openAssign = (student) => { setAssigningStudent(student); setShowAssignModal(true); };
  
  const handleAssign = (workoutId) => {
    assignWorkoutToStudent(workoutId, assigningStudent.id, assignDay);
    setStudents(getStudents());
    setShowAssignModal(false);
    addToast(`Treino atribuído para ${assignDay}!`, 'success');
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><Users size={24} style={{ color: 'var(--primary)' }} /> Alunos</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search />
            <input className="form-input" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Novo Aluno</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={64} />
          <h3>Nenhum aluno encontrado</h3>
          <p>{search ? 'Tente outro termo de busca' : 'Clique em "Novo Aluno" para cadastrar'}</p>
          {!search && <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Cadastrar Aluno</button>}
        </div>
      ) : (
        <div className="students-grid">
          {filtered.map(student => (
            <div key={student.id} className="card card-glow student-card">
              <div className="student-card-header">
                <div className="student-avatar">{student.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h4 style={{ fontSize: '1rem' }}>{student.name}</h4>
                  <span className="badge badge-primary">{student.objective || 'Sem objetivo'}</span>
                </div>
              </div>
              <div className="student-details">
                {student.email && <div className="student-detail"><Mail size={14} /> {student.email}</div>}
                {student.phone && <div className="student-detail"><Phone size={14} /> {student.phone}</div>}
                {student.birthDate && <div className="student-detail"><Calendar size={14} /> {new Date(student.birthDate).toLocaleDateString('pt-BR')}</div>}
                {student.objective && <div className="student-detail"><Target size={14} /> {student.objective}</div>}
                <div className="student-detail"><Dumbbell size={14} /> {student.workoutIds?.length || 0} treino(s)</div>
              </div>
              <div className="student-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openAssign(student)}><Dumbbell size={14} /> Atribuir Treino</button>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/history/${student.id}`)}><History size={14} /> Histórico</button>
                <button className="btn btn-ghost btn-icon" onClick={() => openEdit(student)}><Edit2 size={16} /></button>
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(student.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStudent ? 'Editar Aluno' : 'Novo Aluno'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gap: '0', gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input className="form-input" placeholder="Nome do aluno" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" placeholder="email@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input className="form-input" placeholder="(00) 00000-0000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Nascimento</label>
                    <input type="date" className="form-input" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gênero</label>
                    <select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option>Masculino</option>
                      <option>Feminino</option>
                      <option>Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Objetivo</label>
                    <select className="form-select" value={form.objective} onChange={e => setForm({...form, objective: e.target.value})}>
                      <option>Hipertrofia</option>
                      <option>Emagrecimento</option>
                      <option>Condicionamento</option>
                      <option>Reabilitação</option>
                      <option>Saúde</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Altura (cm)</label>
                    <input type="number" className="form-input" placeholder="175" value={form.height} onChange={e => setForm({...form, height: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Peso (kg)</label>
                    <input type="number" className="form-input" placeholder="70" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dias/Semana</label>
                    <select className="form-select" value={form.daysPerWeek} onChange={e => setForm({...form, daysPerWeek: parseInt(e.target.value)})}>
                      {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d}x</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Turno de Treino</label>
                  <div className="tag-group">
                    {['Manhã', 'Tarde', 'Noite'].map(s => (
                      <button type="button" key={s} className={`tag ${form.shift === s ? 'active' : ''}`} onClick={() => setForm({...form, shift: s})}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observações Médicas</label>
                  <textarea className="form-textarea" placeholder="Lesões, restrições, medicamentos..." value={form.medicalNotes || ''} onChange={e => setForm({...form, medicalNotes: e.target.value})} style={{ minHeight: '70px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingStudent ? 'Salvar Alterações' : 'Cadastrar Aluno'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Workout Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Atribuir Treino</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Selecione um treino e dia da semana para <strong>{assigningStudent?.name}</strong>:
            </p>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Dia da Semana</label>
              <select className="form-select" value={assignDay} onChange={(e) => setAssignDay(e.target.value)}>
                <option value="Segunda">Segunda-feira</option>
                <option value="Terça">Terça-feira</option>
                <option value="Quarta">Quarta-feira</option>
                <option value="Quinta">Quinta-feira</option>
                <option value="Sexta">Sexta-feira</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>
            {workouts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                Nenhum treino criado ainda. Crie um treino primeiro!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {workouts.map(w => (
                  <button key={w.id} className="card" style={{ cursor: 'pointer', textAlign: 'left', padding: '14px 18px' }} onClick={() => handleAssign(w.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Dumbbell size={20} style={{ color: 'var(--primary)' }} />
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{w.name}</strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.exercises?.length || 0} exercícios</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .students-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        
        .student-card { display: flex; flex-direction: column; gap: 14px; }
        
        .student-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .student-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          color: white;
          flex-shrink: 0;
        }
        
        .student-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .student-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        
        .student-detail svg { color: var(--text-muted); flex-shrink: 0; }
        
        .student-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 768px) {
          .students-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
