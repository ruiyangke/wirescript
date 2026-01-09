#!/usr/bin/env node
/**
 * Generate JSON schema files for documentation.
 *
 * Usage: npx tsx scripts/generate-schemas.ts [output-path]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { exportSchemasJson } from '../src/schema/export.js';

const outputPath = process.argv[2] || 'dist/schemas.json';
const absolutePath = path.resolve(process.cwd(), outputPath);

// Ensure directory exists
const dir = path.dirname(absolutePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Generate and write
const json = exportSchemasJson();
fs.writeFileSync(absolutePath, json, 'utf-8');

console.log(`✓ Schema exported to ${outputPath}`);
console.log(`  Size: ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
