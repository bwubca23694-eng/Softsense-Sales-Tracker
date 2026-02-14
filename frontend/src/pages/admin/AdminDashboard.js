import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SubmissionsTable from '../../components/admin/SubmissionsTable';
import AnalyticsPanel from '../../components/admin/AnalyticsPanel';
import ProductsManager from '../../components/admin/ProductsManager';
import WorkersManager from '../../components/admin/WorkersManager';
import StoresManager from '../../components/admin/StoresManager';
import QuestionsManager from '../../components/admin/QuestionsManager';
import WorkerDetail from '../../components/admin/WorkerDetail';
import StoreDetail from '../../components/admin/StoreDetail';

const NAV = [
  { path: '/admin/submissions', icon: '📋', label: 'Submissions' },
  { path: '/admin/analytics', icon: '📊', label: 'Analytics' },
  { path: '/admin/products', icon: '📦', label: 'Products' },
  { path: '/admin/questions', icon: '❓', label: 'Questions' },
  { path: '/admin/workers', icon: '👥', label: 'Workers' },
  { path: '/admin/stores', icon: '🏪', label: 'Stores' },
];

const IOSToggle = ({ checked, onChange, label }) => (
  <label className="ios-toggle" title={label}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <div className="ios-track" />
    {label && <span className="ios-toggle-label">{label}</span>}
  </label>
);

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const { theme, toggle, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const Sidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>📊</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'white', letterSpacing: '-0.02em' }}>SoftSense</div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Admin Console</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0.6rem', flex: 1, overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.55rem 0.7rem', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: '0.15rem', background: active ? 'rgba(59,130,246,0.18)' : 'transparent', color: active ? '#60a5fa' : 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: active ? 600 : 400, transition: 'var(--transition)', textAlign: 'left', borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent' }}
              onMouseEnter={e => !active && (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
              onMouseLeave={e => !active && (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
              <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Theme toggle + logout */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid var(--sidebar-border)' }}>
        {/* iOS theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.7rem', background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem' }}>{isDark ? '🌙' : '☀️'}</span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{isDark ? 'Dark' : 'Light'}</span>
          </div>
          <IOSToggle checked={!isDark} onChange={toggle} />
        </div>

        {/* Admin user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'white', fontWeight: 700, flexShrink: 0 }}>{admin?.username?.charAt(0).toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin?.username}</div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Administrator</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Desktop sidebar */}
      <aside style={{ width: 220, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20 }} className="sidebar-desktop">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 18, backdropFilter: 'blur(2px)' }} />
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, zIndex: 19 }}>
            <Sidebar />
          </aside>
        </>
      )}

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{ display: 'none', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1rem', background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--sidebar-border)', position: 'sticky', top: 0, zIndex: 15 }}>
          <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.3rem', display: 'flex', alignItems: 'center' }}>☰</button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'white' }}>SoftSense</span>
          <div style={{ marginLeft: 'auto' }}>
            <IOSToggle checked={!isDark} onChange={toggle} />
          </div>
        </div>

        <div style={{ flex: 1, padding: '1.5rem', maxWidth: 1400, width: '100%' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/submissions" replace />} />
            <Route path="submissions" element={<SubmissionsTable />} />
            <Route path="analytics" element={<AnalyticsPanel />} />
            <Route path="products" element={<ProductsManager />} />
            <Route path="questions" element={<QuestionsManager />} />
            <Route path="workers" element={<WorkersManager />} />
            <Route path="workers/:workerId" element={<WorkerDetail />} />
            <Route path="stores" element={<StoresManager />} />
            <Route path="stores/:storeId" element={<StoreDetail />} />
            <Route path="dashboard" element={<Navigate to="/admin/submissions" replace />} />
          </Routes>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          main { margin-left: 0 !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
