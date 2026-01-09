import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prod = process.argv[2] === 'production';

// Get renderer CSS as string for iframe injection
function getRendererCSS() {
  const cssPath = join(__dirname, '../../packages/renderer/dist/styles.css');
  if (!existsSync(cssPath)) {
    throw new Error('Renderer CSS not found. Build @wirescript/renderer first.');
  }
  return readFileSync(cssPath, 'utf-8');
}

// Ensure dist directory exists
const distDir = join(__dirname, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Bundle extension assets to dist
function bundleAssets() {
  // Copy extension CSS
  const extensionCSS = readFileSync(join(__dirname, 'src/styles.css'), 'utf-8');
  writeFileSync(join(distDir, 'styles.css'), extensionCSS);

  // Copy manifest.json
  const manifest = readFileSync(join(__dirname, 'manifest.json'), 'utf-8');
  writeFileSync(join(distDir, 'manifest.json'), manifest);

  // Copy icons (create placeholder if not exists)
  const iconsDir = join(__dirname, 'icons');
  const distIconsDir = join(distDir, 'icons');
  if (existsSync(iconsDir)) {
    if (!existsSync(distIconsDir)) {
      mkdirSync(distIconsDir, { recursive: true });
    }
    cpSync(iconsDir, distIconsDir, { recursive: true });
  }

  console.log('Bundled CSS, manifest, and icons to dist/');
}

// Get renderer CSS for embedding
const rendererCSS = getRendererCSS();

const context = await esbuild.context({
  entryPoints: ['src/content.ts'],
  bundle: true,
  external: [],
  format: 'iife', // Chrome extensions use IIFE format
  target: 'es2020',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'dist/content.js',
  minify: prod,
  define: {
    'process.env.NODE_ENV': prod ? '"production"' : '"development"',
    __RENDERER_CSS__: JSON.stringify(rendererCSS),
  },
  // Keep console.error for debugging, use pure annotations for tree-shaking
  pure: prod ? ['console.log', 'console.info', 'console.debug'] : [],
  // Alias to use Preact instead of React (much smaller: 3KB vs 130KB)
  alias: {
    react: 'preact/compat',
    'react-dom': 'preact/compat',
    'react-dom/client': 'preact/compat',
    'react/jsx-runtime': 'preact/jsx-runtime',
  },
});

if (prod) {
  await context.rebuild();
  bundleAssets();
  process.exit(0);
} else {
  // In dev mode, do initial build then watch
  await context.rebuild();
  bundleAssets();
  await context.watch();
  console.log('Watching for changes...');
}
