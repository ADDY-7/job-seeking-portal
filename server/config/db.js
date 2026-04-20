const { Pool } = require('pg');

// ─── PostgreSQL Connection Pool ────────────────────────────────────────────────
// Compatible with AWS RDS PostgreSQL.
// All config is read from environment variables — no hard-coded credentials.

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'careernest_portal',
  max:      10,                // max connections in pool
  idleTimeoutMillis: 30000,   // close idle connections after 30 s
  connectionTimeoutMillis: 5000, // fail fast if DB unreachable

  // SSL required on AWS RDS (and any production environment)
  // rejectUnauthorized: false allows self-signed RDS certs
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// Surface pool-level errors to stderr so they are never silent
pool.on('error', (err) => {
  console.error('❌  Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
