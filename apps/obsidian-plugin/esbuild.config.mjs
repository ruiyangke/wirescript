import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const _rootDir = join(__dirname, '../..');
const prod = process.argv[2] === 'production';

// Get renderer CSS as string for Shadow DOM injection
function getRendererCSS() {
  return readFileSync(join(__dirname, '../../packages/renderer/dist/styles.css'), 'utf-8');
}

// Ensure dist directory exists
const distDir = join(__dirname, 'dist');
if (!existsSync(distDir)) {
  const { mkdirSync } = await import('node:fs');
  mkdirSync(distDir, { recursive: true });
}

// Bundle plugin CSS and copy manifest to dist
function bundleAssets() {
  const pluginCSS = readFileSync(join(__dirname, 'src/styles.css'), 'utf-8');
  writeFileSync(join(distDir, 'styles.css'), pluginCSS);

  // Copy manifest.json to dist
  const manifest = readFileSync(join(__dirname, 'manifest.json'), 'utf-8');
  writeFileSync(join(distDir, 'manifest.json'), manifest);

  console.log('Bundled CSS and manifest to dist/');
}

// Get renderer CSS for embedding
const rendererCSS = getRendererCSS();

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'dist/main.js',
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
  await context.watch();
}
