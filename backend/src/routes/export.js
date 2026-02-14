const router = require('express').Router();
const XLSX = require('xlsx');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

const getQuery = (q) => {
  const query = {};
  if (q.worker) query.worker = q.worker;
  if (q.store) query.store = q.store;
  if (q.startDate || q.endDate) {
    query.date = {};
    if (q.startDate) query.date.$gte = q.startDate;
    if (q.endDate) query.date.$lte = q.endDate;
  }
  return query;
};

router.get('/excel', auth, async (req, res) => {
  try {
    const subs = await Submission.find(getQuery(req.query)).sort({ date: -1 });
    const rows = [];
    subs.forEach(sub => {
      sub.items.forEach((item, idx) => {
        const row = {
          Date: sub.date, Worker: sub.workerName, Store: sub.storeName,
          Product: item.productName, Quantity: item.quantity,
          'Unit Price': item.price, 'Line Total': item.total,
          Notes: idx === 0 ? (sub.notes || '') : '',
          'Total Qty': idx === 0 ? sub.totalQuantity : '',
          'Total Revenue': idx === 0 ? sub.totalRevenue : '',
          'Submitted At': idx === 0 ? new Date(sub.createdAt).toLocaleString() : ''
        };
        // Append question answers for first row
        if (idx === 0 && sub.answers?.length) {
          sub.answers.forEach(a => { row[a.questionText] = a.answer; });
        }
        rows.push(row);
      });
      if (sub.items.length === 0) {
        const row = { Date: sub.date, Worker: sub.workerName, Store: sub.storeName, 'Total Qty': sub.totalQuantity, 'Total Revenue': sub.totalRevenue, 'Submitted At': new Date(sub.createdAt).toLocaleString() };
        if (sub.answers?.length) sub.answers.forEach(a => { row[a.questionText] = a.answer; });
        rows.push(row);
      }
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Submissions');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=softsense-${Date.now()}.xlsx`);
    res.send(buf);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/csv', auth, async (req, res) => {
  try {
    const subs = await Submission.find(getQuery(req.query)).sort({ date: -1 });
    const rows = [];
    subs.forEach(sub => {
      sub.items.forEach((item, idx) => {
        const row = [sub.date, sub.workerName, sub.storeName, item.productName, item.quantity, item.price, item.total,
          idx === 0 ? (sub.notes || '') : '', idx === 0 ? sub.totalQuantity : '', idx === 0 ? sub.totalRevenue : '', idx === 0 ? new Date(sub.createdAt).toISOString() : ''];
        rows.push(row);
      });
    });
    const header = ['Date', 'Worker', 'Store', 'Product', 'Quantity', 'Unit Price', 'Line Total', 'Notes', 'Total Qty', 'Total Revenue', 'Submitted At'];
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=softsense-${Date.now()}.csv`);
    res.send(csv);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
