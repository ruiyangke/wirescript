/**
 * build command - Build documentation site from WireScript file
 *
 * Modes:
 * - Default: Static HTML with optional sidebar
 * - --interactive: Full React hydration for complete interactivity
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderScreen } from '../core/renderer.js';
import {
  generateHydratePageData,
  bundleWithVite,
  formatBytes,
  extractUsedIcons,
} from '../core/bundler/index.js';
import { renderDocsPage, renderIndexRedirect, type ScreenInfo } from '../core/templates/docs.js';
import { renderStandalone } from '../core/templates/standalone.js';
import { renderHydrated } from '../core/templates/hydrated.js';
import { EXIT_CODES, getErrorCode, getErrorMessage, type ExitCode } from '../utils/errors.js';
import { compileWireFile } from '../utils/input.js';
import {
  createOutputOptions,
  formatFailure,
  formatInfo,
  formatSuccess,
  printError,
} from '../utils/output.js';

export interface BuildOptions {
  output?: string;
  theme?: string;
  title?: string;
  base?: string;
  sidebar?: boolean;
  fonts?: boolean;
  color?: boolean;
  /** Enable interactive mode with full React hydration */
  interactive?: boolean;
}

export interface BuildResult {
  success: boolean;
  exitCode: ExitCode;
  outputDir: string;
  files: string[];
  screens: number;
  /** Hydration bundle size in bytes (only when --hydrate is used) */
  hydrateBundleSize?: number;
}

/**
 * Build documentation site from a WireScript file
 */
export async function build(filePath: string, options: BuildOptions = {}): Promise<BuildResult> {
  // Read, validate, and compile
  const { input, result } = await compileWireFile(filePath, { throwOnError: true });
  const wireDoc = result.document!;

  // Theme name (currently only brutalism is fully supported)
  const themeName = options.theme || 'brutalism';

  // Output directory
  const outputDir = options.output || './dist';
  const basePath = options.base || '/';
  const siteTitle = options.title || input.filename.replace('.wire', '');
  const includeSidebar = options.sidebar !== false;
  const includeFonts = options.fonts !== false;
  const isInteractive = options.interactive === true;

  // Create output directory
  mkdirSync(outputDir, { recursive: true });

  const files: string[] = [];

  // Build screen info for navigation
  const screens: ScreenInfo[] = wireDoc.screens.map((s) => ({
    id: s.id,
    name: s.name || s.id,
    href: `${basePath}${s.id}.html`,
  }));

  // For interactive mode, bundle React hydration once (shared across all screens)
  let hydrateBundleSize = 0;

  if (isInteractive) {
    // Extract used icons for tree-shaking
    const usedIcons = extractUsedIcons(wireDoc);

    // Create the shared hydration bundle with minimal icons
    const bundleResult = await bundleWithVite({
      outputDir,
      minify: true,
      filename: 'hydrate.js',
      usedIcons,
    });
    hydrateBundleSize = bundleResult.size;
    files.push('hydrate.js');
  }

  // Render each screen
  for (const screenDef of wireDoc.screens) {
    const rendered = renderScreen(wireDoc, {
      screenId: screenDef.id,
    });

    let html: string;

    if (isInteractive) {
      // Full React hydration mode
      const pageDataScript = generateHydratePageData({
        document: wireDoc,
        screenId: screenDef.id,
        viewport: { width: rendered.width, height: rendered.height },
      });

      html = renderHydrated({
        title: `${rendered.screenName || rendered.screenId} - ${siteTitle}`,
        content: rendered.html,
        themeName,
        width: rendered.width,
        height: rendered.height,
        includeFonts,
        pageDataScript,
        hydrateBundlePath: 'hydrate.js',
      });
    } else if (includeSidebar) {
      html = renderDocsPage({
        title: rendered.screenName || rendered.screenId,
        siteTitle,
        content: rendered.html,
        themeName,
        width: rendered.width,
        height: rendered.height,
        screens,
        currentScreenId: screenDef.id,
        basePath,
        includeFonts,
      });
    } else {
      // Standalone page without sidebar
      html = renderStandalone({
        title: `${rendered.screenName || rendered.screenId} - ${siteTitle}`,
        content: rendered.html,
        themeName,
        width: rendered.width,
        height: rendered.height,
        includeFonts,
      });
    }

    const filename = `${screenDef.id}.html`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, html);
    files.push(filename);
  }

  // Create index.html redirect
  if (screens.length > 0) {
    const indexHtml = renderIndexRedirect(screens[0].href);
    const indexPath = join(outputDir, 'index.html');
    writeFileSync(indexPath, indexHtml);
    files.push('index.html');
  }

  return {
    success: true,
    exitCode: EXIT_CODES.SUCCESS,
    outputDir,
    files,
    screens: screens.length,
    hydrateBundleSize: isInteractive ? hydrateBundleSize : undefined,
  };
}

/**
 * CLI action handler for build command
 * Returns exit code instead of calling process.exit directly
 */
export async function buildAction(filePath: string, options: BuildOptions): Promise<ExitCode> {
  const outputOpts = createOutputOptions({ color: options.color });

  try {
    const result = await build(filePath, options);

    printError(
      formatSuccess(`Built ${result.screens} screens to ${result.outputDir}/`, outputOpts)
    );
    printError(formatInfo(`  Files: ${result.files.join(', ')}`, outputOpts));

    // Show bundle size for hydration mode
    if (result.hydrateBundleSize !== undefined) {
      printError(
        formatInfo(`  Bundle: ${formatBytes(result.hydrateBundleSize)} (hydrate.js)`, outputOpts)
      );
    }

    return EXIT_CODES.SUCCESS;
  } catch (error) {
    printError(formatFailure(getErrorMessage(error), outputOpts));
    return getErrorCode(error, EXIT_CODES.RENDER_ERROR);
  }
}
