import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useTheme, useToast } from '../lib/app-context';
import { LayoutDashboard, Users, Dumbbell, TrendingUp, LogOut, X, Zap, CalendarDays, Camera, Settings, Moon, Sun, History, Target, Crown, Lock, DownloadCloud } from 'lucide-react';
import { isStudentPremium, resolveStudentProfileFromCache } from '../lib/storage';

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isStudent = user?.type === 'aluno';
  const isMaster = user?.type === 'master';
  const addToast = useToast();

  const personalNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/students', label: 'Alunos', icon: Users },
    { path: '/workouts', label: 'Treinos', icon: Dumbbell },
    { path: '/evolution', label: 'Evolução', icon: TrendingUp },
    { path: '/schedule', label: 'Agenda', icon: CalendarDays },
    { path: '/photos', label: 'Fotos', icon: Camera },
    { path: '/meu-plano', label: 'Meu Plano', icon: Crown },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const masterNavItems = [
    { path: '/master', label: 'Painel Master', icon: TrendingUp },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const resolvedUser = isStudent ? resolveStudentProfileFromCache(user) : user;
  const isVip = isStudentPremium(resolvedUser);

  const studentNavItems = [
    { path: '/aluno', label: 'Meu Painel', icon: LayoutDashboard },
    { path: '/workouts', label: 'Meus Treinos', icon: Dumbbell },
    { path: '/evolution', label: 'Minha Evolucao', icon: TrendingUp },
    { path: '/photos', label: 'Minhas Fotos', icon: Camera },
    { path: '/ai-chat', label: 'Treinador IA', icon: Zap, restricted: !isVip },
    { path: '/body-targets', label: 'Alvos Corporais', icon: Target, restricted: !isVip },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const navItems = isMaster ? masterNavItems : isStudent ? studentNavItems : personalNavItems;

  const handleLogout = () => { logout(); navigate('/'); };

  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon"><Zap size={20} /></div>
            <span className="logo-text">PowerFit</span>
          </div>
          <button className="sidebar-close" onClick={onClose}><X size={20} /></button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            if (item.restricted) {
              return (
                <div key={item.label} className="sidebar-link disabled" title="Apenas para usuários VIP" onClick={() => { navigate('/upgrade'); addToast('🔒 Recurso VIP', 'error'); onClose(); }} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  <Lock size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                </div>
              );
            }
            return (
              <NavLink key={item.path || item.label} to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}>
                <item.icon size={20} /><span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{resolvedUser?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{resolvedUser?.name || 'Usuário'}</p>
              <p className="sidebar-user-role">{isMaster ? 'Administrador Master' : isStudent ? 'Aluno' : 'Personal Trainer'}</p>
            </div>
          </div>

          {installPrompt && (
            <button
              className="btn btn-primary"
              onClick={handleInstallClick}
              style={{ width: '100%', justifyContent: 'center', gap: '8px', marginBottom: '8px', padding: '12px', background: 'var(--gradient-primary)' }}
            >
              <DownloadCloud size={18} /> Instalar App
            </button>
          )}

          <button className="btn btn-ghost sidebar-theme-toggle" onClick={toggleTheme} style={{ width: '100%', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button className="btn btn-ghost sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} /><span>Sair</span>
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); z-index: 998; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: rgba(var(--bg-secondary-rgb, 20,20,28), 0.85); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 999; transition: transform 0.3s ease; }
        .sidebar-header { padding: 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
        .sidebar-logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { width: 36px; height: 36px; border-radius: var(--radius-md); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; }
        .logo-text { font-size: 1.2rem; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .sidebar-close { display: none; background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; }
        .sidebar-nav { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-radius: var(--radius-md); color: var(--text-secondary); font-size: 0.88rem; font-weight: 500; transition: all var(--transition-fast); }
        .sidebar-link:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
        .sidebar-link.active { background: var(--gradient-primary); color: white; box-shadow: var(--shadow-glow-orange); }
        .sidebar-link.disabled { opacity: 0.5; }
        .sidebar-link.disabled:hover { background: rgba(34, 211, 238, 0.08); }
        .sidebar-footer { padding: 12px 16px; border-top: 1px solid var(--border); }
        .sidebar-user { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .sidebar-avatar { width: 38px; height: 38px; border-radius: var(--radius-full); background: var(--gradient-secondary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; color: white; flex-shrink: 0; }
        .sidebar-user-name { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
        .sidebar-user-role { font-size: 0.72rem; color: var(--text-muted); }
        .sidebar-logout { width: 100%; justify-content: center; gap: 8px; font-size: 0.82rem; color: var(--text-secondary) !important; }
        .sidebar-logout:hover { color: var(--danger) !important; background: rgba(239,68,68,0.1) !important; }
        .sidebar-theme-toggle { font-size: 0.82rem; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar-open { transform: translateX(0); }
          .sidebar-close { display: block; }
          .sidebar-overlay { display: block; }
        }
      `}</style>
    </>
  );
}
