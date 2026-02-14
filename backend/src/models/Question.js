const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['text', 'number', 'multiple_choice'],
    default: 'text'
  },
  options: [{ type: String, trim: true }], // for multiple_choice only
  isRequired: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
