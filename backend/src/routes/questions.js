const router = require('express').Router();
const Question = require('../models/Question');
const auth = require('../middleware/auth');

// Public - workers fetch active questions
router.get('/', async (req, res) => {
  try { res.json(await Question.find({ isActive: true }).sort({ order: 1, createdAt: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin - all questions
router.get('/all', auth, async (req, res) => {
  try { res.json(await Question.find().sort({ order: 1, createdAt: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin - create
router.post('/', auth, async (req, res) => {
  try {
    const { text, type, options, isRequired, order } = req.body;
    if (!text) return res.status(400).json({ message: 'Question text required' });
    if (type === 'multiple_choice' && (!options || options.length < 2))
      return res.status(400).json({ message: 'Multiple choice needs at least 2 options' });
    res.status(201).json(await Question.create({ text, type, options: options || [], isRequired, order: order || 0 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin - update
router.put('/:id', auth, async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!q) return res.status(404).json({ message: 'Not found' });
    res.json(q);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin - delete
router.delete('/:id', auth, async (req, res) => {
  try { await Question.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
