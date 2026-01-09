/**
 * Tests for the verify command
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { verify } from './verify.js';
import { EXIT_CODES } from '../utils/errors.js';

describe('verify', () => {
  const testDir = join(tmpdir(), 'wirescript-cli-test');
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

  it('returns success for valid WireScript file', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home "Home"
    (text "Hello World")))`
    );

    const result = await verify(testFile);

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(result.errors).toHaveLength(0);
    expect(result.screens).toHaveLength(1);
    expect(result.screens[0].id).toBe('home');
  });

  it('returns errors for invalid syntax', async () => {
    writeFileSync(testFile, '(wire (meta :title "test") (screen home (text "unclosed');

    const result = await verify(testFile);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(EXIT_CODES.VALIDATION_ERROR);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('extracts screen info correctly', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen dashboard "Dashboard Screen" :mobile
    (text "Mobile content"))
  (screen settings "Settings" :tablet
    (text "Settings content")))`
    );

    const result = await verify(testFile);

    expect(result.success).toBe(true);
    expect(result.screens).toHaveLength(2);
    expect(result.screens[0]).toEqual({
      id: 'dashboard',
      name: 'Dashboard Screen',
      viewport: 'mobile',
    });
    expect(result.screens[1]).toEqual({
      id: 'settings',
      name: 'Settings',
      viewport: 'tablet',
    });
  });

  it('returns empty screens array for file with parse errors', async () => {
    writeFileSync(testFile, 'not valid wirescript syntax');

    const result = await verify(testFile);

    expect(result.success).toBe(false);
    expect(result.screens).toHaveLength(0);
  });

  it('handles complex nested structures', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home
    (card
      (text "Title" :high)
      (text "Description" :low)
      (button "Click" :primary))))`
    );

    const result = await verify(testFile);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
