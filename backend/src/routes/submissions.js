const router = require('express').Router();
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

// Admin - all submissions with filter (today or date range)
router.get('/', auth, async (req, res) => {
  try {
    const { worker, store, startDate, endDate, todayOnly, page = 1, limit = 50 } = req.query;
    const query = {};
    if (worker) query.worker = worker;
    if (store) query.store = store;
    if (todayOnly === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query.date = today;
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }
    const total = await Submission.countDocuments(query);
    const submissions = await Submission.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('worker', 'name')
      .populate('store', 'name location');
    res.json({ submissions, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Check if submission exists for today
router.get('/check', async (req, res) => {
  try {
    const { workerId, storeId, date } = req.query;
    const existing = await Submission.findOne({ worker: workerId, store: storeId, date });
    res.json({ exists: !!existing });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Create submission (worker)
router.post('/', async (req, res) => {
  try {
    const { workerId, workerName, storeId, storeName, date, items, answers, notes } = req.body;
    if (!workerId || !storeId || !date || !items) return res.status(400).json({ message: 'Missing required fields' });
    const existing = await Submission.findOne({ worker: workerId, store: storeId, date });
    if (existing) return res.status(409).json({ message: 'Already submitted for today' });
    const totalQuantity = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const totalRevenue = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
    const sub = await Submission.create({
      worker: workerId, workerName, store: storeId, storeName,
      date, items, answers: answers || [], notes, totalQuantity, totalRevenue
    });
    res.status(201).json(sub);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Already submitted for today' });
    res.status(500).json({ message: e.message });
  }
});

// Admin delete
router.delete('/:id', auth, async (req, res) => {
  try { await Submission.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
