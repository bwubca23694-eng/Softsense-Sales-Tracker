const router = require('express').Router();
const Store = require('../models/Store');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try { res.json(await Store.find({ isActive: true }).sort({ name: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/all', auth, async (req, res) => {
  try { res.json(await Store.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    if (await Store.findOne({ name: name.trim() }))
      return res.status(400).json({ message: 'Store already exists' });
    res.status(201).json(await Store.create({ name: name.trim(), location }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const s = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ message: 'Not found' });
    res.json(s);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await Store.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
