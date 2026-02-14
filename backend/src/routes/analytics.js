const router = require('express').Router();
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

const buildDateQuery = (startDate, endDate) => {
  const d = {};
  if (startDate) d.$gte = startDate;
  if (endDate) d.$lte = endDate;
  return Object.keys(d).length ? d : null;
};

// Overview KPIs
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
    res.json({
      totalSubmissions,
      totalQuantity: agg[0]?.qty || 0,
      totalRevenue: agg[0]?.rev || 0,
      uniqueWorkers: workers.length,
      uniqueStores: stores.length
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Daily trend
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

// By worker summary
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

// By store summary
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

// By product summary
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

// ─── WORKER DETAIL analytics ───────────────────────────────────────────────
router.get('/worker/:workerId', auth, async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;
    const dq = buildDateQuery(startDate, endDate);
    const match = { worker: require('mongoose').Types.ObjectId.createFromHexString(workerId), ...(dq ? { date: dq } : {}) };

    const [overview, daily, byStore, byProduct, recentSubmissions] = await Promise.all([
      Submission.aggregate([
        { $match: match },
        { $group: { _id: null, submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } }
      ]),
      Submission.aggregate([
        { $match: match },
        { $group: { _id: '$date', count: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } },
        { $sort: { _id: 1 } }
      ]),
      Submission.aggregate([
        { $match: match },
        { $group: { _id: '$storeName', submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } },
        { $sort: { totalRev: -1 } }
      ]),
      Submission.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' } } },
        { $sort: { totalQty: -1 } }, { $limit: 10 }
      ]),
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

// ─── STORE DETAIL analytics ────────────────────────────────────────────────
router.get('/store/:storeId', auth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;
    const dq = buildDateQuery(startDate, endDate);
    const match = { store: require('mongoose').Types.ObjectId.createFromHexString(storeId), ...(dq ? { date: dq } : {}) };

    const [overview, daily, byWorker, byProduct, recentSubmissions] = await Promise.all([
      Submission.aggregate([
        { $match: match },
        { $group: { _id: null, submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } }
      ]),
      Submission.aggregate([
        { $match: match },
        { $group: { _id: '$date', count: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } },
        { $sort: { _id: 1 } }
      ]),
      Submission.aggregate([
        { $match: match },
        { $group: { _id: '$workerName', submissions: { $sum: 1 }, totalQty: { $sum: '$totalQuantity' }, totalRev: { $sum: '$totalRevenue' } } },
        { $sort: { totalRev: -1 } }
      ]),
      Submission.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' } } },
        { $sort: { totalQty: -1 } }, { $limit: 10 }
      ]),
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
