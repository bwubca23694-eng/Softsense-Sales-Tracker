import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const today = new Date().toISOString().split('T')[0];
const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '0.6rem 0.875rem', fontSize: '0.8rem' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong></div>)}
    </div>
  );
};

const WorkerDetail = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [workerName, setWorkerName] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data: d } = await api.get(`/analytics/worker/${workerId}`, { params });
      setData(d);
      if (d.recentSubmissions?.[0]?.workerName) setWorkerName(d.recentSubmissions[0].workerName);
    } catch { toast.error('Failed to load worker analytics'); }
    finally { setLoading(false); }
  }, [workerId, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  // Also fetch worker name from list if not yet available
  useEffect(() => {
    if (!workerName) {
      api.get('/workers/all').then(r => {
        const w = r.data.find(x => x._id === workerId);
        if (w) setWorkerName(w.name);
      }).catch(() => {});
    }
  }, [workerId, workerName]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <button onClick={() => navigate('/admin/workers')} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.5rem' }}>← Workers</button>
          </div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(workerName || 'W').charCodeAt(0) * 17 % 360}, 65%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'white', flexShrink: 0 }}>{(workerName || 'W').charAt(0).toUpperCase()}</div>
            {workerName || 'Worker'} Analytics
          </h1>
          <p className="page-subtitle">Individual performance breakdown</p>
        </div>
        {/* Date range */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: 145 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>→</span>
          <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: 145 }} />
          <button className="btn btn-secondary btn-sm" onClick={() => { setStartDate(monthAgo); setEndDate(today); }}>Reset</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner spinner-lg" /></div>
      ) : !data ? null : (
        <>
          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {[
              { icon: '📋', label: 'Submissions', value: data.overview.submissions, color: 'var(--accent)' },
              { icon: '📦', label: 'Total Units', value: data.overview.totalQuantity, color: 'var(--accent-2)' },
              { icon: '💰', label: 'Total Revenue', value: `₹${(data.overview.totalRevenue || 0).toLocaleString()}`, color: 'var(--success)' },
              { icon: '🏪', label: 'Stores Covered', value: data.byStore.length, color: 'var(--accent-3)' },
            ].map(s => (
              <div key={s.label} className="card animate-fade-in">
                <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                <div className="stat-value" style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Daily trend */}
          {data.daily.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>Daily Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                  <Line type="monotone" dataKey="totalQuantity" name="Units" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="totalRevenue" name="Revenue ₹" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* By Store */}
            {data.byStore.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>Performance by Store</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.byStore} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="totalQuantity" name="Units" fill="#3b82f6" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* By Product */}
            {data.byProduct.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>Top Products</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.byProduct.map((p, i) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: 18, textAlign: 'right' }}>{i+1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{p.totalQuantity}</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                          <div style={{ height: '100%', borderRadius: 2, background: 'var(--accent)', width: `${(p.totalQuantity / data.byProduct[0].totalQuantity) * 100}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent submissions */}
          {data.recentSubmissions?.length > 0 && (
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>Recent Submissions</h3>
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="table">
                  <thead><tr><th>Date</th><th>Store</th><th>Units</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {data.recentSubmissions.map(s => (
                      <tr key={s._id}>
                        <td style={{ fontSize: '0.82rem' }}>{s.date}</td>
                        <td style={{ fontSize: '0.82rem' }}>{s.storeName}</td>
                        <td><span className="badge badge-blue">{s.totalQuantity}</span></td>
                        <td style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.85rem' }}>₹{(s.totalRevenue || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.overview.submissions === 0 && (
            <div className="empty-state"><div className="icon">📊</div><p>No data in this date range</p></div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkerDetail;
