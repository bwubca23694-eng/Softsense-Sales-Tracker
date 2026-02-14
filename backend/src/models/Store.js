const mongoose = require('mongoose');
const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('Store', storeSchema);
