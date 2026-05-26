import { useState, useRef } from 'react';
import { exportAllData, importData, saveStudent, fetchSupabaseRowByEmail, resolveStudentProfileFromCache } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';
import { stripSensitiveSessionFields } from '../lib/security';
import { useToast, useTheme, useAuth } from '../lib/app-context';
import { Settings as GearIcon, Download, Upload, Moon, Sun, Database, Shield, CreditCard, User } from 'lucide-react';

export default function Settings() {
  const { user, login: setUser } = useAuth();
  const addToast = useToast();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);
  
  const isStudent = user?.type === 'aluno';
  const studentData = isStudent ? resolveStudentProfileFromCache(user) : null;
  
  const [importing, setImporting] = useState(false);
  const [profile, setProfile] = useState({
    weight: studentData?.weight || '',
    height: studentData?.height || '',
    birthDate: studentData?.birthDate || ''
  });

  const handleExport = () => {
    try {
      exportAllData();
      addToast('Backup exportado com sucesso!', 'success');
    } catch { addToast('Erro ao exportar dados', 'error'); }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importData(reader.result);
        addToast('Dados importados com sucesso! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        addToast(err.message, 'error');
      }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearData = () => {
    if (!confirm('⚠️ Tem CERTEZA que deseja apagar TODOS os dados? Isso não pode ser desfeito!')) return;
    if (!confirm('Última chance! Todos os alunos, treinos e evolução serão perdidos.')) return;
    localStorage.clear();
    addToast('Dados limpos! Recarregando...', 'info');
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleSaveProfile = async () => {
    try {
      const updates = {
        weight: Number(profile.weight),
        height: Number(profile.height),
        birthDate: profile.birthDate,
        target_muscles: studentData?.target_muscles || []
      };

      // Validação
      if (updates.weight <= 0 || updates.height <= 0 || isNaN(updates.weight) || isNaN(updates.height)) {
        addToast('Peso e altura devem ser números válidos maiores que zero.', 'error');
        return;
      }

      // 1. Atualizar Supabase
      const cleanEmail = user?.email?.trim()?.toLowerCase();
      if (!cleanEmail) {
        addToast('Erro ao identificar e-mail do usuário.', 'error');
        return;
      }
      
      const studentRow = await fetchSupabaseRowByEmail('students', cleanEmail);
      const updateQuery = studentRow?.id
        ? supabase.from('students').update(updates).eq('id', studentRow.id)
        : supabase.from('students').update(updates).ilike('email', cleanEmail);

      const { error } = await updateQuery;
        
      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('target_muscles')) {
          if (import.meta.env.DEV) console.warn('[PowerFit] Coluna target_muscles não existe. Fazendo fallback de salvamento híbrido.');
          const fallbackUpdates = {
             weight: updates.weight,
             height: updates.height,
             birthDate: updates.birthDate
          };
          const fallbackQuery = studentRow?.id
             ? supabase.from('students').update(fallbackUpdates).eq('id', studentRow.id)
             : supabase.from('students').update(fallbackUpdates).ilike('email', cleanEmail);
          const fallbackRes = await fallbackQuery;
             
          if (fallbackRes.error) {
             addToast('Erro ao salvar fallback no banco (Supabase).', 'error');
             if (import.meta.env.DEV) console.error(fallbackRes.error);
             return;
          }
          // target_muscles será salvo apenas localmente abaixo
        } else {
          addToast('Erro ao salvar no banco (Supabase).', 'error');
          if (import.meta.env.DEV) console.error(error);
          return;
        }
      }

      // 2. Atualizar estado local para imediaticidade na UI
      const updatedUser = stripSensitiveSessionFields({ ...user, ...updates });
      localStorage.setItem('powerfit_current_user', JSON.stringify(updatedUser));

      if (studentData && (studentData.id || studentData.studentId)) {
        saveStudent({ ...studentData, ...updates });
      }

      if (setUser) {
        setUser(updatedUser);
      }
      
      addToast('Perfil atualizado com sucesso no App e nuvem!', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      addToast(e.message || 'Erro de conexão.', 'error');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><GearIcon size={24} style={{ color: 'var(--primary)' }} /> Configurações</h2>
      </div>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
        
        {/* Profile (Only for Students) */}
        {isStudent && (
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <User size={22} style={{ color: 'var(--primary)' }} />
              <div>
                <h4 style={{ fontSize: '1rem' }}>Meu Perfil</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mantenha suas medidas atualizadas</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Peso (kg)</label>
                <input type="number" step="0.1" className="form-input" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Altura (cm)</label>
                <input type="number" className="form-input" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nascimento</label>
                <input type="date" className="form-input" value={profile.birthDate} onChange={e => setProfile({...profile, birthDate: e.target.value})} />
              </div>
            </div>
            
            <button className="btn btn-primary" onClick={handleSaveProfile}>
              Salvar Perfil
            </button>
          </div>
        )}

        {/* Payment Integration Placeholder (Only for Personal) */}
        {!isStudent && (
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CreditCard size={22} style={{ color: 'var(--primary)' }} />
              <div>
                <h4 style={{ fontSize: '1rem' }}>Integração de Pagamentos (Em Breve)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>A cobrança integrada será ativada em uma próxima versão.</p>
              </div>
            </div>
            <div style={{ padding: '14px', borderRadius: '8px', border: '1px dashed var(--border-hover)', background: 'rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Pagamentos por Pix, cartão e assinaturas ficarão concentrados aqui quando a integração estiver pronta.
              </p>
            </div>
          </div>
        )}

        {/* Theme */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            {theme === 'dark' ? <Moon size={22} style={{ color: 'var(--primary)' }} /> : <Sun size={22} style={{ color: 'var(--primary)' }} />}
            <div>
              <h4 style={{ fontSize: '1rem' }}>Aparência</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Escolha entre modo claro e escuro</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}`} onClick={() => theme !== 'dark' && toggleTheme()}>
              <Moon size={16} /> Escuro
            </button>
            <button className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-outline'}`} onClick={() => theme !== 'light' && toggleTheme()}>
              <Sun size={16} /> Claro
            </button>
          </div>
        </div>

        {/* Export / Import */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Database size={22} style={{ color: 'var(--primary)' }} />
            <div>
              <h4 style={{ fontSize: '1rem' }}>Backup de Dados</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Exporte ou importe seus dados em formato JSON</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} /> Exportar Backup
            </button>
            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload size={16} /> {importing ? 'Importando...' : 'Importar Backup'}
            </button>
            <input type="file" ref={fileInputRef} accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ padding: '24px', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Shield size={22} style={{ color: 'var(--danger)' }} />
            <div>
              <h4 style={{ fontSize: '1rem', color: 'var(--danger)' }}>Zona de Perigo</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ações irreversíveis</p>
            </div>
          </div>
          <button className="btn" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }} onClick={handleClearData}>
            Apagar Todos os Dados
          </button>
        </div>
      </div>
    </div>
  );
}
