/**
 * render command - Render WireScript files to HTML or PNG
 */

import { createWriteStream, writeFileSync } from 'node:fs';
import { renderScreen } from '../core/renderer.js';
import { renderStandalone } from '../core/templates/standalone.js';
import {
  EXIT_CODES,
  getErrorCode,
  getErrorMessage,
  RenderError,
  type ExitCode,
} from '../utils/errors.js';
import { compileWireFile } from '../utils/input.js';
import {
  SCREENSHOT_PADDING_PX,
  VALID_FORMATS,
  isValidFormat,
  type Format,
} from '../utils/constants.js';
import {
  createOutputOptions,
  formatFailure,
  formatInfo,
  formatSuccess,
  printError,
} from '../utils/output.js';

export interface RenderOptions {
  /** Output format (html or png). PNG requires output file path. */
  format?: Format | string;
  /** Output file path. Required for PNG format. */
  output?: string;
  screen?: string;
  theme?: string;
  width?: string;
  height?: string;
  standalone?: boolean;
  title?: string;
  fonts?: boolean;
  color?: boolean;
}

export interface RenderResult {
  success: boolean;
  exitCode: ExitCode;
  content: string | Buffer;
  screenId: string;
  screenName?: string;
  width: number;
  height: number;
  format: Format;
}

/**
 * Render a WireScript file to HTML or PNG
 */
export async function render(filePath: string, options: RenderOptions = {}): Promise<RenderResult> {
  // Validate format option
  const format = options.format || 'html';
  if (!isValidFormat(format)) {
    throw new RenderError(
      `Invalid format: "${format}". Valid formats: ${VALID_FORMATS.join(', ')}`,
      filePath
    );
  }

  // Validate PNG output requirement early (before expensive operations)
  if (format === 'png' && !options.output) {
    throw new RenderError(
      'PNG format requires -o/--output file path (cannot output binary to stdout)',
      filePath
    );
  }

  // Read, validate, and compile
  const { result } = await compileWireFile(filePath, { throwOnError: true });
  const wireDoc = result.document!;

  // Theme name (currently only brutalism is fully supported)
  const themeName = options.theme || 'brutalism';

  // Parse dimensions
  const width = options.width ? Number.parseInt(options.width, 10) : undefined;
  const height = options.height ? Number.parseInt(options.height, 10) : undefined;

  if (options.width && (width === undefined || Number.isNaN(width))) {
    throw new RenderError(`Invalid width: ${options.width}`, filePath);
  }
  if (options.height && (height === undefined || Number.isNaN(height))) {
    throw new RenderError(`Invalid height: ${options.height}`, filePath);
  }

  // Validate screen exists
  if (options.screen) {
    const screenExists = wireDoc.screens.some((s) => s.id === options.screen);
    if (!screenExists) {
      const available = wireDoc.screens.map((s) => s.id).join(', ');
      throw new RenderError(
        `Screen not found: ${options.screen}. Available: ${available}`,
        filePath
      );
    }
  }

  if (format === 'png') {
    // PNG rendering using Playwright
    const pngBuffer = await renderToPNG(wireDoc, {
      screenId: options.screen,
      themeName,
      width,
      height,
      title: options.title,
      includeFonts: options.fonts !== false,
    });

    const rendered = renderScreen(wireDoc, {
      screenId: options.screen,
      width,
      height,
    });

    return {
      success: true,
      exitCode: EXIT_CODES.SUCCESS,
      content: pngBuffer,
      screenId: rendered.screenId,
      screenName: rendered.screenName,
      width: rendered.width,
      height: rendered.height,
      format,
    };
  }

  // HTML rendering
  const rendered = renderScreen(wireDoc, {
    screenId: options.screen,
    width,
    height,
  });

  let content = rendered.html;

  // Wrap in standalone HTML if requested
  if (options.standalone) {
    content = renderStandalone({
      title: options.title || rendered.screenName || 'WireScript',
      content: rendered.html,
      themeName,
      width: rendered.width,
      height: rendered.height,
      includeFonts: options.fonts !== false,
    });
  }

  return {
    success: true,
    exitCode: EXIT_CODES.SUCCESS,
    content,
    screenId: rendered.screenId,
    screenName: rendered.screenName,
    width: rendered.width,
    height: rendered.height,
    format,
  };
}

/**
 * Render to PNG using Playwright - returns Buffer for streaming
 */
async function renderToPNG(
  document: import('@wirescript/dsl').WireDocument,
  options: {
    screenId?: string;
    themeName?: string;
    width?: number;
    height?: number;
    title?: string;
    includeFonts?: boolean;
  }
): Promise<Buffer> {
  // Lazy import Playwright
  let chromium: typeof import('playwright').chromium;
  try {
    const playwright = await import('playwright');
    chromium = playwright.chromium;
  } catch {
    throw new RenderError(
      'PNG export requires Playwright. Install it with: pnpm add -D playwright && npx playwright install chromium',
      'render'
    );
  }

  // First render to HTML
  const rendered = renderScreen(document, {
    screenId: options.screenId,
    width: options.width,
    height: options.height,
  });
  const html = renderStandalone({
    title: options.title || rendered.screenName || 'WireScript',
    content: rendered.html,
    themeName: options.themeName,
    width: rendered.width,
    height: rendered.height,
    includeFonts: options.includeFonts,
  });

  // Launch browser and screenshot
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: {
        width: rendered.width + SCREENSHOT_PADDING_PX,
        height: rendered.height + SCREENSHOT_PADDING_PX,
      },
    });

    await page.setContent(html, { waitUntil: 'networkidle' });

    // Find the wireframe container and screenshot it
    const container = await page.$('.wireframe-container');
    if (!container) {
      throw new RenderError('Failed to find wireframe container for screenshot', 'render');
    }

    // Return raw buffer instead of base64 - better for large files
    const screenshot = await container.screenshot({ type: 'png' });
    return screenshot;
  } finally {
    await browser.close();
  }
}

/**
 * CLI action handler for render command
 * Returns exit code instead of calling process.exit directly
 */
export async function renderAction(filePath: string, options: RenderOptions): Promise<ExitCode> {
  const outputOpts = createOutputOptions({ color: options.color });

  try {
    const result = await render(filePath, options);

    // Output
    if (options.output) {
      if (result.format === 'png') {
        // Stream binary PNG to file
        const writeStream = createWriteStream(options.output);
        writeStream.write(result.content);
        writeStream.end();
        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      } else {
        writeFileSync(options.output, result.content as string);
      }

      // Print info to stderr
      printError(formatSuccess(`Rendered to: ${options.output}`, outputOpts));
      printError(
        formatInfo(
          `  Screen: ${result.screenId}${result.screenName ? ` (${result.screenName})` : ''}`,
          outputOpts
        )
      );
      printError(formatInfo(`  Size: ${result.width}x${result.height}`, outputOpts));
    } else {
      // PNG without output is validated early in render(), so this is always HTML
      console.log(result.content);
    }

    return EXIT_CODES.SUCCESS;
  } catch (error) {
    printError(formatFailure(getErrorMessage(error), outputOpts));
    return getErrorCode(error, EXIT_CODES.RENDER_ERROR);
  }
}
