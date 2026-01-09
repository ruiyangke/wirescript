/**
 * Vite-based bundler for React hydration
 *
 * Uses Vite to bundle the hydration entry point with React, ReactDOM,
 * and the WireScript renderer into a single IIFE bundle.
 *
 * Supports tree-shaking icons by generating a minimal icons module
 * that only includes icons used in the document.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { build, type Plugin, type PluginOption } from 'vite';
import { generateHydrateEntry } from './hydrate-entry-template.js';
import { generateMinimalIconsModule } from './icon-analyzer.js';

// Get the CLI package directory for resolving workspace packages
// File location: apps/cli/dist/core/bundler/vite-bundler.js
// Need to go up 3 levels: bundler -> core -> dist -> cli
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliRoot = resolve(__dirname, '../../..'); // apps/cli
const workspaceRoot = resolve(cliRoot, '../..'); // workspace root

export interface ViteBundleOptions {
  /** Output directory for the bundle */
  outputDir: string;
  /** Whether to minify the output */
  minify?: boolean;
  /** Output filename (default: 'hydrate.js') */
  filename?: string;
  /** Set of icon names used in the document (for tree-shaking) */
  usedIcons?: Set<string>;
}

export interface ViteBundleResult {
  /** The bundled JavaScript code */
  code: string;
  /** Path to the output file (if written) */
  path: string;
  /** Bundle size in bytes */
  size: number;
}

/**
 * Bundle the React hydration entry point using Vite
 *
 * Creates a self-contained IIFE bundle that includes:
 * - React and ReactDOM
 * - WireScript renderer components
 * - Hydration logic
 *
 * When usedIcons is provided, generates a minimal icons module
 * to reduce bundle size by only including icons actually used.
 */
export async function bundleWithVite(options: ViteBundleOptions): Promise<ViteBundleResult> {
  const { outputDir, minify = true, filename = 'hydrate.js', usedIcons } = options;

  // Create temporary directory inside CLI package (so it's under Vite root)
  const tempDir = join(cliRoot, '.wirescript-temp');
  mkdirSync(tempDir, { recursive: true });

  // Write the entry file
  const entryPath = join(tempDir, 'hydrate-entry.tsx');
  const entryCode = generateHydrateEntry();
  writeFileSync(entryPath, entryCode);

  // Resolve package paths
  const rendererPath = resolve(workspaceRoot, 'packages/renderer/src/index.ts');
  const dslPath = resolve(workspaceRoot, 'packages/dsl/src/index.ts');

  // Build aliases - always include renderer and dsl
  // Also alias lucide-react to ensure it resolves from renderer's node_modules
  const lucideReactPath = resolve(workspaceRoot, 'packages/renderer/node_modules/lucide-react');
  const aliases: Record<string, string> = {
    '@wirescript/renderer': rendererPath,
    '@wirescript/dsl': dslPath,
    'lucide-react': lucideReactPath,
  };

  // Plugins array
  const plugins: PluginOption[] = [react()];

  // If usedIcons provided, generate minimal icons module and add plugin to intercept
  if (usedIcons) {
    const minimalIconsPath = join(tempDir, 'icons.tsx');
    const minimalIconsCode = generateMinimalIconsModule(usedIcons);
    writeFileSync(minimalIconsPath, minimalIconsCode);

    // The original icons.ts path that should be replaced
    const originalIconsPath = resolve(workspaceRoot, 'packages/renderer/src/icons.ts');

    // Plugin to intercept icons.js/icons.ts resolution
    const iconsAliasPlugin: Plugin = {
      name: 'wirescript-icons-alias',
      enforce: 'pre',
      resolveId(source, importer) {
        // Check if this is an icons import from the renderer package
        if (importer && (source.endsWith('/icons.js') || source.endsWith('/icons.ts'))) {
          const resolved = resolve(dirname(importer), source.replace('.js', '.ts'));
          if (resolved === originalIconsPath) {
            return minimalIconsPath;
          }
        }
        return null;
      },
    };

    plugins.unshift(iconsAliasPlugin);
  }

  try {
    // Bundle with Vite - use CLI root so React can be resolved from node_modules
    await build({
      root: cliRoot,
      configFile: false,
      logLevel: 'silent',
      plugins,
      build: {
        outDir: resolve(outputDir),
        emptyOutDir: false,
        minify: minify ? 'esbuild' : false,
        sourcemap: false,
        lib: {
          entry: entryPath,
          name: 'WireScriptHydrate',
          formats: ['iife'],
          fileName: () => filename,
        },
        rollupOptions: {
          output: {
            // Ensure single file output
            inlineDynamicImports: true,
          },
        },
      },
      // Resolve @wirescript packages from workspace and ensure React is found
      resolve: {
        alias: aliases,
        // Ensure consistent React version
        dedupe: ['react', 'react-dom'],
      },
      // Define globals for browser environment
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    });

    // Read the bundled output
    const outputPath = join(outputDir, filename);
    const code = readFileSync(outputPath, 'utf-8');

    return {
      code,
      path: outputPath,
      size: Buffer.byteLength(code, 'utf-8'),
    };
  } finally {
    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
