import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser, hydrateSessionUser, logout, getTheme, setTheme as saveTheme, getUserPlan } from './lib/storage';
import { supabase } from './lib/supabaseClient';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Upgrade from './pages/Upgrade';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Workouts from './pages/Workouts';
import Evolution from './pages/Evolution';
import Schedule from './pages/Schedule';
import Photos from './pages/Photos';
import StudentDashboard from './pages/StudentDashboard';
import BodyTargets from './pages/BodyTargets';
import Settings from './pages/Settings';
import MasterDashboard from './pages/MasterDashboard';
import StudentHistory from './pages/StudentHistory';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import PricingPlans from './pages/PricingPlans';
import MyPlan from './pages/MyPlan';

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Toast Context
const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

// Theme Context
const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

function ProtectedRoute({ children, allowedType, requirePlan }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  
  if (allowedType && user.type !== allowedType) {
    return <Navigate to={user.type === 'aluno' ? '/aluno' : user.type === 'master' ? '/master' : user.type === 'personal' ? '/dashboard' : '/auth'} replace />;
  }
  
  if (requirePlan && user.type === 'personal') {
    const plan = getUserPlan();
    if (!plan) return <Navigate to="/planos" replace />;
  }
  
  return children;
}

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {isOffline && (
        <div style={{ background: '#FF4500', color: '#fff', textAlign: 'center', padding: '6px', fontSize: '0.85rem', fontWeight: 600, zIndex: 9999 }}>
          ⚠️ Você está offline. As modificações serão sincronizadas quando reconectar.
        </div>
      )}
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, marginLeft: 'var(--sidebar-width, 0px)', transition: 'margin-left 0.3s ease', display: 'flex', flexDirection: 'column' }}>
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
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [theme, setThemeState] = useState(getTheme());
  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => { 
    const initAuth = async () => {
      try {
        // 3. AUTH FLOW INTELIGENTE
        const { data: { session } } = await supabase.auth.getSession();
        
        let activeEmail = null;
        if (session && session.user) activeEmail = session.user.email;
        else {
          const local = getCurrentUser();
          if (local) activeEmail = local.email;
        }

        if (activeEmail) {
          const cleanEmail = activeEmail.toLowerCase().trim();
          
          let profile = null;
          const localUser = getCurrentUser();
          // Buscar perfil em students e users sem pedir Accept: object, evitando 406 e sessão parcial.
          const stuRes = await supabase.from('students').select('*').eq('email', cleanEmail).limit(1);
          const studentRow = Array.isArray(stuRes?.data) ? stuRes.data[0] : null;
          if (studentRow) {
            profile = hydrateSessionUser({ ...localUser, ...studentRow, type: 'aluno' });
          } else {
            const usrRes = await supabase.from('users').select('*').eq('email', cleanEmail).limit(1);
            const userRow = Array.isArray(usrRes?.data) ? usrRes.data[0] : null;
            if (userRow) profile = hydrateSessionUser({ ...localUser, ...userRow });
          }

          if (profile) {
            setUser(profile);
            localStorage.setItem('powerfit_current_user', JSON.stringify(profile));
          } else {
            let localUser = getCurrentUser();
            if (localUser) {
              if (localUser.weight == 55) localUser.weight = 0;
              if (localUser.height == 55) localUser.height = 0;
              if (localUser.birthDate === '05/05/0055') localUser.birthDate = '';
              setUser(localUser);
            } else {
              setUser(null);
            }
          }
        }
      } catch (err) {
        let localUser = getCurrentUser();
        if (localUser) {
          if (localUser.weight == 55) localUser.weight = 0;
          if (localUser.height == 55) localUser.height = 0;
          if (localUser.birthDate === '05/05/0055') localUser.birthDate = '';
          setUser(localUser);
        } else {
          setUser(null);
        }
      } finally {
        setLoadingApp(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    saveTheme(next);
  };

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = async () => { await logout(); setUser(null); };

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const isStudent = user?.type === 'aluno';

  if (loadingApp) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>Carregando Perfil...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout }}>
      <ToastContext.Provider value={addToast}>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/auth" element={user?.type ? <Navigate to={isStudent ? '/aluno' : user.type === 'master' ? '/master' : '/dashboard'} replace /> : <Auth onLogin={handleLogin} />} />
              {/* Personal Trainer Routes */}
              <Route path="/planos" element={user?.type === 'personal' ? <PricingPlans /> : <Navigate to="/auth" replace />} />
                  <Route path="/dashboard" element={<ProtectedRoute allowedType="personal" requirePlan><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/students" element={<ProtectedRoute allowedType="personal" requirePlan><DashboardLayout><Students /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/workouts" element={<ProtectedRoute><DashboardLayout><Workouts /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/evolution" element={<ProtectedRoute requirePlan><DashboardLayout><Evolution /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/schedule" element={<ProtectedRoute requirePlan><DashboardLayout><Schedule /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/photos" element={<ProtectedRoute requirePlan><DashboardLayout><Photos /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/history/:studentId" element={<ProtectedRoute allowedType="personal" requirePlan><DashboardLayout><StudentHistory /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/meu-plano" element={<ProtectedRoute allowedType="personal"><DashboardLayout><MyPlan /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
                  {/* Student Route */}
                  <Route path="/aluno" element={<ProtectedRoute allowedType="aluno"><DashboardLayout><StudentDashboard /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/ai-chat" element={<ProtectedRoute allowedType="aluno">{user?.isPremium === true ? <DashboardLayout><StudentDashboard /></DashboardLayout> : <Navigate to="/aluno" replace />}</ProtectedRoute>} />
                  <Route path="/body-targets" element={
                    <ProtectedRoute allowedType="aluno">
                      {user?.isPremium === true ? (
                        <DashboardLayout><BodyTargets /></DashboardLayout>
                      ) : (
                        <Navigate to="/aluno" replace />
                      )}
                    </ProtectedRoute>
                  } />
                  {/* Master Route */}
                  <Route path="/master" element={<ProtectedRoute allowedType="master"><DashboardLayout><MasterDashboard /></DashboardLayout></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toast toasts={toasts} />
          </BrowserRouter>
        </ThemeContext.Provider>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}
