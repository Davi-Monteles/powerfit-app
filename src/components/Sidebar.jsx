import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../App';
import { LayoutDashboard, Users, Dumbbell, TrendingUp, LogOut, X, Zap, CalendarDays, Camera, Settings, Moon, Sun, History } from 'lucide-react';

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isStudent = user?.type === 'aluno';

  const personalNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/students', label: 'Alunos', icon: Users },
    { path: '/workouts', label: 'Treinos', icon: Dumbbell },
    { path: '/evolution', label: 'Evolução', icon: TrendingUp },
    { path: '/schedule', label: 'Agenda', icon: CalendarDays },
    { path: '/photos', label: 'Fotos', icon: Camera },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const studentNavItems = [
    { path: '/aluno', label: 'Meu Painel', icon: LayoutDashboard },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const navItems = isStudent ? studentNavItems : personalNavItems;

  const handleLogout = () => { logout(); navigate('/'); };

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
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}>
              <item.icon size={20} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-ghost sidebar-theme-toggle" onClick={toggleTheme} style={{ width: '100%', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user?.name || 'Usuário'}</p>
              <p className="sidebar-user-role">{isStudent ? 'Aluno' : 'Personal Trainer'}</p>
            </div>
          </div>
          <button className="btn btn-ghost sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} /><span>Sair</span>
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 998; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 999; transition: transform 0.3s ease; }
        .sidebar-header { padding: 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
        .sidebar-logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { width: 36px; height: 36px; border-radius: var(--radius-md); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; }
        .logo-text { font-size: 1.2rem; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .sidebar-close { display: none; background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; }
        .sidebar-nav { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-radius: var(--radius-md); color: var(--text-secondary); font-size: 0.88rem; font-weight: 500; transition: all var(--transition-fast); }
        .sidebar-link:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
        .sidebar-link.active { background: var(--gradient-primary); color: white; box-shadow: var(--shadow-glow-orange); }
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
