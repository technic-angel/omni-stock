#!/usr/bin/env node
/**
 * Vercel Build Script
 * 
 * This script sets VITE_RENDER_PR_NUMBER from VERCEL_GIT_PULL_REQUEST_ID
 * before running the Vite build.
 */
const { execSync } = require('child_process');

// Get PR number from Vercel's environment
const prNumber = process.env.VERCEL_GIT_PULL_REQUEST_ID;

// Build environment variables
const env = { ...process.env };

if (prNumber) {
  console.log(`📦 Building for PR #${prNumber}`);
  console.log(`   Backend: https://omni-stock-pr-${prNumber}.onrender.com/api/v1`);
  env.VITE_RENDER_PR_NUMBER = prNumber;
} else {
  console.log('📦 Building for production (no PR number)');
}

// Run vite build
try {
  execSync('npx vite build', { 
    stdio: 'inherit',
    env 
  });
} catch (error) {
  process.exit(1);
}
