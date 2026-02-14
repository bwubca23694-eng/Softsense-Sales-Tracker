import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorker } from '../../context/WorkerContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const StoreSelect = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { worker, store: lastStore, selectStore, clearSession } = useWorker();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-context', 'worker');
    return () => document.documentElement.removeAttribute('data-context');
  }, []);

  useEffect(() => {
    if (!worker) { navigate('/'); return; }
    api.get('/stores').then(r => setStores(r.data)).catch(() => toast.error('Failed to load stores')).finally(() => setLoading(false));
  }, [worker, navigate]);

  const filtered = stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/')} style={{ width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Select Store</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hi, {worker?.name} 👋</div>
        </div>
        <button onClick={clearSession} style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>Switch User</button>
      </div>

      <div style={{ padding: '1.25rem', maxWidth: 460, margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
          <input className="form-input" style={{ paddingLeft: '2.5rem', background: 'white', borderColor: '#e2e8f0' }} placeholder="Search store..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">🏪</div><p>No stores found</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((s, i) => {
              const isLast = lastStore?._id === s._id;
              return (
                <button
                  key={s._id}
                  onClick={() => { selectStore(s); navigate('/form'); }}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${i * 0.04}s`, display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.875rem 1rem',
                    background: isLast ? '#eff6ff' : 'white',
                    border: `1.5px solid ${isLast ? '#bfdbfe' : '#e2e8f0'}`,
                    borderRadius: 'var(--radius)', cursor: 'pointer',
                    transition: 'var(--transition)', textAlign: 'left', width: '100%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isLast ? '#bfdbfe' : '#e2e8f0'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🏪</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#1e293b' }}>{s.name}</div>
                    {s.location && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>📍 {s.location}</div>}
                  </div>
                  
                  <span style={{ color: '#94a3b8', fontSize: '1.1rem' }}>›</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreSelect;
