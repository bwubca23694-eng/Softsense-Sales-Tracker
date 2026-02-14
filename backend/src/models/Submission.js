const mongoose = require('mongoose');

const submissionItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false });

const questionAnswerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  questionText: { type: String, required: true },
  questionType: { type: String },
  answer: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  workerName: { type: String, required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  storeName: { type: String, required: true },
  date: { type: String, required: true },
  items: [submissionItemSchema],
  answers: [questionAnswerSchema],
  notes: { type: String, trim: true },
  totalQuantity: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }
}, { timestamps: true });

submissionSchema.index({ worker: 1, store: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
