/**
 * Extract and verify all wire code examples from MDX files
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../../packages/dsl/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, '../content/docs');
const OUTPUT_DIR = path.join(__dirname, '../.wire-examples');

interface CodeBlock {
  file: string;
  line: number;
  code: string;
  index: number; // 1-based index within the file
}

interface VerifyResult {
  block: CodeBlock;
  wrapped: string;
  success: boolean;
  skipped: boolean;
  errors: string[];
  outputFile?: string;
}

/**
 * Extract all ```wire code blocks from an MDX file
 */
function extractWireBlocks(filePath: string): CodeBlock[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const blocks: CodeBlock[] = [];

  let inWireBlock = false;
  let currentBlock: string[] = [];
  let blockStartLine = 0;
  let blockIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```wire')) {
      inWireBlock = true;
      currentBlock = [];
      blockStartLine = i + 1;
      blockIndex++;
    } else if (inWireBlock && line.trim() === '```') {
      inWireBlock = false;
      blocks.push({
        file: filePath,
        line: blockStartLine,
        code: currentBlock.join('\n'),
        index: blockIndex,
      });
    } else if (inWireBlock) {
      currentBlock.push(line);
    }
  }

  return blocks;
}

/**
 * Check if code is syntax pseudocode (not real WireScript)
 */
function isPseudoCode(code: string): boolean {
  // Contains syntax markers like ? or * that aren't in strings
  const withoutStrings = code.replace(/"[^"]*"/g, '');
  if (/[?*]/.test(withoutStrings) || /↑/.test(code)) {
    return true;
  }

  // Contains placeholder patterns like :keyword :keyword (two keywords in a row)
  // e.g., `:viewport :layout` means :viewport is a placeholder
  if (/:[\w-]+\s+:[\w-]+\s+[\w-]+/.test(withoutStrings)) {
    // Check if it looks like a placeholder (e.g., :viewport :layout layout-name)
    if (/:viewport\s+:layout/.test(withoutStrings)) {
      return true;
    }
  }

  return false;
}

/**
 * Split code into top-level S-expressions
 */
function splitTopLevelExpressions(code: string): string[] {
  const expressions: string[] = [];
  let depth = 0;
  let current = '';
  let inString = false;
  let inComment = false;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const _nextChar = code[i + 1];

    // Handle comments
    if (char === ';' && !inString) {
      inComment = true;
    }
    if (char === '\n' && inComment) {
      inComment = false;
      current += char;
      continue;
    }
    if (inComment) {
      current += char;
      continue;
    }

    // Handle strings
    if (char === '"' && code[i - 1] !== '\\') {
      inString = !inString;
    }

    if (!inString) {
      if (char === '(') {
        if (depth === 0 && current.trim()) {
          // There's content before this expression (likely comments)
        }
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          current += char;
          expressions.push(current.trim());
          current = '';
          continue;
        }
      }
    }

    current += char;
  }

  // Handle remaining content
  if (current.trim()) {
    expressions.push(current.trim());
  }

  return expressions.filter((e) => e.startsWith('('));
}

/**
 * Wrap code in wire/screen structure if needed
 */
function wrapInWireDocument(code: string): { wrapped: string; skipped: boolean } {
  const trimmed = code.trim();

  // Skip pseudocode syntax examples
  if (isPseudoCode(trimmed)) {
    return { wrapped: trimmed, skipped: true };
  }

  // Already a complete document
  if (trimmed.startsWith('(wire')) {
    return { wrapped: trimmed, skipped: false };
  }

  // Split into top-level expressions
  const expressions = splitTopLevelExpressions(trimmed);

  // Check what types of expressions we have
  const hasDefine = expressions.some((e) => e.startsWith('(define '));
  const hasLayout = expressions.some((e) => e.startsWith('(layout '));
  const hasScreen = expressions.some((e) => e.startsWith('(screen '));
  const hasMeta = expressions.some((e) => e.startsWith('(meta '));

  // If we have screens, just wrap in wire
  if (hasScreen) {
    const nonScreenExprs = expressions.filter(
      (e) =>
        !e.startsWith('(screen ') &&
        !e.startsWith('(define ') &&
        !e.startsWith('(layout ') &&
        !e.startsWith('(meta ')
    );
    if (nonScreenExprs.length === 0) {
      return { wrapped: `(wire\n  ${expressions.join('\n  ')})`, skipped: false };
    }
  }

  // If only define(s), need to add a screen that uses the component
  if (hasDefine && !hasScreen && !hasLayout) {
    const defines = expressions.filter((e) => e.startsWith('(define '));
    const usage = expressions.filter((e) => !e.startsWith('(define '));

    if (usage.length > 0) {
      // Has both define and usage
      return {
        wrapped: `(wire
  ${defines.join('\n  ')}
  (screen example "Example" :desktop
    (box :col :gap 16 :padding 16
      ${usage.join('\n      ')})))`,
        skipped: false,
      };
    } else {
      // Just defines - skip as it's showing the define syntax
      return { wrapped: trimmed, skipped: true };
    }
  }

  // If only layout(s), need to add a screen
  if (hasLayout && !hasScreen) {
    return { wrapped: trimmed, skipped: true }; // Skip layout-only examples
  }

  // If only meta, skip
  if (hasMeta && expressions.length === 1) {
    return { wrapped: trimmed, skipped: true };
  }

  // Multiple elements - wrap each in the box
  if (expressions.length > 1) {
    return {
      wrapped: `(wire
  (screen example "Example" :desktop
    (box :col :gap 16 :padding 16
      ${expressions.join('\n      ')})))`,
      skipped: false,
    };
  }

  // Check if it's an unknown element (likely demonstrating component usage)
  const firstExpr = expressions[0] || trimmed;
  const elementMatch = firstExpr.match(/^\((\w[\w-]*)/);
  if (elementMatch) {
    const elementName = elementMatch[1];
    const builtinElements = [
      'box',
      'card',
      'section',
      'header',
      'footer',
      'nav',
      'form',
      'list',
      'scroll',
      'group',
      'text',
      'button',
      'input',
      'image',
      'icon',
      'divider',
      'avatar',
      'badge',
      'datepicker',
      'metric',
      'chart',
      'progress',
      'skeleton',
      'tabs',
      'tab',
      'breadcrumb',
      'crumb',
      'modal',
      'drawer',
      'dropdown',
      'popover',
      'tooltip',
      'toast',
      'empty',
      'slot',
      'repeat',
    ];
    if (!builtinElements.includes(elementName)) {
      // Unknown element name - likely showing component usage
      return { wrapped: trimmed, skipped: true };
    }
  }

  // Single element - wrap in wire + screen
  return {
    wrapped: `(wire
  (screen example "Example" :desktop
    (box :col :gap 16 :padding 16
      ${trimmed})))`,
    skipped: false,
  };
}

/**
 * Find all MDX files recursively
 */
function findMdxFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Generate output filename for a code block
 * Format: $DOC-$IDX.wire (e.g., "button-1.wire", "containers-box-2.wire")
 */
function generateOutputFilename(block: CodeBlock): string {
  const relPath = path.relative(DOCS_DIR, block.file);
  // Remove .mdx extension and convert path separators to dashes
  const docName = relPath.replace(/\.mdx$/, '').replace(/[/\\]/g, '-');
  return `${docName}-${block.index}.wire`;
}

/**
 * Write a wire file to the output directory
 */
function writeWireFile(filename: string, content: string): string {
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, content, 'utf-8');
  return outputPath;
}

