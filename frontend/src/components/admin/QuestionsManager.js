import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const TYPE_LABELS = { text: '📝 Text', number: '🔢 Number', multiple_choice: '☑️ Multiple Choice' };
const defaultForm = { text: '', type: 'text', isRequired: false, order: 0, options: [] };

const QuestionsManager = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [optionInput, setOptionInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/questions/all').then(r => setQuestions(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setOptionInput(''); setShowModal(true); };
  const openEdit = (q) => { setEditing(q); setForm({ text: q.text, type: q.type, isRequired: q.isRequired, order: q.order, options: [...(q.options || [])] }); setOptionInput(''); setShowModal(true); };

  const addOption = () => {
    if (!optionInput.trim()) return;
    if (form.options.includes(optionInput.trim())) { toast.error('Duplicate option'); return; }
    setForm(f => ({ ...f, options: [...f.options, optionInput.trim()] }));
    setOptionInput('');
  };
  const removeOption = (opt) => setForm(f => ({ ...f, options: f.options.filter(o => o !== opt) }));

  const handleSubmit = async () => {
    if (!form.text.trim()) { toast.error('Question text required'); return; }
    if (form.type === 'multiple_choice' && form.options.length < 2) { toast.error('Add at least 2 options'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (form.type !== 'multiple_choice') payload.options = [];
      if (editing) { await api.put(`/questions/${editing._id}`, payload); toast.success('Updated!'); }
      else { await api.post('/questions', payload); toast.success('Question added!'); }
      setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try { await api.delete(`/questions/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleToggle = async (q) => {
    try { await api.put(`/questions/${q._id}`, { isActive: !q.isActive }); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Questions</h1>
          <p className="page-subtitle">{questions.filter(q => q.isActive).length} active · Shown to workers daily</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Question</button>
      </div>

      {/* Info banner */}
      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--accent)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0 }}>💡</span>
        <span>Questions appear at the bottom of each worker's daily sales form. Answers are stored with each submission and included in exports.</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="empty-state"><div className="icon">❓</div><p>No questions yet</p><p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>Add questions like "How many customers visited today?"</p><button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>Add First Question</button></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {questions.map((q, i) => (
            <div key={q._id} className="card animate-fade-in" style={{ animationDelay: `${i * 0.04}s`, opacity: q.isActive ? 1 : 0.55 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  {q.type === 'text' ? '📝' : q.type === 'number' ? '🔢' : '☑️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.text}</span>
                    {q.isRequired && <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>Required</span>}
                    <span className={`badge ${q.isActive ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.62rem' }}>{q.isActive ? 'Active' : 'Paused'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>{TYPE_LABELS[q.type]}</span>
                    {q.type === 'multiple_choice' && q.options?.map(opt => (
                      <span key={opt} style={{ fontSize: '0.72rem', padding: '0.1rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 100, color: 'var(--text-secondary)' }}>{opt}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(q)}>Edit</button>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleToggle(q)} title={q.isActive ? 'Pause' : 'Activate'}>{q.isActive ? '⏸' : '▶'}</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(q._id)}>🗑</button>
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
              <h2 className="modal-title">{editing ? 'Edit Question' : 'Add Question'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <textarea className="form-textarea" rows={2} placeholder="e.g. How many customers purchased today?" value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Answer Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, options: [] }))}>
                  <option value="text">📝 Text — Free-form text answer</option>
                  <option value="number">🔢 Number — Numeric value</option>
                  <option value="multiple_choice">☑️ Multiple Choice — Pick one option</option>
                </select>
              </div>

              {/* Multiple choice options */}
              {form.type === 'multiple_choice' && (
                <div className="form-group">
                  <label className="form-label">Options (min 2)</label>
                  {form.options.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      {form.options.map(opt => (
                        <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 100, fontSize: '0.82rem' }}>
                          {opt}
                          <button onClick={() => removeOption(opt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.9rem', lineHeight: 1, padding: 0 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="form-input" placeholder="Add option..." value={optionInput} onChange={e => setOptionInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())} style={{ flex: 1 }} />
                    <button className="btn btn-secondary btn-sm" onClick={addOption}>Add</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label className="ios-toggle">
                  <input type="checkbox" checked={form.isRequired} onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))} />
                  <div className="ios-track" />
                  <span className="ios-toggle-label">Required</span>
                </label>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Display Order</label>
                  <input className="form-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} style={{ height: 36 }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>
                  {saving ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Saving...</> : (editing ? 'Update' : 'Add Question')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsManager;
