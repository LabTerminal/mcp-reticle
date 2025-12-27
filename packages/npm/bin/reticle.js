#!/usr/bin/env node

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PLATFORMS = {
  'darwin-arm64': '@reticle/darwin-arm64',
  'darwin-x64': '@reticle/darwin-x64',
  'linux-x64': '@reticle/linux-x64',
  'linux-arm64': '@reticle/linux-arm64',
  'win32-x64': '@reticle/win32-x64',
};

function getBinaryPath() {
  const platform = `${process.platform}-${process.arch}`;
  const packageName = PLATFORMS[platform];

  if (!packageName) {
    console.error(`Unsupported platform: ${platform}`);
    console.error(`Supported: ${Object.keys(PLATFORMS).join(', ')}`);
    process.exit(1);
  }

  try {
    const packagePath = require.resolve(`${packageName}/package.json`);
    const packageDir = path.dirname(packagePath);
    const binaryName = process.platform === 'win32' ? 'reticle.exe' : 'reticle';
    return path.join(packageDir, 'bin', binaryName);
  } catch (e) {
    console.error(`Binary package not found: ${packageName}`);
    console.error('Try reinstalling: npm install -g reticle');
    process.exit(1);
  }
}

const binary = getBinaryPath();
const args = process.argv.slice(2);

try {
  execFileSync(binary, args, { stdio: 'inherit' });
} catch (e) {
  process.exit(e.status || 1);
}
