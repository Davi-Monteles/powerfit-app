import { useState, useEffect } from 'react';
import { getUsers, getStudents, getWorkouts } from '../lib/storage';
import { useStorageSync } from '../lib/useStorageSync';
import { TrendingUp, Users, Zap, DollarSign, Dumbbell, Crown } from 'lucide-react';
import { getPlans } from '../lib/storage';


export default function MasterDashboard() {
  const [personals, setPersonals] = useState([]);
  const [students, setStudents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const { revision } = useStorageSync();

  useEffect(() => {
    const allUsers = getUsers();
    setPersonals(allUsers.filter(u => u.type === 'personal' || u.type === 'master'));
    setStudents(getStudents());
    setWorkouts(getWorkouts());
  }, [revision]);


  const premiumStudentsCount = students.filter(s => s.isPremium).length;
  const mrr = premiumStudentsCount * 24.90;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2><TrendingUp size={24} style={{ color: 'var(--primary)', display: 'inline', marginRight: '8px' }}/> Painel do Master (PowerFit)</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Visão global do faturamento e usuários do sistema.</p>
        </div>
      </div>

      <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card metric-card card-glow">
          <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}><DollarSign size={24} /></div>
          <div>
            <p className="metric-label">MRR (Faturamento Premium)</p>
            <h3 className="metric-value">R$ {mrr.toFixed(2).replace('.', ',')}</h3>
          </div>
        </div>
        <div className="card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(255, 107, 53, 0.1)', color: 'var(--primary)' }}><Zap size={24} /></div>
          <div>
            <p className="metric-label">Alunos Premium</p>
            <h3 className="metric-value">{premiumStudentsCount}</h3>
          </div>
        </div>
        <div className="card metric-card">
          <div className="metric-icon"><Users size={24} /></div>
          <div>
            <p className="metric-label">Personais Ativos</p>
            <h3 className="metric-value">{personals.length}</h3>
          </div>
        </div>
        <div className="card metric-card">
          <div className="metric-icon"><Dumbbell size={24} /></div>
          <div>
            <p className="metric-label">Alunos Totais</p>
            <h3 className="metric-value">{students.length}</h3>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Personal Trainers Cadastrados</h3>
        {personals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>Nenhum personal cadastrado ainda.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>Nome</th>
                  <th style={{ padding: '12px 8px' }}>Email</th>
                  <th style={{ padding: '12px 8px' }}>Alunos Cadastrados</th>
                  <th style={{ padding: '12px 8px' }}>Limite Atual</th>
                  <th style={{ padding: '12px 8px' }}>Data Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {personals.map(p => {
                  const personalStudents = students.filter(s => s.personalId === p.id);
                  const plan = getPlans().find(pl => pl.id === p.planId);
                  const limit = plan?.studentLimit || 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.name}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{p.email}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${personalStudents.length >= limit ? 'badge-danger' : 'badge-primary'}`}>
                          {personalStudents.length} / {limit}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                         {plan?.name || 'Nenhum'}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .metric-card { display: flex; align-items: center; gap: 16px; padding: 20px; }
        .metric-icon { width: 48px; height: 48px; border-radius: var(--radius-full); background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
        .metric-label { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; }
        .metric-value { font-size: 1.6rem; font-weight: 700; }
        .badge-danger { background: rgba(239, 68, 68, 0.2); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.3); }
      `}</style>
    </div>
  );
}
