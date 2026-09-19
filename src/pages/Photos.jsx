import { useState, useEffect } from 'react';
import { getStudents, getPhotosByStudent, savePhoto, deletePhoto, forceSyncData, resolveStudentProfileFromCache } from '../lib/storage';
import { useStorageSync } from '../lib/useStorageSync';
import { useAuth, useToast } from '../lib/app-context';
import { Camera, Plus, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Photos() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIdxs, setCompareIdxs] = useState([0, -1]);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, label: '' });
  const { user } = useAuth();
  const addToast = useToast();
  useStorageSync();
  const isStudentView = user?.type === 'aluno';
  const studentProfile = isStudentView ? (resolveStudentProfileFromCache(user) || user) : null;
  const students = isStudentView ? (studentProfile ? [studentProfile] : []) : getStudents();
  const selectedStudentId = isStudentView
    ? studentProfile?.id || studentProfile?.studentId || studentProfile?.student_id || ''
    : students.some(student => student.id === selectedStudent) ? selectedStudent : students[0]?.id || '';
  const currentStudent = isStudentView ? studentProfile : students.find(s => s.id === selectedStudentId);
  const currentStudentId = currentStudent?.id || currentStudent?.studentId || currentStudent?.student_id || '';

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ date: today, label: '', image: '' });

  useEffect(() => {
    forceSyncData().catch(() => {});
  }, [isStudentView, user?.id, user?.email]);

  const photos = selectedStudentId ? getPhotosByStudent(selectedStudentId, currentStudent?.email) : [];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { addToast('Imagem muito grande (máx 2MB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const studentId = selectedStudentId || currentStudentId;
    if (!studentId) { addToast('Aluno nao encontrado', 'error'); return; }
    if (!form.image) { addToast('Selecione uma foto', 'error'); return; }
    await savePhoto({ ...form, studentId, studentEmail: currentStudent?.email, personalId: currentStudent?.personalId || currentStudent?.personal_id });
    setShowModal(false);
    setForm({ date: today, label: '', image: '' });
    addToast('Foto salva!', 'success');
  };

  const handleDeletePhoto = (id, label) => {
    setConfirmDelete({ open: true, id, label: label || 'esta foto' });
  };

  const confirmDeletePhoto = async () => {
    const { id } = confirmDelete;
    if (!id) return;
    await deletePhoto(id);
    setConfirmDelete({ open: false, id: null, label: '' });
    addToast('Foto removida', 'info');
  };

  const lastIdx = photos.length - 1;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><Camera size={24} style={{ color: 'var(--primary)' }} /> {isStudentView ? 'Minhas Fotos' : 'Fotos Antes/Depois'}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!isStudentView && (
            <select className="form-select" style={{ maxWidth: '200px' }} value={selectedStudentId} onChange={e => { setSelectedStudent(e.target.value); setCompareMode(false); }}>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={!selectedStudentId && !currentStudentId}><Plus size={18} /> Nova Foto</button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">
          <Camera size={64} />
          <h3>Nenhuma foto registrada</h3>
          <p>{isStudentView ? 'Envie fotos para acompanhar sua evolucao visual.' : 'Adicione fotos para acompanhar a evolução visual do aluno'}</p>
        </div>
      ) : (
        <>
          {/* Compare Mode */}
          {photos.length >= 2 && (
            <div style={{ marginBottom: '20px' }}>
              <button className={`btn ${compareMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setCompareMode(!compareMode); setCompareIdxs([0, lastIdx]); }}>
                {compareMode ? '✕ Fechar Comparação' : '🔄 Comparar Antes/Depois'}
              </button>
            </div>
          )}
          {compareMode && photos.length >= 2 && (
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', textAlign: 'center' }}>Comparação de Evolução</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {[0, 1].map(side => {
                  const idx = compareIdxs[side];
                  const photo = photos[idx];
                  return (
                    <div key={side} style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => { const arr = [...compareIdxs]; arr[side] = Math.max(0, arr[side]-1); setCompareIdxs(arr); }} disabled={idx <= 0}><ChevronLeft size={16} /></button>
                        <span className={`badge ${side === 0 ? 'badge-warning' : 'badge-success'}`}>{side === 0 ? 'ANTES' : 'DEPOIS'}</span>
                        <button className="btn btn-ghost btn-icon" onClick={() => { const arr = [...compareIdxs]; arr[side] = Math.min(lastIdx, arr[side]+1); setCompareIdxs(arr); }} disabled={idx >= lastIdx}><ChevronRight size={16} /></button>
                      </div>
                      {photo && (
                        <>
                          <img src={photo.image} alt={photo.label || 'Foto'} style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            {new Date(photo.date).toLocaleDateString('pt-BR')} {photo.label && `• ${photo.label}`}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photo Grid */}
          <div className="photos-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="card photo-card">
                <img src={photo.image} alt={photo.label || 'Foto'} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>{photo.label || 'Sem descrição'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(photo.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <button className="btn btn-ghost btn-icon" onClick={() => handleDeletePhoto(photo.id, photo.label)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header"><h3>📸 Nova Foto</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Foto *</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="form-input" style={{ padding: '8px' }} />
                {form.image && <img src={form.image} alt="Preview" style={{ marginTop: '8px', width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label className="form-label">Data</label><input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Descrição</label><input className="form-input" placeholder="Ex: Frente" value={form.label} onChange={e => setForm({...form, label: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Foto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null, label: '' })}
        onConfirm={confirmDeletePhoto}
        title="Excluir foto"
        message={`Tem certeza que deseja excluir ${confirmDelete.label}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <style>{`
        .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .photo-card { padding: 12px; }
        @media (max-width: 768px) { .photos-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); } }
      `}</style>
    </div>
  );
}
