-- ============================================================
-- CareerNest Job Portal – PostgreSQL Schema
-- Run this once against your database (local or AWS RDS):
--   psql -h <host> -U <user> -d <dbname> -f schema.sql
-- ============================================================

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   TEXT         NOT NULL,             -- bcrypt hash stored; never plain text
  role       VARCHAR(20)  NOT NULL DEFAULT 'seeker'
               CHECK (role IN ('seeker', 'admin')),
  avatar     TEXT         NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── JOBS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id          SERIAL PRIMARY KEY,
  title       TEXT        NOT NULL,
  company     TEXT        NOT NULL,
  location    TEXT        NOT NULL,
  type        VARCHAR(20) NOT NULL
                CHECK (type IN ('intern', 'full', 'remote', 'contract')),
  category    VARCHAR(20) NOT NULL DEFAULT 'other'
                CHECK (category IN ('tech', 'design', 'data', 'marketing', 'finance', 'other')),
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  salary      TEXT        NOT NULL DEFAULT '',
  badge       VARCHAR(10) NOT NULL DEFAULT 'new'
                CHECK (badge IN ('hot', 'new', '')),
  icon        TEXT        NOT NULL DEFAULT '🏢',
  description TEXT        NOT NULL DEFAULT '',
  posted_by   INT REFERENCES users(id) ON DELETE SET NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index: replaces MongoDB text index on title/company/tags
CREATE INDEX IF NOT EXISTS idx_jobs_fts ON jobs
  USING GIN (
    to_tsvector('english',
      title || ' ' || company || ' ' || array_to_string(tags, ' ')
    )
  );

-- Index for active jobs listing (most common query)
CREATE INDEX IF NOT EXISTS idx_jobs_active_created ON jobs (is_active, created_at DESC);

-- ─── APPLICATIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id         SERIAL PRIMARY KEY,
  user_id    INT         NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  job_id     INT         NOT NULL REFERENCES jobs(id)   ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL DEFAULT 'applied'
               CHECK (status IN ('applied', 'reviewing', 'accepted', 'rejected')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)   -- prevents duplicate applications (same as Mongoose unique index)
);

-- Index for fast lookup of a user's applications
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications (user_id, applied_at DESC);
