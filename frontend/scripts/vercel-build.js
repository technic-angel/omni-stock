#!/usr/bin/env node
/**
 * Vercel Build Script
 *
 * This script sets VITE_RENDER_PR_NUMBER from VERCEL_GIT_PULL_REQUEST_ID
 * before running the Vite build.
 *
 * IMPORTANT: Vercel must have "Automatically expose System Environment Variables"
 * enabled in Project Settings → Environment Variables for this to work.
 */
import { execSync } from 'child_process'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🏗️  Omni-Stock Frontend Build')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Debug: Log all Vercel-related environment variables
console.log('\n🔍 Vercel Environment Variables:')
const vercelVars = Object.keys(process.env)
  .filter((key) => key.startsWith('VERCEL'))
  .sort()

if (vercelVars.length === 0) {
  console.log('   ⚠️  No VERCEL_* variables found!')
  console.log('   💡 Enable "Automatically expose System Environment Variables"')
  console.log('      in Vercel Project Settings → Environment Variables')
} else {
  vercelVars.forEach((key) => console.log(`   ${key}=${process.env[key]}`))
}

// Also check for any VITE_* variables already set
console.log('\n🔍 Existing VITE_* Environment Variables:')
const viteVars = Object.keys(process.env)
  .filter((key) => key.startsWith('VITE_'))
  .sort()

if (viteVars.length === 0) {
  console.log('   (none)')
} else {
  viteVars.forEach((key) => console.log(`   ${key}=${process.env[key]}`))
}

// Determine the PR number from various sources
const prNumber =
  process.env.VITE_RENDER_PR_NUMBER || // Manual override
  process.env.VERCEL_GIT_PULL_REQUEST_ID // Vercel system var

console.log('\n📦 Build Configuration:')

if (prNumber) {
  // Set for Vite to pick up
  process.env.VITE_RENDER_PR_NUMBER = prNumber

  const backendUrl = `https://omni-stock-pr-${prNumber}.onrender.com/api/v1`
  console.log(`   Environment: PR Preview #${prNumber}`)
  console.log(`   Backend URL: ${backendUrl}`)
} else {
  console.log('   Environment: Production')
  console.log('   Backend URL: https://omni-stock.onrender.com/api/v1')
  console.log('   ℹ️  No PR number detected - using production backend')
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🚀 Starting Vite build...\n')

// Run vite build with the current process.env (which now includes VITE_RENDER_PR_NUMBER)
try {
  execSync('npx vite build', {
    stdio: 'inherit',
    env: process.env, // Pass the modified process.env
  })
  console.log('\n✅ Build completed successfully!')
} catch (error) {
  console.error('\n❌ Build failed!')
  process.exit(1)
}
