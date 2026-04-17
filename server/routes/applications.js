const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── GET /api/applications ────────────────────────────────────────────────────
// Returns all applications for the logged-in user, with job details populated
router.get('/', async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate('job', 'title company location type salary icon badge tags')
      .sort({ appliedAt: -1 })
      .lean();

    res.status(200).json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
});

// ─── POST /api/applications ───────────────────────────────────────────────────
// Apply to a job
router.post('/', async (req, res) => {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ success: false, message: 'jobId is required' });
  }

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Check for duplicate application (unique index will also catch this)
    const existing = await Application.findOne({ user: req.user._id, job: jobId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to this job' });
    }

    const application = await Application.create({
      user: req.user._id,
      job: jobId,
    });

    const populated = await application.populate('job', 'title company location type salary icon badge');

    res.status(201).json({ success: true, application: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already applied to this job' });
    }
    res.status(500).json({ success: false, message: 'Server error applying to job' });
  }
});

// ─── DELETE /api/applications/:id ────────────────────────────────────────────
// Remove an application (only the applicant can do this)
router.delete('/:id', async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, user: req.user._id });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await application.deleteOne();
    res.status(200).json({ success: true, message: 'Application removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error removing application' });
  }
});

module.exports = router;
