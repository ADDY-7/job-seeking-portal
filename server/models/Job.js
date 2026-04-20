const pool = require('../config/db');

// ─── JobRepo ──────────────────────────────────────────────────────────────────
// Replaces the Mongoose Job model with plain SQL queries.

/**
 * Get paginated active jobs with optional filters.
 * Replaces: Job.find(query).sort(...).skip(...).limit(...)
 */
const findAll = async ({ search, type, category, limit = 20, offset = 0 }) => {
  const values  = [];
  const clauses = ['j.is_active = TRUE'];

  if (type && type !== 'all') {
    values.push(type);
    clauses.push(`j.type = $${values.length}`);
  }

  if (category && category !== 'all') {
    values.push(category);
    clauses.push(`j.category = $${values.length}`);
  }

  if (search) {
    // PostgreSQL full-text search – replaces MongoDB $text index
    values.push(search);
    clauses.push(
      `to_tsvector('english', j.title || ' ' || j.company || ' ' || array_to_string(j.tags, ' '))
       @@ plainto_tsquery('english', $${values.length})`
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  values.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT id, title, company, location, type, category, tags,
            salary, badge, icon, description, posted_by, is_active,
            created_at, updated_at
     FROM jobs j
     ${where}
     ORDER BY j.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows;
};

/**
 * Count matching jobs for pagination.
 * Replaces: Job.countDocuments(query)
 */
const count = async ({ search, type, category }) => {
  const values  = [];
  const clauses = ['j.is_active = TRUE'];

  if (type && type !== 'all') {
    values.push(type);
    clauses.push(`j.type = $${values.length}`);
  }

  if (category && category !== 'all') {
    values.push(category);
    clauses.push(`j.category = $${values.length}`);
  }

  if (search) {
    values.push(search);
    clauses.push(
      `to_tsvector('english', j.title || ' ' || j.company || ' ' || array_to_string(j.tags, ' '))
       @@ plainto_tsquery('english', $${values.length})`
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM jobs j ${where}`,
    values
  );
  return parseInt(rows[0].total, 10);
};

/**
 * Find a single job by ID.
 * Replaces: Job.findById(id)
 */
const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, title, company, location, type, category, tags,
            salary, badge, icon, description, posted_by, is_active,
            created_at, updated_at
     FROM jobs WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Insert a new job.
 * Replaces: Job.create({ ...req.body, postedBy: req.user._id })
 */
const create = async (data, postedBy) => {
  const {
    title, company, location, type,
    category = 'other', tags = [], salary = '',
    badge = 'new', icon = '🏢', description = '',
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO jobs
       (title, company, location, type, category, tags, salary, badge, icon, description, posted_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [title, company, location, type, category, tags, salary, badge, icon, description, postedBy || null]
  );
  return rows[0];
};

/**
 * Delete a job by ID.
 * Replaces: Job.findByIdAndDelete(id)
 */
const deleteById = async (id) => {
  const { rows } = await pool.query(
    'DELETE FROM jobs WHERE id = $1 RETURNING id',
    [id]
  );
  return rows[0] || null; // null means not found
};

module.exports = { findAll, count, findById, create, deleteById };
