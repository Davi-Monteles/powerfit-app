import { useState, useRef, useEffect } from 'react';
import { exportAllData, importData, getMercadoPagoToken, saveMercadoPagoToken, getStudentById, saveStudent } from '../lib/storage';
import { useToast, useTheme, useAuth } from '../App';
import { Settings as GearIcon, Download, Upload, Moon, Sun, Database, Shield, CreditCard, User } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const addToast = useToast();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);
  
  const isStudent = user?.type === 'aluno';
  const studentData = isStudent && user?.studentId ? getStudentById(user.studentId) : null;
  
  const [importing, setImporting] = useState(false);
  const [mpToken, setMpToken] = useState('');
  const [profile, setProfile] = useState({
    weight: studentData?.weight || '',
    height: studentData?.height || '',
    birthDate: studentData?.birthDate || ''
  });

  useEffect(() => {
    if (!isStudent) {
      setMpToken(getMercadoPagoToken());
    }
  }, [isStudent]);

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

  const handleSaveMpToken = () => {
    saveMercadoPagoToken(mpToken);
    addToast('Token do Mercado Pago salvo com sucesso!', 'success');
  };

  const handleSaveProfile = () => {
    if (studentData) {
      saveStudent({
        ...studentData,
        weight: Number(profile.weight),
        height: Number(profile.height),
        birthDate: profile.birthDate
      });
      addToast('Perfil atualizado com sucesso!', 'success');
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

        {/* Mercado Pago Integration (Only for Personal) */}
        {!isStudent && (
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CreditCard size={22} style={{ color: 'var(--primary)' }} />
              <div>
                <h4 style={{ fontSize: '1rem' }}>Integração Financeira</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configurar pagamentos via Mercado Pago</p>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Access Token (Produção)</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="APP_USR-..." 
                value={mpToken} 
                onChange={e => setMpToken(e.target.value)} 
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Necessário para gerar links de pagamento reais para o Plano Premium.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleSaveMpToken}>Salvar Token</button>
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
