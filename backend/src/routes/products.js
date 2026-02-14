const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { upload, cloudinary } = require('../utils/cloudinary');

router.get('/', async (req, res) => {
  try { res.json(await Product.find({ isActive: true }).sort({ name: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/all', auth, async (req, res) => {
  try { res.json(await Product.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const data = { name, price: parseFloat(price) || 0 };
    if (req.file) { data.image = req.file.path; data.imagePublicId = req.file.filename; }
    res.status(201).json(await Product.create(data));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    const updates = { ...req.body };
    if (updates.price !== undefined) updates.price = parseFloat(updates.price) || 0;
    if (req.file) {
      if (product.imagePublicId) await cloudinary.uploader.destroy(product.imagePublicId);
      updates.image = req.file.path;
      updates.imagePublicId = req.file.filename;
    }
    res.json(await Product.findByIdAndUpdate(req.params.id, updates, { new: true }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    if (p.imagePublicId) await cloudinary.uploader.destroy(p.imagePublicId);
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
