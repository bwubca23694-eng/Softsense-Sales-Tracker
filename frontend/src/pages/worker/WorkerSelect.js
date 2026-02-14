import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorker } from '../../context/WorkerContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const WorkerSelect = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const { selectWorker } = useWorker();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-context', 'worker');
    return () => document.documentElement.removeAttribute('data-context');
  }, []);

  useEffect(() => {
    api.get('/api/workers').then(r => setWorkers(r.data)).catch(() => toast.error('Failed to load workers')).finally(() => setLoading(false));
  }, []);

  const handleTitleTap = () => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 5) { tapCount.current = 0; navigate('/admin/login'); }
  };

  const filtered = workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
        padding: '2.5rem 1.5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 30% 30%, white 0%, transparent 60%), radial-gradient(circle at 70% 70%, white 0%, transparent 60%)' }} />
        <h1
          onClick={handleTitleTap}
          style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', cursor: 'default', userSelect: 'none', position: 'relative' }}
        >SoftSense</h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Daily Sales Tracker</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '0.3rem 0.9rem', marginTop: '0.875rem' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Pallab Arong</span>
        </div>
      </div>

      <div style={{ padding: '1.25rem', maxWidth: 460, margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '1rem' }}>🔍</span>
          <input className="form-input" style={{ paddingLeft: '2.5rem', background: 'white', borderColor: '#e2e8f0' }} placeholder="Search your name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 62, borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">👤</div><p>{search ? 'No match found' : 'No workers yet'}</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((w, i) => (
              <button
                key={w._id}
                onClick={() => { selectWorker(w); navigate('/store'); }}
                className="animate-fade-in"
                style={{
                  animationDelay: `${i * 0.04}s`, display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1rem', background: 'white',
                  border: '1.5px solid #e2e8f0', borderRadius: 'var(--radius)',
                  cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left', width: '100%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `hsl(${w.name.charCodeAt(0) * 17 % 360}, 65%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'white', flexShrink: 0 }}>
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>{w.name}</span>
                <span style={{ color: '#94a3b8', fontSize: '1.1rem' }}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerSelect;
