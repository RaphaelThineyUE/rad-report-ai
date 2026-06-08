#!/usr/bin/env node
// Increments the patch segment of version in the root package.json before each build.
// e.g. 0.0.3 -> 0.0.4
const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const pkgPath = resolve(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

const [major, minor, patch] = pkg.version.split('.').map(Number);
pkg.version = `${major}.${minor}.${patch + 1}`;

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Version bumped to ${pkg.version}`);
