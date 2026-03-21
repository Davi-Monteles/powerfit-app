import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser, logout, seedDemoData, getTheme, setTheme as saveTheme } from './lib/storage';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Workouts from './pages/Workouts';
import Evolution from './pages/Evolution';
import Schedule from './pages/Schedule';
import Photos from './pages/Photos';
import StudentDashboard from './pages/StudentDashboard';
import BodyTargets from './pages/BodyTargets';
import Settings from './pages/Settings';
import StudentHistory from './pages/StudentHistory';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Toast Context
const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

// Theme Context
const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

function ProtectedRoute({ children, allowedType }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (allowedType && user.type !== allowedType) {
    return <Navigate to={user.type === 'aluno' ? '/aluno' : '/dashboard'} replace />;
  }
  return children;
}

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width, 0px)', transition: 'margin-left 0.3s ease' }}>
        <div className="mobile-header" style={{ display: 'none' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
        <style>{`
          @media (min-width: 769px) { main { --sidebar-width: 260px; } }
          @media (max-width: 768px) {
            main { --sidebar-width: 0px; }
            .mobile-header { display: flex !important; align-items: center; padding: 12px 16px; background: var(--bg-secondary); border-bottom: 1px solid var(--border); }
          }
        `}</style>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [toasts, setToasts] = useState([]);
  const [theme, setThemeState] = useState(getTheme());

  useEffect(() => { seedDemoData(); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    saveTheme(next);
  };

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { logout(); setUser(null); };

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const isStudent = user?.type === 'aluno';

  return (
    <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout }}>
      <ToastContext.Provider value={addToast}>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={user ? <Navigate to={isStudent ? '/aluno' : '/dashboard'} replace /> : <Auth onLogin={handleLogin} />} />
              {/* Personal Trainer Routes */}
              <Route path="/dashboard" element={<ProtectedRoute allowedType="personal"><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/students" element={<ProtectedRoute allowedType="personal"><DashboardLayout><Students /></DashboardLayout></ProtectedRoute>} />
              <Route path="/workouts" element={<ProtectedRoute allowedType="personal"><DashboardLayout><Workouts /></DashboardLayout></ProtectedRoute>} />
              <Route path="/evolution" element={<ProtectedRoute allowedType="personal"><DashboardLayout><Evolution /></DashboardLayout></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute allowedType="personal"><DashboardLayout><Schedule /></DashboardLayout></ProtectedRoute>} />
              <Route path="/photos" element={<ProtectedRoute allowedType="personal"><DashboardLayout><Photos /></DashboardLayout></ProtectedRoute>} />
              <Route path="/history/:studentId" element={<ProtectedRoute allowedType="personal"><DashboardLayout><StudentHistory /></DashboardLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
              {/* Student Route */}
              <Route path="/aluno" element={<ProtectedRoute allowedType="aluno"><DashboardLayout><StudentDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/body-targets" element={<ProtectedRoute allowedType="aluno"><DashboardLayout><BodyTargets /></DashboardLayout></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toast toasts={toasts} />
          </BrowserRouter>
        </ThemeContext.Provider>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}
