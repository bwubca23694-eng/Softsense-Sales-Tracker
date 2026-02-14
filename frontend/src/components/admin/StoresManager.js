import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const StoresManager = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', location: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () => { setLoading(true); api.get('/stores/all').then(r => setStores(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', location: '' }); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, location: s.location || '' }); setShowModal(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing) { await api.put(`/stores/${editing._id}`, form); toast.success('Updated!'); }
      else { await api.post('/stores', form); toast.success('Added!'); }
      setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/stores/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleToggle = async (s) => {
    try { await api.put(`/stores/${s._id}`, { isActive: !s.isActive }); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div><h1 className="page-title">Stores</h1><p className="page-subtitle">{stores.filter(s => s.isActive).length} active · Click a name for detailed analytics</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Store</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 58 }} />)}</div>
      ) : stores.length === 0 ? (
        <div className="empty-state"><div className="icon">🏪</div><p>No stores yet</p><button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>Add First Store</button></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Store</th><th>Location</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead>
            <tbody>
              {stores.map((s, i) => (
                <tr key={s._id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🏪</div>
                      <button className="text-link" onClick={() => navigate(`/admin/stores/${s._id}`)} style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</button>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.location || '—'}</td>
                  <td><span className={`badge ${s.isActive ? 'badge-green' : 'badge-red'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/stores/${s._id}`)}>📊 Analytics</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleToggle(s)}>{s.isActive ? '⏸' : '▶'}</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s._id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Store' : 'Add Store'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Store Name *</label>
                <input className="form-input" placeholder="e.g. Downtown Branch" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="e.g. 123 Main St" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>
                  {saving ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Saving...</> : (editing ? 'Update' : 'Add Store')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresManager;
