import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const today = new Date().toISOString().split('T')[0];
const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

const ProductAnalyticsModal = ({ product, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [workers, setWorkers] = useState([]);
  const [stores, setStores] = useState([]);
  const [filterWorker, setFilterWorker] = useState('');
  const [filterStore, setFilterStore] = useState('');

  useEffect(() => {
    Promise.all([api.get('/workers/all'), api.get('/stores/all')])
      .then(([w, s]) => { setWorkers(w.data); setStores(s.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (filterWorker) params.worker = filterWorker;
        if (filterStore) params.store = filterStore;
        const { data: d } = await api.get(`/analytics/product/${encodeURIComponent(product.name)}`, { params });
        setData(d);
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoading(false); }
    };
    load();
  }, [product.name, startDate, endDate, filterWorker, filterStore]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxHeight: '88vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {product.image ? <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>📦</span>}
            </div>
            <div>
              <div className="modal-title">{product.name}</div>
              {product.price > 0 && <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>₹{product.price.toLocaleString()} per unit</div>}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div className="form-group">
            <label className="form-label">From</label>
            <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Worker</label>
            <select className="form-select" value={filterWorker} onChange={e => setFilterWorker(e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
              <option value="">All</option>
              {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Store</label>
            <select className="form-select" value={filterStore} onChange={e => setFilterStore(e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
              <option value="">All</option>
              {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          {(filterWorker || filterStore) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterWorker(''); setFilterStore(''); }}>✕ Clear</button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><div className="spinner spinner-lg" /></div>
        ) : !data ? null : (
          <>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
              {[
                { label: 'Total Sold', value: data.overview.totalQuantity, icon: '📦', color: 'var(--accent)' },
                { label: 'Revenue', value: `₹${(data.overview.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: 'var(--success)' },
                { label: 'Submissions', value: data.overview.submissions, icon: '📋', color: 'var(--accent-3)' }
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Daily trend */}
            {data.daily.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Daily Sales Trend</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<Tip />} />
                    <Line type="monotone" dataKey="totalQuantity" name="Units Sold" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: data.byStore.length > 0 ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
              {/* By worker */}
              {data.byWorker.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>By Worker</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {data.byWorker.map((w, i) => (
                      <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: `hsl(${(w.name || '').charCodeAt(0) * 17 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{w.totalQuantity}</span>
                          </div>
                          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                            <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${(w.totalQuantity / data.byWorker[0].totalQuantity) * 100}%`, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By store */}
              {data.byStore.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>By Store</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {data.byStore.map((s, i) => (
                      <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-2)', flexShrink: 0 }}>{s.totalQuantity}</span>
                          </div>
                          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                            <div style={{ height: '100%', background: 'var(--accent-2)', borderRadius: 2, width: `${(s.totalQuantity / data.byStore[0].totalQuantity) * 100}%`, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {data.overview.totalQuantity === 0 && (
              <div className="empty-state" style={{ padding: '1.5rem' }}><div className="icon">📦</div><p>No sales data in this range</p></div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Main ProductsManager ────────────────────────────────────────────────────
const ProductsManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = () => { setLoading(true); api.get('/products/all').then(r => setProducts(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', price: '' }); setImageFile(null); setImagePreview(''); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, price: p.price || '' }); setImageFile(null); setImagePreview(p.image || ''); setShowModal(true); };

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setImageFile(f); setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name); fd.append('price', form.price || 0);
      if (imageFile) fd.append('image', imageFile);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) { await api.put(`/products/${editing._id}`, fd, cfg); toast.success('Updated!'); }
      else { await api.post('/products', fd, cfg); toast.success('Added!'); }
      setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleToggle = async (p) => {
    try { await api.put(`/products/${p._id}`, { isActive: !p.isActive }); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div><h1 className="page-title">Products</h1><p className="page-subtitle">{products.filter(p => p.isActive).length} active · Click 📊 for analytics</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.75rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 210 }} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="icon">📦</div><p>No products yet</p><button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>Add First</button></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.75rem' }}>
          {products.map((p, i) => (
            <div key={p._id} className="card animate-fade-in" style={{ animationDelay: `${i * 0.04}s`, padding: 0, overflow: 'hidden', opacity: p.isActive ? 1 : 0.55 }}>
              <div style={{ height: 115, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', cursor: 'pointer' }} onClick={() => setShowAnalytics(p)}>
                {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>📦</span>}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
                  <span style={{ color: 'white', fontSize: '1.5rem', opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.parentElement.style.background = 'rgba(0,0,0,0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}>📊</span>
                </div>
                <span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`} style={{ position: 'absolute', top: 7, right: 7, fontSize: '0.6rem' }}>{p.isActive ? 'ON' : 'OFF'}</span>
              </div>
              <div style={{ padding: '0.75rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--success)', marginBottom: '0.625rem' }}>
                  {p.price > 0 ? `₹${p.price.toLocaleString()}` : <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>No price</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowAnalytics(p)} title="View Analytics">📊</button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleToggle(p)}>{p.isActive ? '⏸' : '▶'}</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p._id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Analytics Modal */}
      {showAnalytics && <ProductAnalyticsModal product={showAnalytics} onClose={() => setShowAnalytics(null)} />}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Product Image</label>
              <div onClick={() => fileRef.current?.click()} style={{ marginTop: '0.35rem', height: 100, border: '2px dashed var(--border-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}>
                {imagePreview ? <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}><div style={{ fontSize: '1.6rem' }}>📷</div><div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Click to upload · Max 5MB</div></div>
                )}
              </div>
              <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleImg} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-input" placeholder="e.g. Basmati Rice 5kg" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>
                  {saving ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Saving...</> : (editing ? 'Update' : 'Add Product')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
