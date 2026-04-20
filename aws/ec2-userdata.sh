#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CareerNest – EC2 Bootstrap Script (User Data)
# Runs ONCE automatically when the EC2 instance first starts.
# Used by the Launch Template for the Auto Scaling Group.
# Amazon Linux 2023 | Node 20 | PM2 | PostgreSQL backend
# ═══════════════════════════════════════════════════════════════════════════════
set -e
exec > /var/log/careernest-setup.log 2>&1   # Log everything for debugging

echo "========================================"
echo "  CareerNest EC2 Bootstrap Starting..."
echo "========================================"

# ── 1. System Updates ─────────────────────────────────────────────────────────
yum update -y

# ── 2. Install Node.js 20 ─────────────────────────────────────────────────────
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs git

echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# ── 3. Install PM2 (keeps Node running after SSH exits, auto-restarts on crash)
npm install -g pm2

# ── 4. Create app directory ────────────────────────────────────────────────────
mkdir -p /home/ec2-user/careernest
cd /home/ec2-user/careernest

# ── 5. Pull app code from GitHub ──────────────────────────────────────────────
# IMPORTANT: Replace with your actual GitHub username and repo name!
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git .

# ── 6. Fetch secrets from AWS Secrets Manager → write .env ────────────────────
# The IAM role attached to this EC2 (careernest-ec2-role) must have
# secretsmanager:GetSecretValue permission on careernest/prod/env
AWS_REGION="ap-south-1"
SECRET_NAME="careernest/prod/env"

echo "Fetching secrets from Secrets Manager..."
SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$AWS_REGION" \
    --query SecretString \
    --output text)

# Write each key=value pair to .env for the Express server to read
python3 -c "
import json, sys
data = json.loads('''$SECRET_JSON''')
lines = [f'{k}={v}' for k, v in data.items()]
with open('/home/ec2-user/careernest/server/.env', 'w') as f:
    f.write('\n'.join(lines))
print('✅ .env written successfully')
"

# ── 7. Install backend dependencies ───────────────────────────────────────────
cd /home/ec2-user/careernest/server
npm install --omit=dev

# ── 8. Run DB schema (idempotent – safe to run on every boot) ─────────────────
# Source the .env so we have DB_* variables available in this shell
export $(grep -v '^#' .env | xargs)

echo "Applying database schema..."
npx node -e "
const pool = require('./config/db');
const fs   = require('fs');
const sql  = fs.readFileSync('./schema.sql', 'utf8');
pool.query(sql)
  .then(() => { console.log('✅ Schema applied'); pool.end(); })
  .catch(err => { console.error('Schema error:', err.message); pool.end(); });
"

# ── 9. Seed jobs (only if jobs table is empty) ────────────────────────────────
echo "Checking if seed is needed..."
npx node -e "
const pool = require('./config/db');
pool.query('SELECT COUNT(*) FROM jobs').then(r => {
  if (r.rows[0].count === '0') {
    console.log('Seeding jobs...');
    require('child_process').execSync('node seed.js', { stdio: 'inherit' });
  } else {
    console.log('Jobs already seeded, skipping.');
  }
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
"

# ── 10. Start API with PM2 ────────────────────────────────────────────────────
pm2 start server.js --name careernest-api

# Configure PM2 to restart automatically if the instance reboots
env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

# Fix file ownership
chown -R ec2-user:ec2-user /home/ec2-user/careernest

echo "========================================"
echo "  ✅ CareerNest Bootstrap Complete!"
echo "  API running on port 5000"
echo "  ALB health check: GET /api/health"
echo "========================================"
