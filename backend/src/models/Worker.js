const mongoose = require('mongoose');
const workerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('Worker', workerSchema);
