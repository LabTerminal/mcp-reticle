#!/usr/bin/env node

// Validates binary is available after install
const { execFileSync } = require('child_process');
const path = require('path');

const PLATFORMS = {
  'darwin-arm64': '@reticle/darwin-arm64',
  'darwin-x64': '@reticle/darwin-x64',
  'linux-x64': '@reticle/linux-x64',
  'linux-arm64': '@reticle/linux-arm64',
  'win32-x64': '@reticle/win32-x64',
};

const platform = `${process.platform}-${process.arch}`;
const packageName = PLATFORMS[platform];

if (!packageName) {
  console.warn(`\n  Reticle: No prebuilt binary for ${platform}`);
  console.warn('   You can build from source: cargo install reticle\n');
  process.exit(0);
}

try {
  require.resolve(`${packageName}/package.json`);
  console.log('Reticle installed successfully');
} catch (e) {
  console.warn(`\n  Binary package ${packageName} not installed`);
  console.warn('   This may happen on unsupported platforms.');
  console.warn('   Build from source: cargo install reticle\n');
}
