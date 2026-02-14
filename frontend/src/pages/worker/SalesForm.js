import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorker } from '../../context/WorkerContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const today = () => new Date().toISOString().split('T')[0];

const SalesForm = () => {
  const [products, setProducts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { worker, store } = useWorker();
  const navigate = useNavigate();
  const date = today();

  useEffect(() => {
    document.documentElement.setAttribute('data-context', 'worker');
    return () => document.documentElement.removeAttribute('data-context');
  }, []);

  const loadData = useCallback(async () => {
    if (!worker || !store) { navigate('/'); return; }
    try {
      const [prodRes, qRes, checkRes] = await Promise.all([
        api.get('/products'),
        api.get('/questions'),
        api.get(`/submissions/check?workerId=${worker._id}&storeId=${store._id}&date=${date}`)
      ]);
      setProducts(prodRes.data);
      setQuestions(qRes.data);
      if (checkRes.data.exists) {
        setSubmitted(true);
      } else {
        const initQty = {};
        prodRes.data.forEach(p => { initQty[p._id] = ''; });
        setQuantities(initQty);
        const initAns = {};
        qRes.data.forEach(q => { initAns[q._id] = ''; });
        setAnswers(initAns);
      }
    } catch { toast.error('Failed to load form'); }
    finally { setLoading(false); }
  }, [worker, store, navigate, date]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalQty = Object.values(quantities).reduce((s, v) => s + (Number(v) || 0), 0);
  const totalRevenue = products.reduce((s, p) => s + ((Number(quantities[p._id]) || 0) * (p.price || 0)), 0);

  const handleQty = (id, val) => { if (Number(val) < 0) return; setQuantities(q => ({ ...q, [id]: val })); };

  const handleSubmit = async () => {
    // Validate required questions
    const missingReq = questions.filter(q => q.isRequired && (!answers[q._id] || answers[q._id] === ''));
    if (missingReq.length > 0) { toast.error(`Please answer: ${missingReq[0].text}`); return; }

    const items = products
      .filter(p => quantities[p._id] !== '' && Number(quantities[p._id]) >= 0)
      .map(p => ({ product: p._id, productName: p.name, quantity: Number(quantities[p._id]) || 0, price: p.price || 0, total: (Number(quantities[p._id]) || 0) * (p.price || 0) }));

    if (items.length === 0) { toast.error('Enter at least one product quantity'); return; }

    const answerArr = questions.map(q => ({
      question: q._id, questionText: q.text, questionType: q.type, answer: answers[q._id] || ''
    })).filter(a => a.answer !== '');

    setSubmitting(true);
    try {
      await api.post('/submissions', {
        workerId: worker._id, workerName: worker.name,
        storeId: store._id, storeName: store.name,
        date, items, answers: answerArr, notes
      });
      setSubmitted(true);
      toast.success('Sales submitted! Great work 🎉');
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed';
      if (err.response?.status === 409) { setSubmitted(true); toast.error('Already submitted today!'); }
      else toast.error(msg);
    } finally { setSubmitting(false); }
  };

  if (!worker || !store) return null;

  const fmtDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // ─── Already submitted screen ───────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8faff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="animate-slide-up" style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', border: '3px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 1.25rem' }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.5rem' }}>Done for Today!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Your sales have been recorded.</p>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.75rem' }}>{store.name} · {fmtDate}</p>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => { navigate('/store'); }}>
            Submit for Another Store
          </button>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.6rem' }} onClick={() => navigate('/')}>
            Switch Worker
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff', paddingBottom: '5.5rem' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.875rem 1.25rem', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: 560, margin: '0 auto' }}>
          <button onClick={() => navigate('/store')} style={{ width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#0f172a', fontSize: '0.975rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{worker.name} · {fmtDate}</div>
          </div>
          {totalQty > 0 && <span className="badge badge-blue">{totalQty} units</span>}
        </div>
      </div>

      <div style={{ padding: '1rem', maxWidth: 560, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : (
          <>
            {/* Section heading */}
            {products.length > 0 && (
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.6rem', paddingLeft: '0.25rem' }}>Products</div>
            )}

            {/* Product cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {products.map((product, i) => (
                <div key={product._id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s`, display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 'var(--radius)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'var(--transition)' }}>
                  {/* Image */}
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {product.image ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.4rem' }}>📦</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '0.1rem' }}>
                      {product.price > 0 ? `₹${product.price.toLocaleString()}` : 'No price'}
                    </div>
                    {quantities[product._id] > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                        = ₹{((Number(quantities[product._id]) || 0) * product.price).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {/* Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <button onClick={() => handleQty(product._id, Math.max(0, (Number(quantities[product._id]) || 0) - 1))} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8faff', color: '#475569', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}>−</button>
                    <input type="number" min="0" value={quantities[product._id] || ''} onChange={e => handleQty(product._id, e.target.value)} placeholder="0"
                      style={{ width: 54, height: 30, textAlign: 'center', background: Number(quantities[product._id]) > 0 ? '#eff6ff' : '#f8faff', border: `1.5px solid ${Number(quantities[product._id]) > 0 ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 8, color: '#1e293b', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 700, outline: 'none', transition: 'var(--transition)' }}
                      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = Number(quantities[product._id]) > 0 ? '#bfdbfe' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                    <button onClick={() => handleQty(product._id, (Number(quantities[product._id]) || 0) + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)', fontWeight: 700 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Questions section */}
            {questions.length > 0 && (
              <>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.6rem', paddingLeft: '0.25rem' }}>Survey Questions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                  {questions.map((q, i) => (
                    <div key={q._id} className="animate-fade-in" style={{ animationDelay: `${(products.length + i) * 0.04}s`, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 'var(--radius)', padding: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
                        {q.text} {q.isRequired && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>*</span>}
                      </div>
                      {q.type === 'text' && (
                        <input className="form-input" style={{ background: '#f8faff', borderColor: '#e2e8f0' }} placeholder="Your answer..." value={answers[q._id] || ''} onChange={e => setAnswers(a => ({ ...a, [q._id]: e.target.value }))} />
                      )}
                      {q.type === 'number' && (
                        <input type="number" className="form-input" style={{ background: '#f8faff', borderColor: '#e2e8f0' }} placeholder="0" value={answers[q._id] || ''} onChange={e => setAnswers(a => ({ ...a, [q._id]: e.target.value }))} />
                      )}
                      {q.type === 'multiple_choice' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {q.options.map(opt => (
                            <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q._id]: opt }))}
                              style={{ padding: '0.35rem 0.875rem', borderRadius: 100, border: `1.5px solid ${answers[q._id] === opt ? '#2563eb' : '#e2e8f0'}`, background: answers[q._id] === opt ? '#eff6ff' : 'white', color: answers[q._id] === opt ? '#2563eb' : '#475569', cursor: 'pointer', fontSize: '0.82rem', fontWeight: answers[q._id] === opt ? 600 : 400, transition: 'var(--transition)' }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 'var(--radius)', padding: '0.875rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8' }}>Notes (optional)</label>
                <textarea className="form-textarea" style={{ background: '#f8faff', borderColor: '#e2e8f0', marginTop: '0.25rem' }} placeholder="Any extra info..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed bottom bar */}
      {!loading && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: totalQty > 0 ? '#2563eb' : '#cbd5e1' }}>
              {totalQty} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>units</span>
            </div>
            {totalRevenue > 0 && <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>₹{totalRevenue.toLocaleString()}</div>}
          </div>
          <button className="btn btn-success btn-lg" onClick={handleSubmit} disabled={submitting || totalQty === 0} style={{ minWidth: 130, borderRadius: 12 }}>
            {submitting ? <><div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Saving...</> : '📤 Submit'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesForm;
