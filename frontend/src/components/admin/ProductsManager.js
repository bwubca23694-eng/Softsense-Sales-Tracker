import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ProductsManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    api.get('/products/all').then(r => setProducts(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };
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
      fd.append('name', form.name);
      fd.append('price', form.price || 0);
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
        <div><h1 className="page-title">Products</h1><p className="page-subtitle">{products.filter(p => p.isActive).length} active</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.75rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="icon">📦</div><p>No products yet</p><button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>Add First</button></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.75rem' }}>
          {products.map((p, i) => (
            <div key={p._id} className="card animate-fade-in" style={{ animationDelay: `${i * 0.04}s`, padding: 0, overflow: 'hidden', opacity: p.isActive ? 1 : 0.55 }}>
              <div style={{ height: 120, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2.5rem', opacity: 0.35 }}>📦</span>}
                <span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`} style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.6rem' }}>{p.isActive ? 'ON' : 'OFF'}</span>
              </div>
              <div style={{ padding: '0.75rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)', marginBottom: '0.625rem' }}>
                  {p.price > 0 ? `₹${p.price.toLocaleString()}` : <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>No price</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleToggle(p)} title={p.isActive ? 'Deactivate' : 'Activate'}>{p.isActive ? '⏸' : '▶'}</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p._id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {/* Image upload */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Product Image</label>
              <div onClick={() => fileRef.current?.click()} style={{ marginTop: '0.35rem', height: 110, border: '2px dashed var(--border-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', transition: 'var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}>
                {imagePreview ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}><div style={{ fontSize: '1.8rem' }}>📷</div><div style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>Click to upload · Max 5MB</div></div>
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
