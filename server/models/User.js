const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ─── UserRepo ─────────────────────────────────────────────────────────────────
// Replaces the Mongoose User model with plain SQL queries.
// All functions are async and return plain JS objects (rows).

/**
 * Find a user by email.
 * includePassword=true to get the hashed password (login flow only).
 */
const findByEmail = async (email, includePassword = false) => {
  const cols = includePassword
    ? 'id, name, email, password, role, avatar, created_at'
    : 'id, name, email, role, avatar, created_at';

  const { rows } = await pool.query(
    `SELECT ${cols} FROM users WHERE email = $1 LIMIT 1`,
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
};

/**
 * Find a user by primary key (never returns password).
 */
const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

/**
 * Create a new user. Hashes the password before inserting.
 * Returns the newly created user row (without password).
 */
const create = async ({ name, email, password }) => {
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'seeker')
     RETURNING id, name, email, role, avatar, created_at`,
    [name.trim(), email.toLowerCase().trim(), hashedPassword]
  );
  return rows[0];
};

/**
 * Compare a plain-text password against a stored bcrypt hash.
 */
const matchPassword = async (plaintext, hash) => {
  return bcrypt.compare(plaintext, hash);
};

module.exports = { findByEmail, findById, create, matchPassword };
