import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../lib/storage';
import { Zap, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', type: 'personal' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = loginUser(loginForm.email, loginForm.password);
      onLogin(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    setLoading(true);
    try {
      const user = registerUser(registerForm);
      onLogin(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const loginDemoPersonal = () => {
    setLoginForm({ email: 'marcio@powerfit.com', password: '123456' });
  };

  const loginDemoStudent = () => {
    setLoginForm({ email: 'ana@powerfit.com', password: '123456' });
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-container animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon"><Zap size={22} /></div>
            <span>PowerFit</span>
          </div>
          <p>Plataforma de Gestão de Treinos</p>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Entrar</button>
          <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Cadastrar</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input type="email" className="form-input input-with-icon" placeholder="seu@email.com" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input type={showPassword ? 'text' : 'password'} className="form-input input-with-icon" placeholder="••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
                <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
              <button type="button" className="btn btn-outline" style={{ width: '100%', fontSize: '0.8rem' }} onClick={loginDemoPersonal}>
                Demo Personal
              </button>
              <button type="button" className="btn btn-outline" style={{ width: '100%', fontSize: '0.8rem' }} onClick={loginDemoStudent}>
                Demo Aluno
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Nome Completo *</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input type="text" className="form-input input-with-icon" placeholder="Seu nome" value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input type="email" className="form-input input-with-icon" placeholder="seu@email.com" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <div className="input-icon-wrapper">
                <Phone size={18} className="input-icon" />
                <input type="tel" className="form-input input-with-icon" placeholder="(11) 99999-9999" value={registerForm.phone} onChange={e => setRegisterForm({...registerForm, phone: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input type={showPassword ? 'text' : 'password'} className="form-input input-with-icon" placeholder="Mín. 6 caracteres" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} required minLength={6} />
                <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }
        
        .auth-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 30%, rgba(255,107,53,0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 70%, rgba(59,130,246,0.06) 0%, transparent 50%),
                      var(--bg-primary);
        }
        
        .auth-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 36px;
          box-shadow: var(--shadow-lg);
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 28px;
        }
        
        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        
        .auth-logo-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .auth-logo span {
          font-size: 1.4rem;
          font-weight: 900;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .auth-header p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        
        .auth-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #FCA5A5;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          margin-bottom: 16px;
          text-align: center;
        }
        
        .input-icon-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        
        .input-with-icon {
          padding-left: 40px !important;
        }
        
        .input-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          display: flex;
        }
        
        .input-toggle:hover { color: var(--text-primary); }
      `}</style>
    </div>
  );
}
