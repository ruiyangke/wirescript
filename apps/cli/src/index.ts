/**
 * WireScript CLI
 *
 * Commands:
 *   verify  - Validate WireScript files
 *   list    - List screens in a file
 *   render  - Render to HTML or PNG
 *   build   - Build documentation site with sidebar
 *   format  - Format WireScript files
 */

import { Command } from 'commander';
import { buildAction } from './commands/build.js';
import { formatAction } from './commands/format.js';
import { listAction } from './commands/list.js';
import { renderAction } from './commands/render.js';
import { verifyAction } from './commands/verify.js';
import { THEME_NAMES } from './core/themes/index.js';
import { VALID_FORMATS } from './utils/constants.js';

const program = new Command();

program
  .name('wirescript')
  .description('CLI for WireScript - validate, render, and build wireframes')
  .version('0.2.0');

// verify command
program
  .command('verify')
  .description('Validate a WireScript file')
  .argument('<file>', 'Path to .wire file (use "-" for stdin)')
  .option('--json', 'Output results as JSON')
  .option('-q, --quiet', 'Only output errors')
  .option('-w, --warnings', 'Treat warnings as errors')
  .option('--no-color', 'Disable colored output')
  .action(async (filePath, options) => {
    const exitCode = await verifyAction(filePath, options);
    process.exit(exitCode);
  });

// list command
program
  .command('list')
  .description('List screens in a WireScript file')
  .argument('<file>', 'Path to .wire file')
  .option('--json', 'Output as JSON')
  .option('--no-color', 'Disable colored output')
  .action(async (filePath, options) => {
    const exitCode = await listAction(filePath, options);
    process.exit(exitCode);
  });

// render command
program
  .command('render')
  .description('Render a WireScript file to HTML or PNG')
  .argument('<file>', 'Path to .wire file (use "-" for stdin)')
  .option(
    '-f, --format <type>',
    `Output format: ${VALID_FORMATS.join(', ')} (png requires -o)`,
    'html'
  )
  .option('-o, --output <path>', 'Output file path (required for png, default: stdout for html)')
  .option('-s, --screen <id>', 'Screen to render (default: first)')
  .option('-t, --theme <name>', `Theme: ${THEME_NAMES.join(', ')}`, 'brutalism')
  .option('--width <px>', 'Override viewport width')
  .option('--height <px>', 'Override viewport height')
  .option('--standalone', 'Wrap in full HTML document')
  .option('--title <text>', 'Document title (standalone only)')
  .option('--no-fonts', 'Disable Google Fonts')
  .option('--no-color', 'Disable colored output')
  .action(async (filePath, options) => {
    const exitCode = await renderAction(filePath, options);
    process.exit(exitCode);
  });

// build command
program
  .command('build')
  .description('Build documentation site from a WireScript file')
  .argument('<file>', 'Path to .wire file')
  .option('-o, --output <dir>', 'Output directory', './dist')
  .option('-t, --theme <name>', `Theme: ${THEME_NAMES.join(', ')}`, 'brutalism')
  .option('--title <text>', 'Site title')
  .option('--base <path>', 'Base URL path', '/')
  .option('--no-sidebar', 'Disable sidebar navigation')
  .option('--no-fonts', 'Disable Google Fonts')
  .option('--no-color', 'Disable colored output')
  .option('-i, --interactive', 'Enable full interactivity (React hydration)')
  .action(async (filePath, options) => {
    const exitCode = await buildAction(filePath, options);
    process.exit(exitCode);
  });

// format command
program
  .command('format')
  .description('Format a WireScript file')
  .argument('<file>', 'Path to .wire file')
  .option('-c, --check', 'Check if file is formatted (exit 1 if not)')
  .option('--no-write', 'Output to stdout instead of modifying file')
  .option('--no-color', 'Disable colored output')
  .action(async (filePath, options) => {
    const exitCode = await formatAction(filePath, options);
    process.exit(exitCode);
  });

program.parse();
