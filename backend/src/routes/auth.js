const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'All fields required' });
    const admin = await Admin.findOne({ username });
    if (!admin || !(await bcrypt.compare(password, admin.password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, admin: { id: admin._id, username: admin.username } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/verify', auth, (req, res) => res.json({ admin: req.admin }));

router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id);
    if (!(await bcrypt.compare(currentPassword, admin.password)))
      return res.status(401).json({ message: 'Current password incorrect' });
    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();
    res.json({ message: 'Password updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
