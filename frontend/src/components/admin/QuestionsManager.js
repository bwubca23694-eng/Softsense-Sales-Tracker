import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const todayStr = new Date().toISOString().split('T')[0];
const monthAgoStr = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const TYPE_LABELS = { text: '📝 Text', number: '🔢 Number', multiple_choice: '☑️ Multiple Choice' };
const defaultForm = { text: '', type: 'text', isRequired: false, order: 0, options: [] };

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--text-primary)' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── ANALYTICS PANEL ────────────────────────────────────────────────────────
const QuestionAnalyticsPanel = () => {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [stores, setStores] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [filters, setFilters] = useState({
    startDate: monthAgoStr, endDate: todayStr,
    worker: '', store: '', questionId: ''
  });
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/workers/all'), api.get('/stores/all'), api.get('/questions/all')])
      .then(([w, s, q]) => { setWorkers(w.data); setStores(s.data); setAllQuestions(q.data); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.worker) params.worker = filters.worker;
      if (filters.store) params.store = filters.store;
      if (filters.questionId) params.questionId = filters.questionId;
      const { data } = await api.get('/analytics/questions', { params });
      setAnalyticsData(data);
      if (data.length === 1) setExpandedQ(String(data[0].questionId));
    } catch { toast.error('Failed to load question analytics'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearFilters = () => setFilters({ startDate: monthAgoStr, endDate: todayStr, worker: '', store: '', questionId: '' });
  const filterActive = filters.worker || filters.store || filters.questionId;

  return (
    <div>
      {/* Filter panel */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filters
          </span>
          {filterActive && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ fontSize: '0.75rem' }}>✕ Clear</button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
          <div className="form-group">
            <label className="form-label">From Date</label>
            <input className="form-input" type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To Date</label>
            <input className="form-input" type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Worker</label>
            <select className="form-select" value={filters.worker} onChange={e => setFilter('worker', e.target.value)}>
              <option value="">All Workers</option>
              {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Store</label>
            <select className="form-select" value={filters.store} onChange={e => setFilter('store', e.target.value)}>
              <option value="">All Stores</option>
              {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Question</label>
            <select className="form-select" value={filters.questionId} onChange={e => setFilter('questionId', e.target.value)}>
              <option value="">All Questions</option>
              {allQuestions.map(q => (
                <option key={q._id} value={q._id}>
                  {q.text.length > 38 ? q.text.slice(0, 38) + '…' : q.text}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : analyticsData.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📊</div>
          <p>No answers found in this date range</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>Try expanding your date range or clearing filters</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {analyticsData.map(q => {
            const qKey = String(q.questionId);
            const isExpanded = expandedQ === qKey;
            return (
              <div key={qKey} className="card animate-fade-in">
                {/* Question header row — always visible */}
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: isExpanded ? '0.875rem' : 0 }}
                  onClick={() => setExpandedQ(isExpanded ? null : qKey)}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', flexShrink: 0 }}>
                    {q.questionType === 'number' ? '🔢' : q.questionType === 'multiple_choice' ? '☑️' : '📝'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', lineHeight: 1.4 }}>{q.questionText}</div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>{TYPE_LABELS[q.questionType]}</span>
                      <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>{q.totalAnswers} answers</span>
                      {/* Quick stats in header */}
                      {q.questionType === 'number' && q.stats && (
                        <>
                          <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>Avg: {q.stats.avg}</span>
                          <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>Sum: {q.stats.sum}</span>
                          {q.stats.topWorker && (
                            <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>
                              🏆 {q.stats.topWorker.name} ({q.stats.topWorker.total})
                            </span>
                          )}
                        </>
                      )}
                      {q.questionType !== 'number' && q.distribution?.length > 0 && (
                        <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>
                          Top: "{q.distribution[0].option}" × {q.distribution[0].count}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none', flexShrink: 0, marginTop: '0.1rem' }}>›</span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <>
                    <div className="divider" style={{ marginTop: 0, marginBottom: '1rem' }} />

                    {/* ── NUMBER TYPE ─────────────────────────────── */}
                    {q.questionType === 'number' && (
                      <>
                        {/* 4 stat cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem', marginBottom: '1.1rem' }}>
                          {[
                            { label: 'Total', value: q.stats?.sum ?? 0, color: 'var(--accent)', icon: '∑' },
                            { label: 'Average', value: q.stats?.avg ?? 0, color: 'var(--accent-2)', icon: 'x̄' },
                            { label: 'Highest', value: q.stats?.max ?? 0, color: 'var(--success)', icon: '↑' },
                            { label: 'Lowest', value: q.stats?.min ?? 0, color: 'var(--warning)', icon: '↓' }
                          ].map(s => (
                            <div key={s.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{s.icon}</div>
                              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Worker ranking */}
                        {q.workerRanking?.length > 0 && (
                          <div style={{ marginBottom: '1.1rem' }}>
                            <div style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '0.55rem' }}>
                              🏆 Worker Rankings — Highest Total
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                              {q.workerRanking.map((w, i) => (
                                <div key={w.name} style={{
                                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                                  padding: '0.45rem 0.7rem',
                                  background: i === 0 ? 'rgba(245,158,11,0.08)' : i === 1 ? 'rgba(148,163,184,0.06)' : i === 2 ? 'rgba(205,124,65,0.06)' : 'var(--bg-secondary)',
                                  border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.3)' : i === 1 ? 'rgba(148,163,184,0.2)' : i === 2 ? 'rgba(205,124,65,0.2)' : 'var(--border)'}`,
                                  borderRadius: 9
                                }}>
                                  {/* Medal */}
                                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c41' : 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i <= 2 ? '0.8rem' : '0.65rem', fontWeight: 700, color: i <= 2 ? 'white' : 'var(--text-muted)', flexShrink: 0 }}>
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                  </div>
                                  {/* Avatar */}
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: `hsl(${(w.name || '').charCodeAt(0) * 17 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                    {(w.name || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.855rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                    <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>Total: {w.total}</span>
                                    <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>Avg: {w.avg}</span>
                                    <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>{w.count}×</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Daily trend - total & avg lines */}
                        {q.dailyTrend?.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              Daily Trend
                            </div>
                            <ResponsiveContainer width="100%" height={155}>
                              <LineChart data={q.dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                                <Tooltip content={<ChartTip />} />
                                <Line type="monotone" dataKey="total" name="Daily Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="avg" name="Daily Avg" stroke="#10b981" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── TEXT / MULTIPLE CHOICE TYPE ─────────────── */}
                    {(q.questionType === 'text' || q.questionType === 'multiple_choice') && (
                      <>
                        {/* Distribution */}
                        {q.distribution?.length > 0 && (
                          <div style={{ marginBottom: '1.1rem' }}>
                            <div style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              Answer Distribution ({q.distribution.length} unique)
                            </div>
                            {/* Use chart for ≤12 options, list for more */}
                            {q.distribution.length <= 12 ? (
                              <ResponsiveContainer width="100%" height={Math.max(100, Math.min(q.distribution.length * 36, 320))}>
                                <BarChart data={q.distribution} layout="vertical" margin={{ left: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                  <YAxis type="category" dataKey="option" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={110} />
                                  <Tooltip content={<ChartTip />} />
                                  <Bar dataKey="count" name="Responses" radius={[0, 4, 4, 0]}>
                                    {q.distribution.map((_, idx) => (
                                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 220, overflowY: 'auto', paddingRight: '0.25rem' }}>
                                {q.distribution.slice(0, 30).map((d, i) => (
                                  <div key={d.option} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: 7, fontSize: '0.8rem' }}>
                                    <span style={{ fontWeight: 800, color: COLORS[i % COLORS.length], width: 28, flexShrink: 0, textAlign: 'right' }}>{d.count}×</span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{d.option}</span>
                                    {/* Mini bar */}
                                    <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2, flexShrink: 0 }}>
                                      <div style={{ height: '100%', borderRadius: 2, background: COLORS[i % COLORS.length], width: `${(d.count / q.distribution[0].count) * 100}%` }} />
                                    </div>
                                  </div>
                                ))}
                                {q.distribution.length > 30 && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.3rem' }}>
                                    +{q.distribution.length - 30} more unique answers
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Daily response count */}
                        {q.dailyTrend?.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              Daily Response Count
                            </div>
                            <ResponsiveContainer width="100%" height={135}>
                              <BarChart data={q.dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip content={<ChartTip />} />
                                <Bar dataKey="count" name="Responses" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── MAIN QuestionsManager ──────────────────────────────────────────────────
const QuestionsManager = () => {
  const [tab, setTab] = useState('manage');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [optionInput, setOptionInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/questions/all').then(r => setQuestions(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setOptionInput(''); setShowModal(true); };
  const openEdit = (q) => {
    setEditing(q);
    setForm({ text: q.text, type: q.type, isRequired: q.isRequired, order: q.order, options: [...(q.options || [])] });
    setOptionInput('');
    setShowModal(true);
  };

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
      const payload = { ...form, options: form.type === 'multiple_choice' ? form.options : [] };
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
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Questions</h1>
          <p className="page-subtitle">{questions.filter(q => q.isActive).length} active · Shown to workers daily</p>
        </div>
        {tab === 'manage' && (
          <button className="btn btn-primary" onClick={openAdd}>+ Add Question</button>
        )}
      </div>

      {/* Tab toggle */}
      <div className="tab-bar" style={{ marginBottom: '1.25rem', maxWidth: 280 }}>
        <button className={`tab-btn ${tab === 'manage' ? 'active' : ''}`} onClick={() => setTab('manage')}>
          ⚙️ Manage
        </button>
        <button className={`tab-btn ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>
          📊 Analytics
        </button>
      </div>

      {/* ── MANAGE TAB ── */}
      {tab === 'manage' && (
        <>
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', padding: '0.6rem 0.875rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--accent)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0 }}>💡</span>
            <span>Questions appear at the bottom of each worker's daily sales form. Answers are stored with each submission and included in Excel exports.</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
            </div>
          ) : questions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">❓</div>
              <p>No questions yet</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>e.g. "How many customers visited today?"</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>Add First Question</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {questions.map((q, i) => (
                <div key={q._id} className="card animate-fade-in" style={{ animationDelay: `${i * 0.04}s`, opacity: q.isActive ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                      {q.type === 'text' ? '📝' : q.type === 'number' ? '🔢' : '☑️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.text}</span>
                        {q.isRequired && <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>Required</span>}
                        <span className={`badge ${q.isActive ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.62rem' }}>{q.isActive ? 'Active' : 'Paused'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>{TYPE_LABELS[q.type]}</span>
                        {q.type === 'multiple_choice' && q.options?.map(opt => (
                          <span key={opt} style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 100, color: 'var(--text-secondary)' }}>{opt}</span>
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
        </>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && <QuestionAnalyticsPanel />}

      {/* ── Add/Edit Modal ── */}
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
                  <option value="text">📝 Text — Free-form answer</option>
                  <option value="number">🔢 Number — Numeric value</option>
                  <option value="multiple_choice">☑️ Multiple Choice — Pick one option</option>
                </select>
              </div>

              {form.type === 'multiple_choice' && (
                <div className="form-group">
                  <label className="form-label">Options (min 2 required)</label>
                  {form.options.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      {form.options.map(opt => (
                        <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 100, fontSize: '0.82rem' }}>
                          {opt}
                          <button onClick={() => removeOption(opt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.95rem', lineHeight: 1, padding: '0 0 0 2px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="form-input" placeholder="Type option, press Enter or Add" value={optionInput} onChange={e => setOptionInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())} style={{ flex: 1 }} />
                    <button className="btn btn-secondary btn-sm" onClick={addOption}>Add</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <label className="ios-toggle">
                  <input type="checkbox" checked={form.isRequired} onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))} />
                  <div className="ios-track" />
                  <span className="ios-toggle-label">Required</span>
                </label>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Display Order</label>
                  <input className="form-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} style={{ padding: '0.45rem 0.7rem' }} />
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
