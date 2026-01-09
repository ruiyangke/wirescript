/**
 * Tests for the list command
 */

import { mkdirSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EXIT_CODES } from '../utils/errors.js';
import { formatListResult, list } from './list.js';

describe('list', () => {
  const testDir = join(tmpdir(), 'wirescript-cli-list-test');
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

  it('lists screens from a valid WireScript file', async () => {
    writeFileSync(
      testFile,
      `(wire
  (meta :title "Test")
  (screen home "Home"
    (text "Hello World"))
  (screen settings "Settings" :tablet
    (text "Settings content")))`
    );

    const result = await list(testFile);

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(result.screens).toHaveLength(2);
    expect(result.screens[0]).toEqual({
      id: 'home',
      name: 'Home',
      viewport: 'desktop',
    });
    expect(result.screens[1]).toEqual({
      id: 'settings',
      name: 'Settings',
      viewport: 'tablet',
    });
  });

  it('returns empty screens for file with errors', async () => {
    writeFileSync(testFile, 'not valid wirescript');

    const result = await list(testFile);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(EXIT_CODES.VALIDATION_ERROR);
    expect(result.screens).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles file with one screen', async () => {
    writeFileSync(testFile, '(wire (meta :title "Test") (screen home (text "Hello")))');

    const result = await list(testFile);

    expect(result.success).toBe(true);
    expect(result.screens).toHaveLength(1);
  });
});

describe('formatListResult', () => {
  it('formats as JSON when json option is true', () => {
    const result = {
      success: true,
      exitCode: EXIT_CODES.SUCCESS,
      file: 'test.wire',
      screens: [{ id: 'home', name: 'Home', viewport: 'desktop' }],
      errors: [],
    };

    const output = formatListResult(result, { json: true });
    const parsed = JSON.parse(output);

    expect(parsed).toEqual([{ id: 'home', name: 'Home', viewport: 'desktop' }]);
  });

  it('formats as table for console output', () => {
    const result = {
      success: true,
      exitCode: EXIT_CODES.SUCCESS,
      file: 'test.wire',
      screens: [
        { id: 'home', name: 'Home Page', viewport: 'desktop' },
        { id: 'settings', name: 'Settings', viewport: 'tablet' },
      ],
      errors: [],
    };

    const output = formatListResult(result);

    expect(output).toContain('home');
    expect(output).toContain('Home Page');
    expect(output).toContain('desktop');
    expect(output).toContain('settings');
    expect(output).toContain('tablet');
  });

  it('shows error message for failed parse', () => {
    const result = {
      success: false,
      exitCode: EXIT_CODES.VALIDATION_ERROR,
      file: 'test.wire',
      screens: [],
      errors: [{ message: 'Syntax error', line: 1, column: 5 }],
    };

    const output = formatListResult(result);

    expect(output).toContain('Failed to parse');
    expect(output).toContain('test.wire');
    expect(output).toContain('Syntax error');
  });

  it('shows no screens message when empty', () => {
    const result = {
      success: true,
      exitCode: EXIT_CODES.SUCCESS,
      file: 'test.wire',
      screens: [],
      errors: [],
    };

    const output = formatListResult(result);

    expect(output).toBe('No screens found');
  });
});
