import { useState, useEffect } from 'react';
import { getWorkouts, saveWorkout, deleteWorkout, getStudents, sendWorkoutViaWhatsApp, forceSyncData, isStudentAIWorkout, fetchWorkoutsForStudent } from '../lib/storage';
import { useStorageSync } from '../lib/useStorageSync';
import { generateWorkoutPDF } from '../lib/pdf';
import { useAuth, useToast } from '../lib/app-context';
import { Dumbbell, Plus, Search, Edit2, Trash2, X, Send, GripVertical, MessageCircle, FileDown } from 'lucide-react';
import ExerciseMedia from '../components/ExerciseMedia';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { getWorkoutCompletion, markWorkoutCompleted, markWorkoutPending } from '../lib/workout-completions';
import { getExerciseProgress, getAllProgressForWorkout, saveProgress, toggleExercise, isWorkoutFullyCompleted } from '../lib/exercise-progress';
import { canStudentDeleteAIWorkout, getWorkoutExerciseImageUrls, normalizeWorkoutExerciseMediaFields, validateWorkoutExerciseMediaUrls } from '../lib/workout-exercise-media';

function isBrowserOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function cacheExerciseImagesForOffline(imageUrls) {
  if (!imageUrls.length || typeof navigator === 'undefined' || isBrowserOffline() || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready
    .then(registration => {
      registration.active?.postMessage({ type: 'CACHE_EXERCISE_IMAGES', urls: imageUrls });
    })
    .catch(() => undefined);
}

function ExerciseCustomMedia({ exercise, isOffline }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = String(exercise?.imageUrl || '').trim();
  const videoUrl = String(exercise?.videoUrl || '').trim();
  const videoLabel = isOffline ? 'Ver vídeo disponível com internet' : 'Ver vídeo';

  if (!imageUrl && !videoUrl) return null;

  return (
    <div className="exercise-custom-media">
      {imageUrl && (imageFailed ? (
        <span className="exercise-image-fallback">Imagem indisponivel</span>
      ) : (
        <img
          className="exercise-custom-image"
          src={imageUrl}
          alt={`Imagem de ${exercise?.name || 'exercicio'}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ))}
      {videoUrl && (
        <a
          className={`exercise-video-link${isOffline ? ' exercise-video-link-offline' : ''}`}
          href={videoUrl}
          target="_blank"
          rel="noreferrer"
          aria-disabled={isOffline ? 'true' : undefined}
          aria-label={videoLabel}
          onClick={isOffline ? event => event.preventDefault() : undefined}
        >
          {isOffline ? 'Ver video (com internet)' : 'Ver video'}
        </a>
      )}
    </div>
  );
}

export default function Workouts() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: '', source: null });
  const [pdfAlert, setPdfAlert] = useState({ open: false, message: '' });
  const { user } = useAuth();
  const addToast = useToast();
  useStorageSync('workouts');
  const { refresh: refreshCompletions } = useStorageSync('workout-completions');
  const { refresh: refreshProgress } = useStorageSync('exercise-progress');
  const isStudentView = user?.type === 'aluno';
  const [freshStudentWorkouts, setFreshStudentWorkouts] = useState(null);
  const [isOffline, setIsOffline] = useState(isBrowserOffline);

  const emptyExercise = { name: '', sets: 3, reps: 12, weight: '', rest: 60, notes: '', videoUrl: '', imageUrl: '' };
  const emptyForm = { name: '', description: '', category: 'Musculação', exercises: [{ ...emptyExercise }] };
  const [form, setForm] = useState(emptyForm);

  const allWorkouts = getWorkouts();
  const cachedWorkouts = user?.type === 'personal'
    ? allWorkouts.filter(workout => !isStudentAIWorkout(workout))
    : allWorkouts;
  const students = getStudents();
  const workouts = isStudentView && freshStudentWorkouts ? freshStudentWorkouts : cachedWorkouts;

  useEffect(() => {
    let active = true;
    const loadFreshData = async () => {
      try {
        if (user?.type === 'aluno') {
          const studentId = user.studentId || user.student_id || user.id;
          const freshWorkouts = await fetchWorkoutsForStudent(studentId, user.personalId || user.personal_id, user.email);
          if (active) {
            setFreshStudentWorkouts(freshWorkouts);
          }
          return;
        }

        await forceSyncData();
      } catch (error) {
        if (import.meta.env.DEV) console.warn('[Workouts] Student workouts sync warning:', error);
        if (active) setFreshStudentWorkouts(null);
      }
    };

    loadFreshData();
    return () => { active = false; };
  }, [user?.id, user?.type, user?.studentId, user?.student_id, user?.personalId, user?.personal_id, user?.email]);

  const filtered = workouts.filter(w => (w.name || '').toLowerCase().includes(search.toLowerCase()));
  const activeFiltered = isStudentView ? filtered.filter(w => w.status !== 'archived') : filtered;
  const archivedFiltered = isStudentView ? filtered.filter(w => w.status === 'archived') : [];
  const exerciseImageCacheKey = getWorkoutExerciseImageUrls(activeFiltered).join('\n');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOffline || !exerciseImageCacheKey) return;
    cacheExerciseImagesForOffline(exerciseImageCacheKey.split('\n'));
  }, [exerciseImageCacheKey, isOffline]);

  const openNew = () => {
    if (isStudentView) return;
    setForm(emptyForm);
    setEditingWorkout(null);
    setShowModal(true);
  };
  const openEdit = (workout) => {
    if (isStudentView) return;
    setForm({ ...workout });
    setEditingWorkout(workout);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isStudentView) return;
    if (!form.name) { addToast('Nome do treino é obrigatório', 'error'); return; }
    if (form.exercises.some(ex => !ex.name)) { addToast('Preencha o nome de todos os exercícios', 'error'); return; }
    const exercises = form.exercises.map(normalizeWorkoutExerciseMediaFields);
    const mediaValidation = validateWorkoutExerciseMediaUrls(exercises);
    if (!mediaValidation.valid) { addToast(mediaValidation.message, 'error'); return; }
    await saveWorkout({ ...form, exercises });
    await forceSyncData();
    setShowModal(false);
    addToast(editingWorkout ? 'Treino atualizado!' : 'Treino criado!', 'success');
  };

  const handleDelete = (workoutOrId) => {
    const workout = typeof workoutOrId === 'object' ? workoutOrId : workouts.find(item => item.id === workoutOrId);

    if (user?.type === 'aluno' && !canStudentDeleteAIWorkout(workout)) {
      addToast('Alunos nao podem excluir treinos compartilhados.', 'error');
      return;
    }

    const id = workout?.id || workoutOrId;

    setConfirmDelete({ open: true, id, name: workout?.name || 'este treino', source: workout?.source || null });
  };

  const confirmDeleteWorkout = async () => {
    const { id, source } = confirmDelete;
    if (!id) return;

    if (isStudentView) {
      const workout = workouts.find(item => item.id === id) || { source };
      if (!canStudentDeleteAIWorkout(workout)) {
        setConfirmDelete({ open: false, id: null, name: '', source: null });
        addToast('Alunos nao podem excluir treinos compartilhados.', 'error');
        return;
      }
    }

    await deleteWorkout(id);
    setConfirmDelete({ open: false, id: null, name: '', source: null });
    if (isStudentView) setFreshStudentWorkouts(previous => previous?.filter(workout => workout.id !== id) || previous);
    if (!isStudentView) await forceSyncData();
    addToast('Treino excluido', 'info');
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

  const handleTogglePublishedWorkout = (workout) => {
    if (!isStudentView || workout?.source !== 'rascunho_anamnese') return;
    const completion = getWorkoutCompletion(user, workout.id);
    if (completion?.status === 'completed') {
      markWorkoutPending(user, workout);
      addToast('Treino marcado como pendente.', 'info');
    } else {
      markWorkoutCompleted(user, workout);
      addToast('Treino marcado como concluido.', 'success');
    }
    refreshCompletions();
  };

  const handleToggleExercise = (workout, exerciseIndex) => {
    if (!isStudentView) return;
    toggleExercise(user, workout, exerciseIndex);
    refreshProgress();

    const allDone = isWorkoutFullyCompleted(user, workout);
    const completion = getWorkoutCompletion(user, workout.id);
    const wasCompleted = workout.status === 'completed' || completion?.status === 'completed';

    if (allDone && !wasCompleted) {
      markWorkoutCompleted(user, workout);
      refreshCompletions();
      addToast('Treino concluído!', 'success');
    } else if (!allDone && wasCompleted) {
      markWorkoutPending(user, workout);
      refreshCompletions();
    }
  };

  const handleExerciseWeightChange = (workout, exerciseIndex, value) => {
    if (!isStudentView) return;
    saveProgress(user, workout, exerciseIndex, { actualWeight: value });
    refreshProgress();
  };

  const renderPDFButton = (workout) => (
    <button className="btn btn-secondary btn-sm" onClick={() => {
      try {
        generateWorkoutPDF(workout);
        addToast('PDF gerado!', 'success');
      } catch (err) {
        console.warn('PDF Error, fallback to alert', err);
        setPdfAlert({ open: true, message: 'Relatório gerado (modo demo offline)' });
      }
    }}>
      <FileDown size={14} /> PDF
    </button>
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><Dumbbell size={24} style={{ color: 'var(--primary)' }} /> {isStudentView ? 'Meus Treinos' : 'Treinos'}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search />
            <input className="form-input" placeholder="Buscar treino..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {!isStudentView && <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Novo Treino</button>}
        </div>
      </div>

      {activeFiltered.length === 0 ? (
        <div className="empty-state">
          <Dumbbell size={64} />
          <h3>Nenhum treino encontrado</h3>
          <p>{search ? 'Tente outro termo de busca' : isStudentView ? (archivedFiltered.length > 0 ? 'Você não possui treinos ativos no momento.' : 'Seu personal ainda não atribuiu treinos para você.') : 'Clique em "Novo Treino" para criar'}</p>
          {!search && !isStudentView && <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Criar Treino</button>}
        </div>
      ) : (
        <div className="workouts-grid">
          {activeFiltered.map(workout => {
            const completion = isStudentView ? getWorkoutCompletion(user, workout.id) : null;
            const isCompleted = workout.status === 'completed' || completion?.status === 'completed';
            const workoutProgressAll = !isStudentView ? getAllProgressForWorkout(workout.id) : [];
            const canDeleteStudentAI = isStudentView && canStudentDeleteAIWorkout(workout);
            return (
            <div key={workout.scheduleId || workout.id} className="card card-glow workout-card">
              <div className="workout-header">
                <div>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{workout.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{workout.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {workout.source === 'rascunho_anamnese' && <span className="badge badge-success">Publicado</span>}
                  {isStudentView && workout.source === 'rascunho_anamnese' && isCompleted && <span className="badge badge-primary">Concluído</span>}
                  <span className="badge badge-secondary">{workout.category}</span>
                </div>
              </div>

              <div className="workout-exercises">
                {workout.exercises?.map((ex, i) => {
                  const exProgress = isStudentView ? getExerciseProgress(user, workout.id, i) : null;
                  const personalRecord = !isStudentView
                    ? workoutProgressAll.find(p => p.exerciseIndex === i)
                    : null;
                  return (
                  <div key={i} className="workout-exercise">
                    <ExerciseMedia exercise={ex} />
                    <span className="exercise-number">{i + 1}</span>
                    <div className="exercise-info">
                      <strong>{ex.name}</strong>
                      <span>
                        {ex.sets}x{ex.reps}
                        {ex.weight ? ` • ${ex.weight}kg` : ''}
                        {ex.rest ? ` • ${ex.rest}s` : ''}
                      </span>
                      {!isStudentView && personalRecord?.actualWeight && (
                        <span className="exercise-recorded-weight">Carga registrada: {personalRecord.actualWeight}kg</span>
                      )}
                      <ExerciseCustomMedia exercise={ex} isOffline={isOffline} />
                    </div>
                    {isStudentView && (
                      <div className="exercise-progress-controls">
                        <input
                          type="number"
                          className="form-input exercise-weight-input"
                          placeholder="kg"
                          min="0"
                          step="0.5"
                          value={exProgress?.actualWeight || ''}
                          onChange={e => handleExerciseWeightChange(workout, i, e.target.value)}
                          aria-label={`Carga utilizada no exercício ${i + 1}`}
                        />
                        <input
                          type="checkbox"
                          className="exercise-checkbox"
                          checked={exProgress?.completed === true}
                          onChange={() => handleToggleExercise(workout, i)}
                          aria-label={`Marcar exercício ${i + 1} como concluído`}
                        />
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              <div className="workout-actions">
                {isStudentView && workout.source === 'rascunho_anamnese' && (
                  <button className={isCompleted ? "btn btn-success btn-sm" : "btn btn-outline btn-sm"} onClick={() => handleTogglePublishedWorkout(workout)}>
                    {isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                  </button>
                )}
                {!isStudentView && (
                  <button className="btn btn-whatsapp btn-sm" onClick={() => openWhatsApp(workout)}>
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                )}
                {renderPDFButton(workout)}
                {!isStudentView && (
                  <>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(workout)} aria-label={`Editar treino ${workout.name || ''}`}><Edit2 size={16} /></button>
                  </>
                )}
                {!isStudentView && (
                  <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(workout)} style={{ color: 'var(--danger)' }} title="Excluir treino" aria-label={`Excluir treino ${workout.name || ''}`}>
                    <Trash2 size={16} />
                  </button>
                )}
                {canDeleteStudentAI && (
                  <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(workout)} style={{ color: 'var(--danger)' }} title="Excluir treino da IA" aria-label={`Excluir treino da IA ${workout.name || ''}`}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {archivedFiltered.length > 0 && (
        <>
          <h3 style={{ margin: '28px 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dumbbell size={20} style={{ color: 'var(--text-muted)' }} /> Arquivados
          </h3>
          <div className="workouts-grid archived-workouts-grid">
            {archivedFiltered.map(workout => (
              <div key={workout.scheduleId || workout.id} className="card workout-card archived-workout-card">
                <div className="workout-header">
                  <div>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{workout.name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{workout.description}</p>
                  </div>
                  <span className="badge badge-secondary">Arquivado</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  {workout.exercises?.length || 0} exercício(s)
                </p>
                <div className="workout-actions">
                  {renderPDFButton(workout)}
                  {!isStudentView && (
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(workout)} style={{ color: 'var(--danger)' }} title="Excluir treino" aria-label={`Excluir treino ${workout.name || ''}`}>
                      <Trash2 size={16} />
                    </button>
                  )}
                  {isStudentView && canStudentDeleteAIWorkout(workout) && (
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(workout)} style={{ color: 'var(--danger)' }} title="Excluir treino da IA" aria-label={`Excluir treino da IA ${workout.name || ''}`}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Workout Creation/Edit Modal */}
      {showModal && !isStudentView && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingWorkout ? 'Editar Treino' : 'Novo Treino'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Fechar modal"><X size={20} /></button>
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
                        <input className="form-input" placeholder="Link do vídeo no YouTube (opcional)" value={ex.videoUrl || ''} onChange={e => updateExercise(idx, 'videoUrl', e.target.value)} style={{ gridColumn: '1 / -1' }} />
                        <input className="form-input" placeholder="URL da imagem (opcional)" value={ex.imageUrl || ''} onChange={e => updateExercise(idx, 'imageUrl', e.target.value)} style={{ gridColumn: '1 / -1' }} />
                      </div>
                      <button type="button" className="exercise-form-delete" onClick={() => removeExercise(idx)} title="Remover" aria-label={`Remover exercício ${idx + 1}`}>
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
      {showWhatsAppModal && !isStudentView && (
        <div className="modal-overlay" onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>📱 Enviar via WhatsApp</h3>
              <button className="modal-close" onClick={() => setShowWhatsAppModal(false)} aria-label="Fechar envio por WhatsApp"><X size={20} /></button>
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

      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null, name: '', source: null })}
        onConfirm={confirmDeleteWorkout}
        title="Excluir treino"
        message={`Tem certeza que deseja excluir ${confirmDelete.name}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <Modal
        open={pdfAlert.open}
        onClose={() => setPdfAlert({ ...pdfAlert, open: false })}
        title="PDF"
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setPdfAlert({ ...pdfAlert, open: false })}>
            Entendi
          </button>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>{pdfAlert.message}</p>
      </Modal>

      <style>{`
        .workouts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 16px;
        }
        
        .workout-card { display: flex; flex-direction: column; gap: 14px; }
        .archived-workout-card { opacity: 0.72; }
        
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
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: var(--radius-sm);
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
        }

        .workout-exercise:hover {
          background: rgba(255,255,255,0.035);
          border-color: rgba(255,255,255,0.08);
        }

        .exercise-media {
          width: 166px;
          min-width: 166px;
          min-height: 58px;
          display: flex;
          align-items: stretch;
          gap: 8px;
          flex-shrink: 0;
        }

        .exercise-media-thumb {
          width: 58px;
          min-width: 58px;
          height: 58px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(255,107,53,0.16), rgba(6,182,212,0.08));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 24px rgba(0,0,0,0.12);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .exercise-media-thumb-future {
          background: linear-gradient(135deg, rgba(6,182,212,0.14), rgba(255,255,255,0.04));
        }

        .exercise-media-thumb-placeholder {
          background: linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,255,255,0.035));
        }

        .exercise-media-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .exercise-media-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          width: 100%;
          height: 100%;
          color: rgba(255,255,255,0.9);
        }

        .exercise-media-status {
          max-width: 50px;
          padding: 2px 5px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          background: rgba(0,0,0,0.22);
          font-size: 0.48rem;
          font-weight: 700;
          line-height: 1.05;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .exercise-media-meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          color: var(--text-muted);
        }

        .exercise-media-badges {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 3px;
        }

        .exercise-media-badge {
          max-width: 84px;
          padding: 2px 5px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.045);
          color: var(--text-muted);
          font-size: 0.56rem;
          font-weight: 700;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .exercise-media-badge-primary {
          border-color: rgba(255,107,53,0.28);
          background: rgba(255,107,53,0.1);
          color: var(--text-primary);
        }

        .exercise-media-badge-level {
          max-width: 72px;
          color: rgba(255,255,255,0.72);
        }

        .exercise-media-meta p {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 2px 0 0;
          font-size: 0.58rem;
          line-height: 1.2;
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
          flex: 1;
          min-width: 0;
        }
        
        .exercise-info strong { font-size: 0.85rem; }
        .exercise-info span { font-size: 0.75rem; color: var(--text-muted); }

        .exercise-custom-media {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 100%;
          margin-top: 8px;
        }

        .exercise-custom-image {
          display: block;
          width: min(180px, 100%);
          max-width: 100%;
          max-height: 120px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
        }

        .exercise-image-fallback,
        .exercise-video-link {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 5px 9px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 0.72rem;
          font-weight: 700;
        }

        .exercise-image-fallback {
          color: var(--text-muted);
          background: rgba(255,255,255,0.04);
        }

        .exercise-video-link {
          color: var(--primary);
          background: rgba(255,107,53,0.1);
          text-decoration: none;
        }

        .exercise-video-link-offline {
          color: var(--text-muted);
          background: rgba(255,255,255,0.06);
          cursor: not-allowed;
          opacity: 0.75;
        }

        .exercise-recorded-weight {
          display: inline-block;
          margin-top: 2px;
          padding: 1px 6px;
          border: 1px solid rgba(6,182,212,0.28);
          border-radius: 999px;
          background: rgba(6,182,212,0.1);
          color: var(--text-primary);
          font-size: 0.62rem;
          font-weight: 600;
        }

        .exercise-progress-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          margin-left: auto;
        }

        .exercise-weight-input {
          width: 64px;
          min-width: 64px;
          padding: 4px 6px;
          font-size: 0.75rem;
          text-align: center;
        }

        .exercise-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--primary, #ff6b35);
          flex-shrink: 0;
        }

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
          .workout-exercise { align-items: flex-start; flex-wrap: wrap; }
          .exercise-progress-controls { flex-wrap: wrap; margin-left: 0; width: 100%; justify-content: flex-end; }
          .exercise-media { width: 128px; min-width: 128px; }
          .exercise-media-badge { max-width: 66px; }
          .exercise-media-badge-level { display: none; }
          .exercise-media-meta p { display: none; }
          .exercise-form-row { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
