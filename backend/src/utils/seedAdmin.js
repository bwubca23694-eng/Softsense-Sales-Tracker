const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

module.exports = async () => {
  try {
    const exists = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
    if (!exists) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
      await Admin.create({ username: process.env.ADMIN_USERNAME || 'admin', password: hashed });
      console.log('✅ Admin seeded');
    }
  } catch (e) { console.error('Seed error:', e.message); }
};
