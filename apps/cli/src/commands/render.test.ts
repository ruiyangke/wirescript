/**
 * Tests for the render command
 */

import { mkdirSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EXIT_CODES } from '../utils/errors.js';
import { render } from './render.js';

describe('render', () => {
  const testDir = join(tmpdir(), 'wirescript-cli-render-test');
  const testFile = join(testDir, 'test.wire');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      unlinkSync(testFile);
    } catch {
      // File might not exist
    }
    try {
      rmdirSync(testDir);
    } catch {
      // Dir might not exist or not empty
    }
  });

  it('renders HTML for a valid WireScript file', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home "Home"
    (text "Hello World")))`
    );

    const result = await render(testFile);

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(result.format).toBe('html');
    expect(result.screenId).toBe('home');
    expect(result.screenName).toBe('Home');
    expect(result.content).toContain('Hello World');
  });

  it('renders specific screen by ID', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home "Home"
    (text "Home content"))
  (screen settings "Settings"
    (text "Settings content")))`
    );

    const result = await render(testFile, { screen: 'settings' });

    expect(result.success).toBe(true);
    expect(result.screenId).toBe('settings');
    expect(result.screenName).toBe('Settings');
    expect(result.content).toContain('Settings content');
  });

  it('throws error for non-existent screen', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home "Home"
    (text "Hello")))`
    );

    await expect(render(testFile, { screen: 'nonexistent' })).rejects.toThrow('Screen not found');
  });

  it('applies theme correctly', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home
    (button "Click" :primary)))`
    );

    const result = await render(testFile, { theme: 'brutalism' });

    expect(result.success).toBe(true);
    expect(result.content).toContain('bg-primary');
  });

  it('generates standalone HTML when option is set', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home
    (text "Content")))`
    );

    const result = await render(testFile, { standalone: true });

    expect(result.success).toBe(true);
    expect(result.content).toContain('<!DOCTYPE html>');
    expect(result.content).toContain('<html');
    expect(result.content).toContain('<head>');
    expect(result.content).toContain('Content');
  });

  it('respects custom dimensions', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home
    (text "Hello")))`
    );

    const result = await render(testFile, { width: '800', height: '600' });

    expect(result.success).toBe(true);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('throws error for invalid format', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home (text "Hello")))`
    );

    await expect(render(testFile, { format: 'invalid' })).rejects.toThrow('Invalid format');
  });

  it('throws error for invalid width', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home (text "Hello")))`
    );

    await expect(render(testFile, { width: 'abc' })).rejects.toThrow('Invalid width');
  });

  it('throws error for PNG format without output path', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home (text "Hello")))`
    );

    await expect(render(testFile, { format: 'png' })).rejects.toThrow(
      'PNG format requires -o/--output file path'
    );
  });

  it('accepts PNG format with output path', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home (text "Hello")))`
    );

    // This will fail if Playwright is not installed, which is expected
    // We're testing that the early validation passes when output is provided
    try {
      await render(testFile, { format: 'png', output: join(testDir, 'out.png') });
    } catch (error) {
      // If it fails, it should be because Playwright is not installed, not because of output validation
      expect((error as Error).message).toContain('Playwright');
    }
  });

  it('validates format case-sensitively', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home (text "Hello")))`
    );

    // Uppercase formats should be rejected
    await expect(render(testFile, { format: 'HTML' })).rejects.toThrow('Invalid format');
    await expect(render(testFile, { format: 'PNG' })).rejects.toThrow('Invalid format');
  });

  it('returns correct format in result', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home (text "Hello")))`
    );

    const htmlResult = await render(testFile, { format: 'html' });
    expect(htmlResult.format).toBe('html');

    const defaultResult = await render(testFile);
    expect(defaultResult.format).toBe('html');
  });
});
