const router = require('express').Router();
const Worker = require('../models/Worker');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try { res.json(await Worker.find({ isActive: true }).sort({ name: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/all', auth, async (req, res) => {
  try { res.json(await Worker.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    if (await Worker.findOne({ name: name.trim() }))
      return res.status(400).json({ message: 'Worker already exists' });
    res.status(201).json(await Worker.create({ name: name.trim() }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const w = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!w) return res.status(404).json({ message: 'Not found' });
    res.json(w);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await Worker.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
