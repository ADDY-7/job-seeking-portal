const express = require('express');
const AppRepo = require('../models/Application');
const JobRepo = require('../models/Job');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── GET /api/applications ────────────────────────────────────────────────────
// Returns all applications for the logged-in user, with job details joined in.
// Replaces: Application.find({ user }).populate('job', '...')
router.get('/', async (req, res) => {
  try {
    const applications = await AppRepo.findByUser(req.user.id);
    res.status(200).json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
});

// ─── POST /api/applications ───────────────────────────────────────────────────
// Apply to a job.
router.post('/', async (req, res) => {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ success: false, message: 'jobId is required' });
  }

  try {
    // Replaces: Job.findById(jobId)
    const job = await JobRepo.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Replaces: Application.findOne({ user: req.user._id, job: jobId })
    const existing = await AppRepo.findOne({ userId: req.user.id, jobId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to this job' });
    }

    // Replaces: Application.create({ user, job }) + .populate('job', '...')
    const application = await AppRepo.create({ userId: req.user.id, jobId });
    res.status(201).json({ success: true, application });
  } catch (err) {
    // PostgreSQL unique-constraint violation code
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Already applied to this job' });
    }
    res.status(500).json({ success: false, message: 'Server error applying to job' });
  }
});

// ─── DELETE /api/applications/:id ────────────────────────────────────────────
// Remove an application (only the applicant can do this).
router.delete('/:id', async (req, res) => {
  try {
    // Replaces: Application.findOne({ _id, user }) – ownership check
    const application = await AppRepo.findByIdAndUser(req.params.id, req.user.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Replaces: application.deleteOne()
    await AppRepo.deleteById(req.params.id);
    res.status(200).json({ success: true, message: 'Application removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error removing application' });
  }
});

module.exports = router;
