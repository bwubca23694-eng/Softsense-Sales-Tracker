const router = require('express').Router();
const XLSX = require('xlsx');
const Submission = require('../models/Submission');
const Product = require('../models/Product');
const Question = require('../models/Question');
const auth = require('../middleware/auth');

const buildQuery = (q) => {
  const query = {};
  if (q.worker) query.worker = q.worker;
  if (q.store) query.store = q.store;
  if (q.startDate || q.endDate) {
    query.date = {};
    if (q.startDate) query.date.$gte = q.startDate;
    if (q.endDate) query.date.$lte = q.endDate;
  }
  // today filter from submissions page
  if (q.todayOnly === 'true') {
    query.date = new Date().toISOString().split('T')[0];
  }
  return query;
};

// Build flat rows: one row per submission
// Columns: Worker | Store | Date | Submitted At | [Product A Qty] | [Product B Qty] | ... | [Q1] | [Q2] | ... | Notes | Total Qty | Total Revenue
const buildRows = async (submissions) => {
  // Collect all unique product names and question texts across submissions
  const productSet = new Set();
  const questionSet = new Map(); // text -> type

  submissions.forEach(sub => {
    sub.items.forEach(item => productSet.add(item.productName));
    sub.answers.forEach(ans => questionSet.set(ans.questionText, ans.questionType));
  });

  // Sort for consistent column order
  const allProducts = [...productSet].sort();
  const allQuestions = [...questionSet.keys()].sort();

  const rows = submissions.map(sub => {
    const row = {
      'Worker': sub.workerName,
      'Store': sub.storeName,
      'Date': sub.date,
      'Submitted At': new Date(sub.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    };

    // One column per product (quantity sold)
    allProducts.forEach(pName => {
      const item = sub.items.find(i => i.productName === pName);
      row[`${pName} (Qty)`] = item ? item.quantity : 0;
      row[`${pName} (Revenue ₹)`] = item ? (item.total || 0) : 0;
    });

    // One column per question
    allQuestions.forEach(qText => {
      const ans = sub.answers.find(a => a.questionText === qText);
      row[qText] = ans ? ans.answer : '';
    });

    // Totals at the end
    row['Notes'] = sub.notes || '';
    row['Total Qty'] = sub.totalQuantity;
    row['Total Revenue (₹)'] = sub.totalRevenue || 0;

    return row;
  });

  return { rows, allProducts, allQuestions };
};

// ── Excel export ───────────────────────────────────────────────────────────
router.get('/excel', auth, async (req, res) => {
  try {
    const subs = await Submission.find(buildQuery(req.query)).sort({ workerName: 1, date: 1 });
    const { rows, allProducts, allQuestions } = await buildRows(subs);

    const wb = XLSX.utils.book_new();

    // ─ Main sheet: Submissions ─
    const ws = XLSX.utils.json_to_sheet(rows);

    // Dynamic column widths
    const baseCols = [{ wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 18 }]; // Worker, Store, Date, Submitted At
    const productCols = allProducts.flatMap(() => [{ wch: 14 }, { wch: 16 }]);
    const questionCols = allQuestions.map(q => ({ wch: Math.max(q.length + 4, 16) }));
    const endCols = [{ wch: 25 }, { wch: 10 }, { wch: 16 }]; // Notes, Total Qty, Total Revenue
    ws['!cols'] = [...baseCols, ...productCols, ...questionCols, ...endCols];

    // Freeze top row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, 'Submissions');

    // ─ Summary sheet: Worker Totals ─
    const workerMap = {};
    subs.forEach(sub => {
      if (!workerMap[sub.workerName]) workerMap[sub.workerName] = { Worker: sub.workerName, Submissions: 0, 'Total Qty': 0, 'Total Revenue (₹)': 0 };
      workerMap[sub.workerName].Submissions += 1;
      workerMap[sub.workerName]['Total Qty'] += sub.totalQuantity;
      workerMap[sub.workerName]['Total Revenue (₹)'] += sub.totalRevenue || 0;
    });
    const summaryRows = Object.values(workerMap).sort((a, b) => b['Total Revenue (₹)'] - a['Total Revenue (₹)']);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Worker Summary');

    // ─ Product summary sheet ─
    const prodMap = {};
    subs.forEach(sub => {
      sub.items.forEach(item => {
        if (!prodMap[item.productName]) prodMap[item.productName] = { Product: item.productName, 'Total Qty': 0, 'Total Revenue (₹)': 0 };
        prodMap[item.productName]['Total Qty'] += item.quantity;
        prodMap[item.productName]['Total Revenue (₹)'] += item.total || 0;
      });
    });
    const prodRows = Object.values(prodMap).sort((a, b) => b['Total Qty'] - a['Total Qty']);
    const wsProd = XLSX.utils.json_to_sheet(prodRows);
    wsProd['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsProd, 'Product Summary');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=softsense-export-${Date.now()}.xlsx`);
    res.send(buf);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── CSV export ─────────────────────────────────────────────────────────────
router.get('/csv', auth, async (req, res) => {
  try {
    const subs = await Submission.find(buildQuery(req.query)).sort({ workerName: 1, date: 1 });
    const { rows } = await buildRows(subs);
    if (rows.length === 0) { res.setHeader('Content-Type', 'text/csv'); return res.send('No data'); }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=softsense-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
