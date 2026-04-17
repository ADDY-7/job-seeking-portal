const express = require('express');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/jobs ─────────────────────────────────────────────────────────────
// Public – supports ?search=, ?type=, ?category=, ?page=, ?limit=
router.get('/', async (req, res) => {
  try {
    const { search, type, category, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    // Full-text search (uses the text index on title/company/tags)
    if (search) {
      query.$text = { $search: search };
    }

    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Job.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      jobs,
    });
  } catch (err) {
    console.error('Jobs fetch error:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching jobs' });
  }
});

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.status(200).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /api/jobs (admin only) ──────────────────────────────────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/jobs/:id (admin only) ───────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.status(200).json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
