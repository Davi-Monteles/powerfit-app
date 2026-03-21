import { useState, useRef } from 'react';
import { exportAllData, importData } from '../lib/storage';
import { useToast, useTheme } from '../App';
import { Settings as GearIcon, Download, Upload, Moon, Sun, Database, Shield } from 'lucide-react';

export default function Settings() {
  const addToast = useToast();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

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

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h2><GearIcon size={24} style={{ color: 'var(--primary)' }} /> Configurações</h2>
      </div>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
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
