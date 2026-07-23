#!/usr/bin/env bash
set -euo pipefail

echo "Building production bundle..."
npm run build

echo "Deploying to GitHub Pages..."

# Configure git for GitHub Pages deploy
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Deploy to gh-pages branch
npx gh-pages -d dist -u "github-actions[bot] <github-actions[bot]@users.noreply.github.com>"

echo "Deployment complete!"