/**
 * Verify a wire code block
 */
function verifyBlock(block: CodeBlock, writeFiles: boolean): VerifyResult {
  const { wrapped, skipped } = wrapInWireDocument(block.code);
  const outputFilename = generateOutputFilename(block);

  if (skipped) {
    return {
      block,
      wrapped,
      success: true,
      skipped: true,
      errors: [],
    };
  }

  const result = compile(wrapped);

  // Write file if valid and writeFiles is enabled
  let outputFile: string | undefined;
  if (writeFiles && result.success) {
    outputFile = writeWireFile(outputFilename, wrapped);
  }

  return {
    block,
    wrapped,
    success: result.success,
    skipped: false,
    errors: result.errors.map((e) => `Line ${e.line}: ${e.message}`),
    outputFile,
  };
}

// Parse command line arguments
const args = process.argv.slice(2);
const writeFiles = args.includes('--write') || args.includes('-w');

// Main
const mdxFiles = findMdxFiles(DOCS_DIR);
const allBlocks: CodeBlock[] = [];

for (const file of mdxFiles) {
  const blocks = extractWireBlocks(file);
  allBlocks.push(...blocks);
}

console.log(`Found ${allBlocks.length} wire code blocks in ${mdxFiles.length} MDX files`);

// Create output directory if writing files
if (writeFiles) {
  if (fs.existsSync(OUTPUT_DIR)) {
    // Clean existing files
    for (const file of fs.readdirSync(OUTPUT_DIR)) {
      if (file.endsWith('.wire')) {
        fs.unlinkSync(path.join(OUTPUT_DIR, file));
      }
    }
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  console.log(`Writing .wire files to ${OUTPUT_DIR}`);
}
console.log();

const results: VerifyResult[] = [];
let passCount = 0;
let failCount = 0;
let skipCount = 0;

for (const block of allBlocks) {
  const result = verifyBlock(block, writeFiles);
  results.push(result);

  if (result.skipped) {
    skipCount++;
  } else if (result.success) {
    passCount++;
  } else {
    failCount++;
  }
}

// Print failures
if (failCount > 0) {
  console.log('=== FAILURES ===\n');

  for (const result of results) {
    if (!result.success && !result.skipped) {
      const relPath = path.relative(DOCS_DIR, result.block.file);
      console.log(`❌ ${relPath}:${result.block.line}`);
      console.log('   Code:');
      console.log(
        result.block.code
          .split('\n')
          .map((l) => `     ${l}`)
          .join('\n')
      );
      console.log('   Errors:');
      for (const err of result.errors) {
        console.log(`     - ${err}`);
      }
      console.log('   Wrapped as:');
      console.log(
        result.wrapped
          .split('\n')
          .map((l) => `     ${l}`)
          .join('\n')
      );
      console.log();
    }
  }
}

// Print skipped
if (skipCount > 0) {
  console.log('=== SKIPPED (syntax examples, partial code) ===\n');

  for (const result of results) {
    if (result.skipped) {
      const relPath = path.relative(DOCS_DIR, result.block.file);
      console.log(`⏭️  ${relPath}:${result.block.line}`);
      console.log(
        result.block.code
          .split('\n')
          .slice(0, 3)
          .map((l) => `     ${l}`)
          .join('\n')
      );
      if (result.block.code.split('\n').length > 3) {
        console.log('     ...');
      }
      console.log();
    }
  }
}

// Summary
console.log('=== SUMMARY ===');
console.log(`✅ Passed: ${passCount}`);
console.log(`⏭️  Skipped: ${skipCount} (syntax examples, partial code)`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Total: ${allBlocks.length}`);

if (writeFiles) {
  const writtenFiles = results.filter((r) => r.outputFile).length;
  console.log(
    `\n📁 Written: ${writtenFiles} .wire files to ${path.relative(process.cwd(), OUTPUT_DIR)}/`
  );
}

process.exit(failCount > 0 ? 1 : 0);
