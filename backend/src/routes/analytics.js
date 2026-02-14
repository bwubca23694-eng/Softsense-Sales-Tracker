const router = require('express').Router();
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const buildDateQuery = (startDate, endDate) => {
  const d = {};
  if (startDate) d.$gte = startDate;
  if (endDate) d.$lte = endDate;
  return Object.keys(d).length ? d : null;
};

const buildMatch = ({ startDate, endDate, worker, store }) => {
  const match = {};
  const dq = buildDateQuery(startDate, endDate);
  if (dq) match.date = dq;
  if (worker) {
    try { match.worker = mongoose.Types.ObjectId.createFromHexString(worker); } catch {}
  }
  if (store) {
    try { match.store = mongoose.Types.ObjectId.createFromHexString(store); } catch {}
  }
  return match;
};

// ── Overview KPIs ──────────────────────────────────────────────────────────
router.get('/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dq = buildDateQuery(startDate, endDate);
    const query = dq ? { date: dq } : {};
    const [totalSubmissions, agg, workers, stores] = await Promise.all([
      Submission.countDocuments(query),
      Submission.aggregate([{ $match: query }, { $group: { _id: null, qty: { $sum: '$totalQuantity' }, rev: { $sum: '$totalRevenue' } } }]),
      Submission.distinct('worker', query),
      Submission.distinct('store', query)
    ]);
    res.json({ totalSubmissions, totalQuantity: agg[0]?.qty || 0, totalRevenue: agg[0]?.rev || 0, uniqueWorkers: workers.length, uniqueStores: stores.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Daily trend ────────────────────────────────────────────────────────────
router.get('/daily', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dq = buildDateQuery(startDate, endDate);
    const match = dq ? { date: dq } : {};
    const result = await Submission.aggregate([
      { $match: match },
      { $group: { _id: '$date', count: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(result.map(r => ({ date: r._id, count: r.count, totalQuantity: r.totalQty, totalRevenue: r.totalRev })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── By worker ──────────────────────────────────────────────────────────────
router.get('/by-worker', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dq = buildDateQuery(startDate, endDate);
    const match = dq ? { date: dq } : {};
    const result = await Submission.aggregate([
      { $match: match },
      { $group: { _id: { id: '$worker', name: '$workerName' }, submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } },
      { $sort: { totalRev: -1 } }
    ]);
    res.json(result.map(r => ({ id: r._id.id, name: r._id.name, submissions: r.submissions, totalQuantity: r.totalQty, totalRevenue: r.totalRev })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── By store ───────────────────────────────────────────────────────────────
router.get('/by-store', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dq = buildDateQuery(startDate, endDate);
    const match = dq ? { date: dq } : {};
    const result = await Submission.aggregate([
      { $match: match },
      { $group: { _id: { id: '$store', name: '$storeName' }, submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } },
      { $sort: { totalRev: -1 } }
    ]);
    res.json(result.map(r => ({ id: r._id.id, name: r._id.name, submissions: r.submissions, totalQuantity: r.totalQty, totalRevenue: r.totalRev })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── By product (summary list) ──────────────────────────────────────────────
router.get('/by-product', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dq = buildDateQuery(startDate, endDate);
    const match = dq ? { date: dq } : {};
    const result = await Submission.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' } } },
      { $sort: { totalQty: -1 } },
      { $limit: 20 }
    ]);
    res.json(result.map(r => ({ name: r._id, totalQuantity: r.totalQty, totalRevenue: r.totalRev })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── PRODUCT DETAIL analytics ───────────────────────────────────────────────
// GET /api/analytics/product/:productName?startDate=&endDate=&worker=&store=
router.get('/product/:productName', auth, async (req, res) => {
  try {
    const productName = decodeURIComponent(req.params.productName);
    const { startDate, endDate, worker, store } = req.query;
    const baseMatch = buildMatch({ startDate, endDate, worker, store });

    const [overview, daily, byWorker, byStore] = await Promise.all([
      Submission.aggregate([
        { $match: baseMatch }, { $unwind: '$items' },
        { $match: { 'items.productName': productName } },
        { $group: { _id: null, totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' }, submissions: { $sum: 1 } } }
      ]),
      Submission.aggregate([
        { $match: baseMatch }, { $unwind: '$items' },
        { $match: { 'items.productName': productName } },
        { $group: { _id: '$date', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' } } },
        { $sort: { _id: 1 } }
      ]),
      Submission.aggregate([
        { $match: baseMatch }, { $unwind: '$items' },
        { $match: { 'items.productName': productName } },
        { $group: { _id: '$workerName', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' } } },
        { $sort: { totalQty: -1 } }
      ]),
      Submission.aggregate([
        { $match: baseMatch }, { $unwind: '$items' },
        { $match: { 'items.productName': productName } },
        { $group: { _id: '$storeName', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' } } },
        { $sort: { totalQty: -1 } }
      ])
    ]);

    res.json({
      productName,
      overview: overview[0]
        ? { totalQuantity: overview[0].totalQty, totalRevenue: overview[0].totalRev, submissions: overview[0].submissions }
        : { totalQuantity: 0, totalRevenue: 0, submissions: 0 },
      daily: daily.map(r => ({ date: r._id, totalQuantity: r.totalQty, totalRevenue: r.totalRev })),
      byWorker: byWorker.map(r => ({ name: r._id, totalQuantity: r.totalQty, totalRevenue: r.totalRev })),
      byStore: byStore.map(r => ({ name: r._id, totalQuantity: r.totalQty, totalRevenue: r.totalRev }))
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── QUESTION analytics ─────────────────────────────────────────────────────
// GET /api/analytics/questions?startDate=&endDate=&worker=&store=&questionId=
router.get('/questions', auth, async (req, res) => {
  try {
    const { startDate, endDate, worker, store, questionId } = req.query;
    const baseMatch = buildMatch({ startDate, endDate, worker, store });

    const pipeline = [
      { $match: baseMatch },
      { $unwind: '$answers' },
      ...(questionId ? [{ $match: { 'answers.question': mongoose.Types.ObjectId.createFromHexString(questionId) } }] : []),
      {
        $group: {
          _id: { qid: '$answers.question', qtext: '$answers.questionText', qtype: '$answers.questionType' },
          rawAnswers: { $push: { worker: '$workerName', workerId: '$worker', answer: '$answers.answer', date: '$date', store: '$storeName' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.qtext': 1 } }
    ];

    const result = await Submission.aggregate(pipeline);

    const questions = result.map(r => {
      const q = {
        questionId: r._id.qid,
        questionText: r._id.qtext,
        questionType: r._id.qtype,
        totalAnswers: r.count
      };

      if (r._id.qtype === 'number') {
        // Per-worker totals for ranking
        const workerMap = {};
        r.rawAnswers.forEach(a => {
          const val = parseFloat(a.answer);
          if (isNaN(val)) return;
          if (!workerMap[a.worker]) workerMap[a.worker] = { name: a.worker, total: 0, count: 0, entries: [] };
          workerMap[a.worker].total += val;
          workerMap[a.worker].count += 1;
          workerMap[a.worker].entries.push({ date: a.date, value: val, store: a.store });
        });
        const ranking = Object.values(workerMap)
          .sort((a, b) => b.total - a.total)
          .map((w, i) => ({ rank: i + 1, name: w.name, total: w.total, count: w.count, avg: parseFloat((w.total / w.count).toFixed(1)) }));

        const allVals = r.rawAnswers.map(a => parseFloat(a.answer)).filter(v => !isNaN(v));
        q.stats = {
          sum: allVals.reduce((s, v) => s + v, 0),
          avg: allVals.length ? parseFloat((allVals.reduce((s, v) => s + v, 0) / allVals.length).toFixed(1)) : 0,
          max: allVals.length ? Math.max(...allVals) : 0,
          min: allVals.length ? Math.min(...allVals) : 0,
          topWorker: ranking[0] || null
        };
        q.workerRanking = ranking;

        // Daily trend
        const dayMap = {};
        r.rawAnswers.forEach(a => {
          const val = parseFloat(a.answer);
          if (isNaN(val)) return;
          if (!dayMap[a.date]) dayMap[a.date] = { date: a.date, total: 0, count: 0 };
          dayMap[a.date].total += val;
          dayMap[a.date].count += 1;
        });
        q.dailyTrend = Object.values(dayMap)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(d => ({ date: d.date, total: d.total, avg: parseFloat((d.total / d.count).toFixed(1)) }));

      } else {
        // Text / multiple_choice: frequency distribution
        const freq = {};
        r.rawAnswers.forEach(a => {
          const key = String(a.answer || '').trim();
          if (!key) return;
          if (!freq[key]) freq[key] = { option: key, count: 0 };
          freq[key].count += 1;
        });
        q.distribution = Object.values(freq).sort((a, b) => b.count - a.count);

        // Daily answer count trend
        const dayMap = {};
        r.rawAnswers.forEach(a => {
          if (!dayMap[a.date]) dayMap[a.date] = { date: a.date, count: 0 };
          dayMap[a.date].count += 1;
        });
        q.dailyTrend = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
      }

      return q;
    });

    res.json(questions);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── WORKER DETAIL ──────────────────────────────────────────────────────────
router.get('/worker/:workerId', auth, async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;
    const dq = buildDateQuery(startDate, endDate);
    const match = { worker: mongoose.Types.ObjectId.createFromHexString(workerId), ...(dq ? { date: dq } : {}) };
    const [overview, daily, byStore, byProduct, recentSubmissions] = await Promise.all([
      Submission.aggregate([{ $match: match }, { $group: { _id: null, submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } }]),
      Submission.aggregate([{ $match: match }, { $group: { _id: '$date', count: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } }, { $sort: { _id: 1 } }]),
      Submission.aggregate([{ $match: match }, { $group: { _id: '$storeName', submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } }, { $sort: { totalRev: -1 } }]),
      Submission.aggregate([{ $match: match }, { $unwind: '$items' }, { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' } } }, { $sort: { totalQty: -1 } }, { $limit: 10 }]),
      Submission.find(match).sort({ date: -1 }).limit(10).populate('store', 'name')
    ]);
    res.json({
      overview: overview[0] ? { submissions: overview[0].submissions, totalQuantity: overview[0].totalQty, totalRevenue: overview[0].totalRev } : { submissions: 0, totalQuantity: 0, totalRevenue: 0 },
      daily: daily.map(r => ({ date: r._id, count: r.count, totalQuantity: r.totalQty, totalRevenue: r.totalRev })),
      byStore: byStore.map(r => ({ name: r._id, submissions: r.submissions, totalQuantity: r.totalQty, totalRevenue: r.totalRev })),
      byProduct: byProduct.map(r => ({ name: r._id, totalQuantity: r.totalQty, totalRevenue: r.totalRev })),
      recentSubmissions
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── STORE DETAIL ───────────────────────────────────────────────────────────
router.get('/store/:storeId', auth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;
    const dq = buildDateQuery(startDate, endDate);
    const match = { store: mongoose.Types.ObjectId.createFromHexString(storeId), ...(dq ? { date: dq } : {}) };
    const [overview, daily, byWorker, byProduct, recentSubmissions] = await Promise.all([
      Submission.aggregate([{ $match: match }, { $group: { _id: null, submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } }]),
      Submission.aggregate([{ $match: match }, { $group: { _id: '$date', count: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } }, { $sort: { _id: 1 } }]),
      Submission.aggregate([{ $match: match }, { $group: { _id: '$workerName', submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } }, { $sort: { totalRev: -1 } }]),
      Submission.aggregate([{ $match: match }, { $unwind: '$items' }, { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' } } }, { $sort: { totalQty: -1 } }, { $limit: 10 }]),
      Submission.find(match).sort({ date: -1 }).limit(10).populate('worker', 'name')
    ]);
    res.json({
      overview: overview[0] ? { submissions: overview[0].submissions, totalQuantity: overview[0].totalQty, totalRevenue: overview[0].totalRev } : { submissions: 0, totalQuantity: 0, totalRevenue: 0 },
      daily: daily.map(r => ({ date: r._id, count: r.count, totalQuantity: r.totalQty, totalRevenue: r.totalRev })),
      byWorker: byWorker.map(r => ({ name: r._id, submissions: r.submissions, totalQuantity: r.totalQty, totalRevenue: r.totalRev })),
      byProduct: byProduct.map(r => ({ name: r._id, totalQuantity: r.totalQty, totalRevenue: r.totalRev })),
      recentSubmissions
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
