const pool = require('../config/db');

// ─── ApplicationRepo ──────────────────────────────────────────────────────────
// Replaces the Mongoose Application model with plain SQL queries.
// Uses a JOIN to replace Mongoose's .populate('job', '...') behaviour.

/**
 * Get all applications for a user, with job details joined in.
 * Replaces: Application.find({ user }).populate('job', '...')
 */
const findByUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       a.id,
       a.user_id,
       a.job_id,
       a.status,
       a.applied_at,
       a.created_at,
       -- flattened job fields (mirrors Mongoose populate output)
       j.title       AS job_title,
       j.company     AS job_company,
       j.location    AS job_location,
       j.type        AS job_type,
       j.salary      AS job_salary,
       j.icon        AS job_icon,
       j.badge       AS job_badge,
       j.tags        AS job_tags
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.user_id = $1
     ORDER BY a.applied_at DESC`,
    [userId]
  );

  // Shape the result to match the old Mongoose populated format
  return rows.map((r) => ({
    id: r.id,
    _id: r.id,            // backward-compat alias
    user_id: r.user_id,
    status: r.status,
    appliedAt: r.applied_at,
    createdAt: r.created_at,
    job: {
      _id: r.job_id,
      id: r.job_id,
      title:    r.job_title,
      company:  r.job_company,
      location: r.job_location,
      type:     r.job_type,
      salary:   r.job_salary,
      icon:     r.job_icon,
      badge:    r.job_badge,
      tags:     r.job_tags,
    },
  }));
};

/**
 * Check for a duplicate application.
 * Replaces: Application.findOne({ user, job })
 */
const findOne = async ({ userId, jobId }) => {
  const { rows } = await pool.query(
    'SELECT id FROM applications WHERE user_id = $1 AND job_id = $2 LIMIT 1',
    [userId, jobId]
  );
  return rows[0] || null;
};

/**
 * Find an application by ID that belongs to a specific user (ownership check).
 * Replaces: Application.findOne({ _id: id, user: userId })
 */
const findByIdAndUser = async (id, userId) => {
  const { rows } = await pool.query(
    'SELECT id FROM applications WHERE id = $1 AND user_id = $2 LIMIT 1',
    [id, userId]
  );
  return rows[0] || null;
};

/**
 * Insert a new application.
 * Replaces: Application.create({ user, job })
 * Returns the new application with job fields populated via a second query.
 */
const create = async ({ userId, jobId }) => {
  const { rows } = await pool.query(
    `INSERT INTO applications (user_id, job_id)
     VALUES ($1, $2)
     RETURNING id, user_id, job_id, status, applied_at, created_at`,
    [userId, jobId]
  );

  const app = rows[0];

  // Fetch joined job data to match the old populated response shape
  const populated = await findByUser(userId);
  return populated.find((a) => a.id === app.id) || app;
};

/**
 * Delete an application by ID.
 * Replaces: application.deleteOne()
 */
const deleteById = async (id) => {
  await pool.query('DELETE FROM applications WHERE id = $1', [id]);
};

module.exports = { findByUser, findOne, findByIdAndUser, create, deleteById };
