#!/usr/bin/env node
import { readFileSync } from 'fs';
import { $ } from 'bun';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = pkg.version;

await $`bun build ./src/index.ts --target=node --outfile dist/index.js --define process.env.PKG_VERSION='"${version}"'`;
