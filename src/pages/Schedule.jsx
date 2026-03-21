import { useState, useEffect } from 'react';
import { getStudents, getSchedule, getScheduleByDate, saveScheduleEvent, deleteScheduleEvent } from '../lib/storage';
import { useToast } from '../App';
import { CalendarDays, Plus, X, Trash2, Clock, ChevronLeft, ChevronRight, User } from 'lucide-react';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const EVENT_COLORS = { treino: '#FF6B35', avaliacao: '#3B82F6', consulta: '#22C55E', outro: '#8B5CF6' };

export default function Schedule() {
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const addToast = useToast();

  const emptyForm = { title: '', studentId: '', date: '', time: '08:00', type: 'treino', notes: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setStudents(getStudents());
    setSchedule(getSchedule());
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDateStr = (day) => `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const getEventsForDay = (day) => schedule.filter(s => s.date === getDateStr(day));

  const openNew = (dateStr) => {
    setForm({ ...emptyForm, date: dateStr || today });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) { addToast('Preencha título e data', 'error'); return; }
    saveScheduleEvent(form);
    setSchedule(getSchedule());
    setShowModal(false);
    addToast('Evento salvo!', 'success');
  };

  const handleDelete = (id) => {
    deleteScheduleEvent(id);
    setSchedule(getSchedule());
    addToast('Evento removido', 'info');
  };

  const selectedEvents = selectedDate ? schedule.filter(s => s.date === selectedDate) : [];

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><CalendarDays size={24} style={{ color: 'var(--primary)' }} /> Agenda</h2>
        <button className="btn btn-primary" onClick={() => openNew(null)}><Plus size={18} /> Novo Evento</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDate ? '1fr 320px' : '1fr', gap: '20px' }}>
        {/* Calendar Grid */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button className="btn btn-ghost btn-icon" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <h3 style={{ fontSize: '1.1rem' }}>{MONTHS[month]} {year}</h3>
            <button className="btn btn-ghost btn-icon" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>
          <div className="cal-grid">
            {WEEKDAYS.map(w => <div key={w} className="cal-weekday">{w}</div>)}
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`e${i}`} className="cal-day cal-empty" />;
              const dateStr = getDateStr(day);
              const events = getEventsForDay(day);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              return (
                <div key={day} className={`cal-day ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}>
                  <span className="cal-day-number">{day}</span>
                  <div className="cal-dots">
                    {events.slice(0, 3).map((ev, j) => (
                      <span key={j} className="cal-dot" style={{ background: EVENT_COLORS[ev.type] || EVENT_COLORS.outro }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail */}
        {selectedDate && (
          <div className="card animate-slide-up" style={{ padding: '20px', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedDate(null)}><X size={16} /></button>
            </div>
            {selectedEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Nenhum evento neste dia</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedEvents.map(ev => (
                  <div key={ev.id} style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${EVENT_COLORS[ev.type] || EVENT_COLORS.outro}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>{ev.title}</strong>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={12} /> {ev.time}</span>
                          {ev.studentId && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><User size={12} /> {students.find(s => s.id === ev.studentId)?.name || ''}</span>}
                        </div>
                        {ev.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{ev.notes}</p>}
                      </div>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(ev.id)} style={{ color: 'var(--danger)', flexShrink: 0 }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '12px' }} onClick={() => openNew(selectedDate)}>
              <Plus size={14} /> Adicionar Evento
            </button>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header"><h3>📅 Novo Evento</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSave}>
              <div className="form-group"><label className="form-label">Título *</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Treino A - João" required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label className="form-label">Data *</label><input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Horário</label><input type="time" className="form-input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label className="form-label">Tipo</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="treino">Treino</option><option value="avaliacao">Avaliação</option><option value="consulta">Consulta</option><option value="outro">Outro</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Aluno</label>
                  <select className="form-select" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})}>
                    <option value="">— Nenhum —</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Notas</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Observações..." style={{ minHeight: '60px' }} /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .cal-weekday { text-align: center; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); padding: 8px 0; text-transform: uppercase; }
        .cal-day { min-height: 70px; padding: 6px; border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition-fast); border: 1px solid transparent; display: flex; flex-direction: column; align-items: center; }
        .cal-day:hover { background: rgba(255,255,255,0.04); }
        .cal-empty { cursor: default; }
        .cal-empty:hover { background: transparent; }
        .cal-today { border-color: var(--primary); background: rgba(255,107,53,0.08); }
        .cal-selected { border-color: var(--accent); background: rgba(59,130,246,0.1); }
        .cal-day-number { font-size: 0.85rem; font-weight: 500; }
        .cal-today .cal-day-number { color: var(--primary); font-weight: 700; }
        .cal-dots { display: flex; gap: 3px; margin-top: 4px; }
        .cal-dot { width: 6px; height: 6px; border-radius: 50%; }
        @media (max-width: 768px) {
          .cal-day { min-height: 48px; }
          div[style*="gridTemplateColumns: selectedDate"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
