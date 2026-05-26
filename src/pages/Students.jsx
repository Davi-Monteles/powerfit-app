import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, saveStudent, deleteStudent, getWorkouts, assignWorkoutToStudent, canAddStudent, saveNotification, forceSyncData, hasActiveWorkoutsForStudent } from '../lib/storage';
import { useStorageSync } from '../lib/useStorageSync';
import { useToast, useAuth } from '../lib/app-context';
import { Users, Plus, Search, Edit2, Trash2, X, Dumbbell, Phone, Mail, Calendar, Target, History, Bell } from 'lucide-react';

export default function Students() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [pendingAssignWorkoutId, setPendingAssignWorkoutId] = useState(null);
  const [assignDay, setAssignDay] = useState('Segunda');
  const addToast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  useStorageSync('students');

  const emptyForm = { name: '', email: '', phone: '', birthDate: '', gender: 'Masculino', height: '', weight: '', objective: 'Hipertrofia', daysPerWeek: 3, shift: 'Manhã', address: '', medicalNotes: '' };
  const [form, setForm] = useState(emptyForm);

  const students = getStudents();
  const workouts = getWorkouts();

  useEffect(() => {
    forceSyncData().catch(() => {});
  }, [user]);

  const filtered = students.filter(s => (s.name || '').toLowerCase().includes((search || '').toLowerCase()) || (s.email || '').toLowerCase().includes((search || '').toLowerCase()));
  const officialWorkoutIds = new Set(workouts.map(w => w.id));
  const getOfficialWorkoutCount = (student) => {
    const activeSchedule = Array.isArray(student.workoutSchedule)
      ? student.workoutSchedule.filter(schedule => schedule?.status !== 'archived')
      : [];

    if (activeSchedule.length > 0) {
      return activeSchedule.filter(schedule => officialWorkoutIds.has(schedule.workoutId || schedule.workout_id)).length;
    }

    return Array.isArray(student.workoutIds)
      ? student.workoutIds.filter(id => officialWorkoutIds.has(id)).length
      : 0;
  };

  const openNew = () => { 
    if (!canAddStudent()) {
      addToast('Limite de alunos do seu plano atingido. Faça upgrade em "Meu Plano".', 'error');
      return;
    }
    setForm(emptyForm); 
    setEditingStudent(null); 
    setShowModal(true); 
  };
  const openEdit = (student) => { setForm(student); setEditingStudent(student); setShowModal(true); };
  
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { addToast('Nome é obrigatório', 'error'); return; }
    
    try {
      const payload = { ...form, personalId: user?.id || form.personalId };
      await saveStudent(payload);
      
      setShowModal(false);
      addToast(editingStudent ? 'Aluno atualizado!' : 'Aluno cadastrado!', 'success');
    } catch (err) {
      addToast(err.message || "Erro ao salvar aluno.", 'error');
      console.error("🔥 UI SAVE ERROR:", err);
    }
  };

  const handleDelete = (id) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    deleteStudent(id);
    addToast('Aluno excluído', 'info');
  };

  const openAssign = (student) => {
    setAssigningStudent(student);
    setPendingAssignWorkoutId(null);
    setShowAssignModal(true);
  };
  
  const handleAssign = async (workoutId, archiveActive = false) => {
    await assignWorkoutToStudent(workoutId, assigningStudent.id, assignDay, false, { archiveActive });
    setShowAssignModal(false);
    setPendingAssignWorkoutId(null);
    addToast(`Treino atribuído para ${assignDay}!`, 'success');
  };

  const chooseWorkoutToAssign = (workoutId) => {
    if (hasActiveWorkoutsForStudent(assigningStudent)) {
      setPendingAssignWorkoutId(workoutId);
      return;
    }

    handleAssign(workoutId);
  };

  const handleWhatsAppChat = (phone) => {
    if (!phone) return addToast('Aluno sem telefone cadastrado', 'error');
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}`, '_blank');
  };

  const sendReminder = (student) => {
    const message = "Você tem um novo lembrete de treino do seu Personal! Bora pra cima! 💪";
    saveNotification(student.id || student.studentId, message);
    addToast("Lembrete interno enviado com sucesso!", "success");
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
                  <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {student.name}
                    {student.isPremium && <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>⭐ PRO</span>}
                  </h4>
                  <span className="badge badge-primary">{student.objective || 'Sem objetivo'}</span>
                </div>
              </div>
              <div className="student-details">
                {student.email && <div className="student-detail"><Mail size={14} /> {student.email}</div>}
                {student.phone && <div className="student-detail"><Phone size={14} /> {student.phone}</div>}
                {student.birthDate && <div className="student-detail"><Calendar size={14} /> {new Date(student.birthDate).toLocaleDateString('pt-BR')}</div>}
                {student.objective && <div className="student-detail"><Target size={14} /> {student.objective}</div>}
                <div className="student-detail"><Dumbbell size={14} /> {getOfficialWorkoutCount(student)} treino(s)</div>
              </div>
              <div className="student-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openAssign(student)}><Dumbbell size={14} /> Atribuir Treino</button>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/history/${student.id}`)}><History size={14} /> Histórico</button>
                <div style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-icon" onClick={() => sendReminder(student)} title="Enviar Lembrete" style={{ color: '#06b6d4' }}><Bell size={16} /></button>
                <button className="btn btn-ghost btn-icon" onClick={() => handleWhatsAppChat(student.phone)} title="Falar no WhatsApp" style={{ color: '#25D366' }}><Phone size={16} /></button>
                <button className="btn btn-ghost btn-icon" onClick={() => openEdit(student)} title="Editar"><Edit2 size={16} /></button>
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(student.id)} title="Excluir" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
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
                    <input type="email" className="form-input" placeholder="alunovip@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      💡 Se o aluno já tiver conta, o sistema irá vincular automaticamente.
                    </p>
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
        <div className="modal-overlay" onClick={() => { setShowAssignModal(false); setPendingAssignWorkoutId(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Atribuir Treino</h3>
              <button className="modal-close" onClick={() => { setShowAssignModal(false); setPendingAssignWorkoutId(null); }}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Selecione um treino e dia da semana para <strong>{assigningStudent?.name}</strong>:
            </p>
            {pendingAssignWorkoutId && (
              <div className="card" style={{ padding: '14px', marginBottom: '16px', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.08)' }}>
                <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '6px' }}>Este aluno já possui treinos ativos.</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '12px' }}>
                  Escolha se deseja substituir os treinos anteriores ou manter tudo ativo.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleAssign(pendingAssignWorkoutId, true)}>Substituir treinos anteriores</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleAssign(pendingAssignWorkoutId, false)}>Adicionar aos treinos existentes</button>
                </div>
              </div>
            )}
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
                  <button key={w.id} className="card" style={{ cursor: 'pointer', textAlign: 'left', padding: '14px 18px' }} onClick={() => chooseWorkoutToAssign(w.id)}>
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
          grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
          gap: 16px;
        }
        
        .student-card { display: flex; flex-direction: column; gap: 14px; min-width: 0; max-width: 100%; }
        
        .student-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .student-card-header > div:last-child {
          min-width: 0;
        }

        .student-card-header h4 {
          flex-wrap: wrap;
          overflow-wrap: anywhere;
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
          min-width: 0;
        }
        
        .student-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          min-width: 0;
          overflow-wrap: anywhere;
        }
        
        .student-detail svg { color: var(--text-muted); flex-shrink: 0; }
        
        .student-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          min-width: 0;
          max-width: 100%;
        }

        .student-actions .btn-sm {
          min-width: 0;
        }

        @media (max-width: 768px) {
          .students-grid { grid-template-columns: minmax(0, 1fr); }
          .student-actions .btn-sm { flex: 1 1 140px; white-space: normal; }
          .student-actions .btn-icon { flex: 0 0 36px; }
          .student-actions > div { display: none; }
        }
      `}</style>
    </div>
  );
}
