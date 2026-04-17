#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CareerNest – S3 Frontend Deploy Script
# Run this locally (Windows: use Git Bash or WSL) after every frontend change.
# Prerequisites: AWS CLI installed and configured (aws configure)
# ═══════════════════════════════════════════════════════════════════════════════

# ── CONFIG – Fill these in after creating AWS resources ───────────────────────
S3_BUCKET="careernest-frontend-YOUR-ACCOUNT-ID"    # e.g. careernest-frontend-123456789012
CLOUDFRONT_DIST_ID="YOUR_CLOUDFRONT_DISTRIBUTION_ID"  # e.g. E1ABCDEFGHIJKL
REGION="ap-south-1"

# ── 1. Build React app ────────────────────────────────────────────────────────
echo "📦 Building React app..."
cd "$(dirname "$0")/../client"
npm run build

# ── 2. Upload to S3 ───────────────────────────────────────────────────────────
echo "☁️  Uploading to S3..."
aws s3 sync dist/ "s3://$S3_BUCKET/" \
    --region "$REGION" \
    --delete \
    --cache-control "public,max-age=31536000,immutable" \
    --exclude "index.html"

# index.html must NOT be cached so new deployments are picked up instantly
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
    --region "$REGION" \
    --cache-control "no-cache,no-store,must-revalidate"

# ── 3. Invalidate CloudFront cache ────────────────────────────────────────────
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DIST_ID" \
    --paths "/*"

echo "✅ Deployment complete!"
echo "Your app will be live in ~1-2 minutes at your CloudFront URL."
