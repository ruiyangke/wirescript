/**
 * Tests for the build command
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EXIT_CODES } from '../utils/errors.js';
import { build } from './build.js';

describe('build', () => {
  const testDir = join(tmpdir(), 'wirescript-cli-build-test');
  const testFile = join(testDir, 'test.wire');
  const outputDir = join(testDir, 'output');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Dir might not exist
    }
  });

  it('builds documentation site from WireScript file', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home "Home"
    (text "Home content"))
  (screen settings "Settings"
    (text "Settings content")))`
    );

    const result = await build(testFile, { output: outputDir });

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(result.screens).toBe(2);
    expect(result.files).toContain('home.html');
    expect(result.files).toContain('settings.html');
    expect(result.files).toContain('index.html');
  });

  it('creates output files', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home "Home"
    (text "Hello World")))`
    );

    await build(testFile, { output: outputDir });

    expect(existsSync(join(outputDir, 'home.html'))).toBe(true);
    expect(existsSync(join(outputDir, 'index.html'))).toBe(true);

    const homeContent = readFileSync(join(outputDir, 'home.html'), 'utf-8');
    expect(homeContent).toContain('Hello World');
    expect(homeContent).toContain('<!DOCTYPE html>');
  });

  it('creates index.html redirect', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen first "First"
    (text "First screen")))`
    );

    await build(testFile, { output: outputDir });

    const indexContent = readFileSync(join(outputDir, 'index.html'), 'utf-8');
    expect(indexContent).toContain('first.html');
    expect(indexContent).toContain('Redirecting');
  });

  it('applies custom title', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home "Home"
    (text "Content")))`
    );

    await build(testFile, { output: outputDir, title: 'My Docs' });

    const homeContent = readFileSync(join(outputDir, 'home.html'), 'utf-8');
    expect(homeContent).toContain('My Docs');
  });

  it('builds without sidebar when option is false', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home "Home"
    (text "Content")))`
    );

    await build(testFile, { output: outputDir, sidebar: false });

    const homeContent = readFileSync(join(outputDir, 'home.html'), 'utf-8');
    // Should be standalone format without sidebar navigation elements
    expect(homeContent).not.toContain('class="sidebar"');
    expect(homeContent).not.toContain('sidebar-nav');
    expect(homeContent).toContain('wireframe-container');
  });

  it('throws error for invalid WireScript file', async () => {
    writeFileSync(testFile, 'not valid wirescript');

    await expect(build(testFile, { output: outputDir })).rejects.toThrow();
  });

  it('uses brutalism theme by default', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home
    (button "Click" :primary)))`
    );

    await build(testFile, { output: outputDir });

    const homeContent = readFileSync(join(outputDir, 'home.html'), 'utf-8');
    // Brutalism theme uses specific styling
    expect(homeContent).toContain('bg-primary');
  });
});
