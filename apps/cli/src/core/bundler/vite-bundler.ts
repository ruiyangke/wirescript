/**
 * Vite-based bundler for React hydration
 *
 * Uses Vite to bundle the hydration entry point with React, ReactDOM,
 * and the WireScript renderer into a single IIFE bundle.
 *
 * Supports tree-shaking icons by generating a minimal icons module
 * that only includes icons used in the document.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { build, type Plugin, type PluginOption } from 'vite';
import { generateHydrateEntry } from './hydrate-entry-template.js';
import { generateMinimalIconsModule } from './icon-analyzer.js';

// Get the CLI package directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliRoot = resolve(__dirname, '../../..'); // apps/cli or node_modules/@wirescript/cli

// Create require for resolving packages
const require = createRequire(import.meta.url);

/**
 * Check if we're in a monorepo development environment
 */
function isMonorepo(): boolean {
  // Check if workspace root exists with packages directory
  const workspaceRoot = resolve(cliRoot, '../..');
  return existsSync(join(workspaceRoot, 'packages/renderer/src/index.ts'));
}

/**
 * Resolve a package's entry point, handling both npm install and monorepo dev
 */
function resolvePackage(packageName: string): string {
  // First, try monorepo paths (for development)
  if (isMonorepo()) {
    const workspaceRoot = resolve(cliRoot, '../..');
    const monorepoMappings: Record<string, string> = {
      '@wirescript/renderer': join(workspaceRoot, 'packages/renderer/src/index.ts'),
      '@wirescript/dsl': join(workspaceRoot, 'packages/dsl/src/index.ts'),
    };

    if (monorepoMappings[packageName] && existsSync(monorepoMappings[packageName])) {
      return monorepoMappings[packageName];
    }
  }

  // Otherwise, use Node's module resolution (for npm installed packages)
  try {
    return require.resolve(packageName);
  } catch {
    throw new Error(`Cannot resolve package: ${packageName}. Make sure it's installed.`);
  }
}

/**
 * Get the package directory for a given package name
 */
function getPackageDir(packageName: string): string {
  // First, try monorepo paths
  if (isMonorepo()) {
    const workspaceRoot = resolve(cliRoot, '../..');
    const monorepoMappings: Record<string, string> = {
      '@wirescript/renderer': join(workspaceRoot, 'packages/renderer'),
      '@wirescript/dsl': join(workspaceRoot, 'packages/dsl'),
    };

    if (monorepoMappings[packageName] && existsSync(monorepoMappings[packageName])) {
      return monorepoMappings[packageName];
    }
  }

  // Otherwise, resolve from node_modules
  const mainEntry = resolvePackage(packageName);
  let dir = dirname(mainEntry);
  while (dir !== '/') {
    try {
      const pkgPath = join(dir, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.name === packageName) {
        return dir;
      }
    } catch {
      // Not found, keep walking up
    }
    dir = dirname(dir);
  }
  return dirname(mainEntry);
}

/**
 * Resolve lucide-react from the renderer's dependencies
 */
function resolveLucideReact(): string {
  const rendererDir = getPackageDir('@wirescript/renderer');

  // Try renderer's node_modules first
  const rendererLucide = join(rendererDir, 'node_modules/lucide-react');
  if (existsSync(rendererLucide)) {
    return rendererLucide;
  }

  // Try hoisted node_modules (common in pnpm/monorepo)
  try {
    const rendererRequire = createRequire(join(rendererDir, 'package.json'));
    return dirname(rendererRequire.resolve('lucide-react/package.json'));
  } catch {
    // Fallback to CLI's resolution
    return dirname(require.resolve('lucide-react/package.json'));
  }
}

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

  // Resolve package paths - works in both monorepo and npm installed contexts
  const rendererPath = resolvePackage('@wirescript/renderer');
  const dslPath = resolvePackage('@wirescript/dsl');
  const lucideReactPath = resolveLucideReact();

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

    // Plugin to intercept icons.js/icons.ts resolution
    const iconsAliasPlugin: Plugin = {
      name: 'wirescript-icons-alias',
      enforce: 'pre',
      resolveId(source, importer) {
        // Check if this is an icons import from the renderer package
        if (importer && (source.endsWith('/icons.js') || source.endsWith('/icons.ts'))) {
          // Check if the importer is from the renderer package
          if (importer.includes('@wirescript/renderer') || importer.includes('wirescript-renderer') || importer.includes('packages/renderer')) {
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
      // Resolve @wirescript packages and ensure React is found
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
