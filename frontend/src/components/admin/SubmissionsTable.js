import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const today = () => new Date().toISOString().split('T')[0];

const SubmissionsTable = () => {
  const [view, setView] = useState('today'); // 'today' | 'previous'
  const [submissions, setSubmissions] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [filters, setFilters] = useState({ worker: '', store: '', startDate: '', endDate: '' });
  const [exporting, setExporting] = useState(false);
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (view === 'today') {
        params.todayOnly = true;
      } else {
        if (filters.worker) params.worker = filters.worker;
        if (filters.store) params.store = filters.store;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
      }
      const { data } = await api.get('/submissions', { params });
      setSubmissions(data.submissions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page, filters, view]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([api.get('/workers/all'), api.get('/stores/all')])
      .then(([w, s]) => { setWorkers(w.data); setStores(s.data); }).catch(() => {});
  }, []);

  const handleViewSwitch = (v) => { setView(v); setPage(1); setExpanded(null); };
  const handleSort = (col) => { if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortDir('asc'); } };
  const handleFilterChange = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };
  const clearFilters = () => { setFilters({ worker: '', store: '', startDate: '', endDate: '' }); setPage(1); };

  const sorted = [...submissions].sort((a, b) => {
    let av = a[sortBy], bv = b[sortBy];
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const p = new URLSearchParams();
      if (view === 'today') { p.set('startDate', today()); p.set('endDate', today()); }
      else { Object.entries(filters).forEach(([k, v]) => v && p.set(k, v)); }
      const res = await api.get(`/export/${format}?${p}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `softsense-${view}-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Export downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission?')) return;
    try { await api.delete(`/submissions/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const SortIcon = ({ col }) => <span style={{ marginLeft: '0.25rem', opacity: sortBy === col ? 1 : 0.3, fontSize: '0.7rem' }}>{sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>;

  const todayStr = today();
  const filterActive = view === 'previous' && Object.values(filters).some(Boolean);

  const totalRevenue = sorted.reduce((s, r) => s + (r.totalRevenue || 0), 0);
  const totalQty = sorted.reduce((s, r) => s + (r.totalQuantity || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Submissions</h1>
          <p className="page-subtitle">{total} record{total !== 1 ? 's' : ''} · {totalQty} units · ₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('csv')} disabled={exporting}>⬇ CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => handleExport('excel')} disabled={exporting}>
            {exporting ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : '📊 Excel'}
          </button>
        </div>
      </div>

      {/* Today / Previous toggle */}
      <div className="tab-bar" style={{ marginBottom: '1rem', maxWidth: 300 }}>
        <button className={`tab-btn ${view === 'today' ? 'active' : ''}`} onClick={() => handleViewSwitch('today')}>
          📅 Today
        </button>
        <button className={`tab-btn ${view === 'previous' ? 'active' : ''}`} onClick={() => handleViewSwitch('previous')}>
          🗂 All Previous
        </button>
      </div>

      {/* Filters - only for Previous */}
      {view === 'previous' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label">Worker</label>
              <select className="form-select" value={filters.worker} onChange={e => handleFilterChange('worker', e.target.value)}>
                <option value="">All Workers</option>
                {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Store</label>
              <select className="form-select" value={filters.store} onChange={e => handleFilterChange('store', e.target.value)}>
                <option value="">All Stores</option>
                {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">From</label>
              <input className="form-input" type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">To</label>
              <input className="form-input" type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
            </div>
            {filterActive && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>✕ Clear</button>
            )}
          </div>
        </div>
      )}

      {/* Today banner */}
      {view === 'today' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '0.875rem', fontSize: '0.82rem', color: 'var(--accent)' }}>
          <span>📅</span> Showing submissions for today: <strong>{todayStr}</strong>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner spinner-lg" style={{ margin: '0 auto' }} /></div>
        ) : sorted.length === 0 ? (
          <div className="empty-state"><div className="icon">{view === 'today' ? '📅' : '📋'}</div><p>{view === 'today' ? 'No submissions yet today' : 'No submissions found'}</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')}>Date <SortIcon col="date" /></th>
                <th onClick={() => handleSort('workerName')}>Worker <SortIcon col="workerName" /></th>
                <th onClick={() => handleSort('storeName')}>Store <SortIcon col="storeName" /></th>
                <th onClick={() => handleSort('totalQuantity')}>Qty <SortIcon col="totalQuantity" /></th>
                <th onClick={() => handleSort('totalRevenue')}>Revenue <SortIcon col="totalRevenue" /></th>
                <th>Items</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(sub => (
                <React.Fragment key={sub._id}>
                  <tr className="clickable-row" onClick={() => setExpanded(expanded === sub._id ? null : sub._id)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{sub.date}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: `hsl(${(sub.workerName || '').charCodeAt(0) * 17 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{(sub.workerName || '?').charAt(0)}</div>
                        <span style={{ fontWeight: 500 }}>{sub.workerName}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{sub.storeName}</td>
                    <td><span className="badge badge-blue">{sub.totalQuantity}</span></td>
                    <td><span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--success)' }}>₹{(sub.totalRevenue || 0).toLocaleString()}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{sub.items?.length || 0}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(sub._id)} title="Delete">🗑</button>
                    </td>
                  </tr>
                  {expanded === sub._id && (
                    <tr>
                      <td colSpan={7} style={{ background: 'var(--bg-secondary)', padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: sub.answers?.length ? '0.6rem' : 0 }}>
                          {sub.items?.map(item => (
                            <div key={item.productName} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.7rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{item.productName}</span>
                              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{item.quantity}</span>
                              {item.price > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>× ₹{item.price} = ₹{item.total?.toLocaleString()}</span>}
                            </div>
                          ))}
                        </div>
                        {sub.answers?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            {sub.answers.map(a => (
                              <div key={a.questionText} style={{ padding: '0.3rem 0.7rem', background: 'rgba(139,92,246,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,92,246,0.2)', fontSize: '0.78rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{a.questionText}: </span>
                                <span style={{ fontWeight: 600, color: 'var(--accent-3)' }}>{String(a.answer)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {sub.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>📝 {sub.notes}</div>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
        </div>
      )}
    </div>
  );
};

export default SubmissionsTable;
