import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || 'Não foi possível atualizar a senha.');
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <main className="auth-page">
      <div className="auth-bg" />
      <form className="auth-container animate-slide-up" onSubmit={handleSubmit}>
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon"><Zap size={22} /></div>
            <span>PowerFit</span>
          </div>
          <p>Defina sua nova senha</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="new-password">Nova senha</label>
          <div className="input-icon-wrapper">
            <Lock size={18} className="input-icon" />
            <input id="new-password" type="password" className="form-input input-with-icon" autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="confirm-password">Confirmar senha</label>
          <div className="input-icon-wrapper">
            <Lock size={18} className="input-icon" />
            <input id="confirm-password" type="password" className="form-input input-with-icon" autoComplete="new-password" minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} required />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
      <style>{`
        .auth-page { min-height: 100vh; display: grid; place-items: center; padding: 20px; position: relative; }
        .auth-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 30%, rgba(255,107,53,.08), transparent 50%), var(--bg-primary); }
        .auth-container { position: relative; z-index: 1; width: min(420px, 100%); padding: 36px; border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--bg-card); box-shadow: var(--shadow-lg); }
        .auth-header { text-align: center; margin-bottom: 28px; }
        .auth-logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .auth-logo-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--radius-md); background: var(--gradient-primary); color: white; }
        .auth-logo span { font-size: 1.4rem; font-weight: 900; color: var(--primary); }
        .auth-header p { color: var(--text-muted); }
        .auth-error { margin-bottom: 16px; padding: 10px 14px; border: 1px solid rgba(239,68,68,.3); border-radius: var(--radius-md); background: rgba(239,68,68,.1); color: #FCA5A5; text-align: center; }
        .input-icon-wrapper { position: relative; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .input-with-icon { padding-left: 40px !important; }
      `}</style>
    </main>
  );
}
