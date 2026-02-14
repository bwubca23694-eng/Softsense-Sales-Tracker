import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const WorkersManager = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () => { setLoading(true); api.get('/workers/all').then(r => setWorkers(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setName(''); setShowModal(true); };
  const openEdit = (w) => { setEditing(w); setName(w.name); setShowModal(true); };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing) { await api.put(`/workers/${editing._id}`, { name: name.trim() }); toast.success('Updated!'); }
      else { await api.post('/workers', { name: name.trim() }); toast.success('Added!'); }
      setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this worker?')) return;
    try { await api.delete(`/workers/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleToggle = async (w) => {
    try { await api.put(`/workers/${w._id}`, { isActive: !w.isActive }); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div><h1 className="page-title">Workers</h1><p className="page-subtitle">{workers.filter(w => w.isActive).length} active · Click a name to view analytics</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Worker</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 58 }} />)}</div>
      ) : workers.length === 0 ? (
        <div className="empty-state"><div className="icon">👥</div><p>No workers yet</p><button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>Add First Worker</button></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Name</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead>
            <tbody>
              {workers.map((w, i) => (
                <tr key={w._id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${w.name.charCodeAt(0) * 17 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'white', flexShrink: 0 }}>{w.name.charAt(0).toUpperCase()}</div>
                      <button className="text-link" onClick={() => navigate(`/admin/workers/${w._id}`)} style={{ fontWeight: 600, fontSize: '0.9rem' }}>{w.name}</button>
                    </div>
                  </td>
                  <td><span className={`badge ${w.isActive ? 'badge-green' : 'badge-red'}`}>{w.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/workers/${w._id}`)}>📊 Analytics</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(w)}>Edit</button>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleToggle(w)}>{w.isActive ? '⏸' : '▶'}</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(w._id)}>🗑</button>
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
              <h2 className="modal-title">{editing ? 'Edit Worker' : 'Add Worker'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Worker's name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>
                  {saving ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Saving...</> : (editing ? 'Update' : 'Add Worker')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersManager;
