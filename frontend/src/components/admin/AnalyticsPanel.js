import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6','#06b6d4','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '0.6rem 0.875rem', fontSize: '0.8rem' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong></div>)}
    </div>
  );
};

const today = new Date().toISOString().split('T')[0];
const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

const AnalyticsPanel = () => {
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);
  const [byWorker, setByWorker] = useState([]);
  const [byStore, setByStore] = useState([]);
  const [byProduct, setByProduct] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const [ov, d, w, s, p] = await Promise.all([
        api.get('/analytics/overview', { params }),
        api.get('/analytics/daily', { params }),
        api.get('/analytics/by-worker', { params }),
        api.get('/analytics/by-store', { params }),
        api.get('/analytics/by-product', { params })
      ]);
      setOverview(ov.data); setDaily(d.data); setByWorker(w.data); setByStore(s.data); setByProduct(p.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const StatCard = ({ icon, label, value, color, fmt }) => (
    <div className="card animate-fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -8, right: -4, fontSize: '2.8rem', opacity: 0.05, userSelect: 'none' }}>{icon}</div>
      <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{icon}</div>
      <div className="stat-value" style={{ color }}>{fmt ? `₹${Number(value).toLocaleString()}` : Number(value).toLocaleString()}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Performance overview & trends</p>
        </div>
        {/* Date range filter */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: 145 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>→</span>
          <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: 145 }} />
          <button className="btn btn-secondary btn-sm" onClick={() => { setStartDate(monthAgo); setEndDate(today); }}>Reset</button>
        </div>
      </div>

      {loading && !overview ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner spinner-lg" /></div>
      ) : (
        <>
          {/* KPI cards */}
          {overview && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <StatCard icon="📋" label="Total Submissions" value={overview.totalSubmissions} color="var(--accent)" />
              <StatCard icon="📦" label="Total Units" value={overview.totalQuantity} color="var(--accent-2)" />
              <StatCard icon="💰" label="Total Revenue" value={overview.totalRevenue} color="var(--success)" fmt />
              <StatCard icon="👥" label="Active Workers" value={overview.uniqueWorkers} color="var(--accent-3)" />
              <StatCard icon="🏪" label="Active Stores" value={overview.uniqueStores} color="var(--warning)" />
            </div>
          )}

          {/* Daily trend */}
          {daily.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>Daily Trend</h3>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                  <Line type="monotone" dataKey="count" name="Submissions" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalQuantity" name="Units" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalRevenue" name="Revenue ₹" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {byWorker.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>Top Workers</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byWorker.slice(0,8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={75} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="totalRevenue" name="Revenue ₹" fill="#3b82f6" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {byStore.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>Store Performance</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byStore.slice(0,8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={75} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="totalRevenue" name="Revenue ₹" fill="#06b6d4" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {byProduct.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>Product Mix</h3>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={byProduct.slice(0,8)} dataKey="totalQuantity" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                      {byProduct.slice(0,8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>Product Ranking</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {byProduct.slice(0,8).map((p, i) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{i+1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: COLORS[i % COLORS.length], flexShrink: 0 }}>{p.totalQuantity}</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                          <div style={{ height: '100%', borderRadius: 2, background: COLORS[i % COLORS.length], width: `${(p.totalQuantity / byProduct[0].totalQuantity) * 100}%`, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!loading && daily.length === 0 && <div className="empty-state"><div className="icon">📊</div><p>No data in this date range</p></div>}
        </>
      )}
    </div>
  );
};

export default AnalyticsPanel;
