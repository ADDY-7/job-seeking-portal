#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CareerNest – EC2 Bootstrap Script (User Data)
# Runs ONCE automatically when the EC2 instance first starts.
# Amazon Linux 2023 | Node 20 | PM2
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
echo "NPM version: $(npm -v)"

# ── 3. Install PM2 (process manager – keeps Node running after SSH exits) ──────
npm install -g pm2

# ── 4. Create app directory ────────────────────────────────────────────────────
mkdir -p /home/ec2-user/careernest
cd /home/ec2-user/careernest

# ── 5. Pull app code from GitHub ──────────────────────────────────────────────
# IMPORTANT: Replace <YOUR_GITHUB_USERNAME> and <YOUR_REPO_NAME> before using!
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git .

# ── 6. Fetch secrets from AWS Secrets Manager → write .env ────────────────────
# The EC2 IAM role must have permission to read this secret.
AWS_REGION="ap-south-1"    # Change to your region if different
SECRET_NAME="careernest/prod/env"

echo "Fetching secrets from Secrets Manager..."
SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$AWS_REGION" \
    --query SecretString \
    --output text)

# Write each key=value pair to .env
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

# ── 8. Start with PM2 ─────────────────────────────────────────────────────────
pm2 start server.js --name careernest-api

# Configure PM2 to restart automatically if the instance reboots
pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

# Fix file ownership
chown -R ec2-user:ec2-user /home/ec2-user/careernest

echo "========================================"
echo "  ✅ CareerNest Bootstrap Complete!"
echo "  API running on port 5000"
echo "========================================"
