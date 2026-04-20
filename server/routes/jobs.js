const express = require('express');
const JobRepo = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/jobs ─────────────────────────────────────────────────────────────
// Public – supports ?search=, ?type=, ?category=, ?page=, ?limit=
router.get('/', async (req, res) => {
  try {
    const { search, type, category, page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const filters = { search, type, category, limit: Number(limit), offset };

    // Replaces: Job.find(query).sort(...).skip(...).limit(...) + Job.countDocuments()
    const [jobs, total] = await Promise.all([
      JobRepo.findAll(filters),
      JobRepo.count({ search, type, category }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
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
    // Replaces: Job.findById(req.params.id)
    const job = await JobRepo.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.status(200).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /api/jobs (admin only) ──────────────────────────────────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    // Replaces: Job.create({ ...req.body, postedBy: req.user._id })
    const job = await JobRepo.create(req.body, req.user.id);
    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/jobs/:id (admin only) ───────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Replaces: Job.findByIdAndDelete(req.params.id)
    const job = await JobRepo.deleteById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.status(200).json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
