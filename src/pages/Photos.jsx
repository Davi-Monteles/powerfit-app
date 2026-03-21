import { useState, useEffect } from 'react';
import { getStudents, getPhotosByStudent, savePhoto, deletePhoto } from '../lib/storage';
import { useToast } from '../App';
import { Camera, Plus, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Photos() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [photos, setPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIdxs, setCompareIdxs] = useState([0, -1]);
  const addToast = useToast();

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ date: today, label: '', image: '' });

  useEffect(() => {
    const s = getStudents();
    setStudents(s);
    if (s.length > 0) setSelectedStudent(s[0].id);
  }, []);

  useEffect(() => {
    if (selectedStudent) setPhotos(getPhotosByStudent(selectedStudent));
  }, [selectedStudent]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { addToast('Imagem muito grande (máx 2MB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.image) { addToast('Selecione uma foto', 'error'); return; }
    savePhoto({ ...form, studentId: selectedStudent });
    setPhotos(getPhotosByStudent(selectedStudent));
    setShowModal(false);
    setForm({ date: today, label: '', image: '' });
    addToast('Foto salva!', 'success');
  };

  const handleDeletePhoto = (id) => {
    if (!confirm('Excluir esta foto?')) return;
    deletePhoto(id);
    setPhotos(getPhotosByStudent(selectedStudent));
    addToast('Foto removida', 'info');
  };

  const lastIdx = photos.length - 1;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><Camera size={24} style={{ color: 'var(--primary)' }} /> Fotos Antes/Depois</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ maxWidth: '200px' }} value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setCompareMode(false); }}>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={!selectedStudent}><Plus size={18} /> Nova Foto</button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">
          <Camera size={64} />
          <h3>Nenhuma foto registrada</h3>
          <p>Adicione fotos para acompanhar a evolução visual do aluno</p>
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
            {photos.map((photo, i) => (
              <div key={photo.id} className="card photo-card">
                <img src={photo.image} alt={photo.label || 'Foto'} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>{photo.label || 'Sem descrição'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(photo.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <button className="btn btn-ghost btn-icon" onClick={() => handleDeletePhoto(photo.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
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

      <style>{`
        .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .photo-card { padding: 12px; }
        @media (max-width: 768px) { .photos-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); } }
      `}</style>
    </div>
  );
}
