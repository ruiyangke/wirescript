/**
 * TCK: Includes
 *
 * Specification for WireScript include statements.
 * Allows importing components and layouts from other files.
 */

import { describe, expect, it } from 'vitest';
import { type CompileOptions, compile, type ResolvedInclude } from '../../index.js';
import { parse } from '../../schema/parser.js';

/**
 * Create a mock resolver for testing.
 * Keys should be absolute-style paths (e.g., '/project/main.wire').
 */
function createMockResolver(
  files: Record<string, string>
): (path: string, from: string) => Promise<ResolvedInclude> {
  return async (includePath: string, fromPath: string): Promise<ResolvedInclude> => {
    // Simple path resolution for tests: join directory of fromPath with includePath
    const fromDir = fromPath.substring(0, fromPath.lastIndexOf('/') + 1);
    let resolvedPath = fromDir + includePath;

    // Normalize ../
    while (resolvedPath.includes('/../')) {
      resolvedPath = resolvedPath.replace(/\/[^/]+\/\.\.\//g, '/');
    }
    // Normalize ./
    resolvedPath = resolvedPath.replace(/\/\.\//g, '/');

    if (files[resolvedPath]) {
      return { content: files[resolvedPath], resolvedPath };
    }
    throw new Error(`File not found: ${resolvedPath}`);
  };
}

describe('TCK: Includes', () => {
  // ===========================================================================
  // 11.1 Include Syntax
  // ===========================================================================

  describe('11.1 Include Syntax', () => {
    it('(include "path") declares an include', () => {
      const result = parse(`
        (wire
          (include "components.wire")
          (screen home "Home" (box)))
      `);
      expect(result.success).toBe(true);
      expect(result.document?.includes).toHaveLength(1);
      expect(result.document?.includes[0].type).toBe('include');
      expect(result.document?.includes[0].path).toBe('components.wire');
    });

    it('include path can be relative', () => {
      const result = parse(`
        (wire
          (include "./shared/layouts.wire")
          (screen home "Home" (box)))
      `);
      expect(result.document?.includes[0].path).toBe('./shared/layouts.wire');
    });

    it('include path can have parent directory reference', () => {
      const result = parse(`
        (wire
          (include "../common/components.wire")
          (screen home "Home" (box)))
      `);
      expect(result.document?.includes[0].path).toBe('../common/components.wire');
    });

    it('multiple includes are allowed', () => {
      const result = parse(`
        (wire
          (include "components.wire")
          (include "layouts.wire")
          (include "helpers.wire")
          (screen home "Home" (box)))
      `);
      expect(result.document?.includes).toHaveLength(3);
    });

    it('includes must come before define/layout/screen', () => {
      const result = parse(`
        (wire
          (include "a.wire")
          (define comp () (box))
          (include "b.wire")
          (screen home "Home" (box)))
      `);
      // Both includes are parsed, order in AST reflects source order
      expect(result.document?.includes).toHaveLength(2);
    });

    it('include has source location', () => {
      const result = parse(`
        (wire
          (include "test.wire")
          (screen home "Home" (box)))
      `);
      const loc = result.document?.includes[0].loc;
      expect(loc).toBeDefined();
      expect(loc?.line).toBeGreaterThan(0);
      expect(loc?.column).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // 11.2 Include Errors
  // ===========================================================================

  describe('11.2 Include Errors', () => {
    it('include requires string path', () => {
      const result = parse(`
        (wire
          (include 123)
          (screen home "Home" (box)))
      `);
      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Include expects a string path'))).toBe(
        true
      );
    });

    it('include requires a path argument', () => {
      const result = parse(`
        (wire
          (include)
          (screen home "Home" (box)))
      `);
      expect(result.success).toBe(false);
    });

    it('include with symbol instead of string fails', () => {
      const result = parse(`
        (wire
          (include components)
          (screen home "Home" (box)))
      `);
      expect(result.success).toBe(false);
    });
  });

  // ===========================================================================
  // 11.3 Include Resolution
  // ===========================================================================

  describe('11.3 Include Resolution', () => {
    it('resolves includes and merges components', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "components.wire")
            (screen home "Home"
              (my-card :title "Hello")))
        `,
        '/project/components.wire': `
          (wire
            (define my-card (title)
              (card :padding 16
                (text $title :high))))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(1);
      expect(result.document?.components[0].name).toBe('my-card');
    });

    it('resolves includes and merges layouts', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "layouts.wire")
            (screen home "Home" :layout app-layout
              (text "Content")))
        `,
        '/project/layouts.wire': `
          (wire
            (layout app-layout
              (box :col :full
                (header (text "Header"))
                (slot)
                (footer (text "Footer")))))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.layouts).toHaveLength(1);
      expect(result.document?.layouts[0].name).toBe('app-layout');
    });

    it('clears includes array after resolution', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "lib.wire")
            (screen home "Home" (box)))
        `,
        '/project/lib.wire': `
          (wire
            (define comp () (box)))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.includes).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 11.4 Nested Includes
  // ===========================================================================

  describe('11.4 Nested Includes', () => {
    it('resolves nested includes', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "a.wire")
            (screen home "Home"
              (box
                (comp-a)
                (comp-b))))
        `,
        '/project/a.wire': `
          (wire
            (include "b.wire")
            (define comp-a ()
              (box (text "A"))))
        `,
        '/project/b.wire': `
          (wire
            (define comp-b ()
              (box (text "B"))))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(2);
      const names = result.document?.components.map((c) => c.name).sort();
      expect(names).toEqual(['comp-a', 'comp-b']);
    });

    it('resolves nested includes with relative paths', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "lib/a.wire")
            (screen home "Home"
              (box (comp-a) (comp-b))))
        `,
        '/project/lib/a.wire': `
          (wire
            (include "../common/b.wire")
            (define comp-a () (box (text "A"))))
        `,
        '/project/common/b.wire': `
          (wire
            (define comp-b () (box (text "B"))))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(2);
      const names = result.document?.components.map((c) => c.name).sort();
      expect(names).toEqual(['comp-a', 'comp-b']);
    });

    it('deeply nested includes work', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "level1.wire")
            (screen home "Home" (level1-comp)))
        `,
        '/project/level1.wire': `
          (wire
            (include "level2.wire")
            (define level1-comp () (level2-comp)))
        `,
        '/project/level2.wire': `
          (wire
            (include "level3.wire")
            (define level2-comp () (level3-comp)))
        `,
        '/project/level3.wire': `
          (wire
            (define level3-comp () (text "Deep")))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(3);
    });
  });

  // ===========================================================================
  // 11.5 Conflict Resolution
  // ===========================================================================

  describe('11.5 Conflict Resolution', () => {
    it('last definition wins for components', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "lib.wire")
            (define my-btn ()
              (button "Main Button" :primary))
            (screen home "Home" (my-btn)))
        `,
        '/project/lib.wire': `
          (wire
            (define my-btn ()
              (button "Lib Button" :ghost)))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(1);
      // Main file's definition wins (last wins)
      const body = result.document?.components[0].body;
      expect(body?.props.primary).toBe(true);
    });

    it('last definition wins for layouts', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "lib.wire")
            (layout app-layout
              (box :col (text "Main Layout") (slot)))
            (screen home "Home" :layout app-layout (box)))
        `,
        '/project/lib.wire': `
          (wire
            (layout app-layout
              (box :row (slot) (text "Lib Layout"))))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.layouts).toHaveLength(1);
      // Main file's layout wins
      expect(result.document?.layouts[0].body.props.col).toBe(true);
    });

    it('include order determines precedence', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "first.wire")
            (include "second.wire")
            (screen home "Home" (my-comp)))
        `,
        '/project/first.wire': `
          (wire
            (define my-comp () (text "First")))
        `,
        '/project/second.wire': `
          (wire
            (define my-comp () (text "Second")))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      // Second include wins (later includes override earlier)
      const body = result.document?.components[0].body;
      expect(body?.content).toBe('Second');
    });
  });

  // ===========================================================================
  // 11.6 Circular Include Detection
  // ===========================================================================

  describe('11.6 Circular Include Detection', () => {
    it('detects direct circular includes', async () => {
      const files: Record<string, string> = {
        '/project/a.wire': `
          (wire
            (include "b.wire")
            (screen _a "_" (box)))
        `,
        '/project/b.wire': `
          (wire
            (include "a.wire")
            (screen _b "_" (box)))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/a.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/a.wire'], options);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Circular include'))).toBe(true);
    });

    it('detects indirect circular includes', async () => {
      const files: Record<string, string> = {
        '/project/a.wire': `
          (wire
            (include "b.wire")
            (screen _a "_" (box)))
        `,
        '/project/b.wire': `
          (wire
            (include "c.wire")
            (screen _b "_" (box)))
        `,
        '/project/c.wire': `
          (wire
            (include "a.wire")
            (screen _c "_" (box)))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/a.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/a.wire'], options);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Circular include'))).toBe(true);
    });

    it('detects circular includes with different relative paths to same file', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "lib/a.wire")
            (screen home "Home" (box)))
        `,
        '/project/lib/a.wire': `
          (wire
            (include "../lib/a.wire")
            (screen _a "_" (box)))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Circular include'))).toBe(true);
    });
  });

  // ===========================================================================
  // 11.7 Resolution Errors
  // ===========================================================================

  describe('11.7 Resolution Errors', () => {
    it('reports error for missing include file', async () => {
      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: async () => {
          throw new Error('File not found');
        },
      };

      const result = await compile(
        `
        (wire
          (include "missing.wire")
          (screen home "Home" (box)))
      `,
        options
      );

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Cannot resolve include'))).toBe(true);
    });

    it('reports error for invalid included file', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "invalid.wire")
            (screen home "Home" (box)))
        `,
        '/project/invalid.wire': `
          (wire
            (invalid-syntax here))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Error in included file'))).toBe(true);
    });

    it('reports error for max depth exceeded', async () => {
      // Create a chain of 102 includes to exceed MAX_INCLUDE_DEPTH (100)
      // depth 0 -> 1 -> 2 -> ... -> 100 -> 101 (fails at depth 101 > 100)
      const files: Record<string, string> = {};
      for (let i = 0; i <= 102; i++) {
        const next = i < 102 ? `(include "level${i + 1}.wire")` : '';
        files[`/project/level${i}.wire`] = `
          (wire
            ${next}
            (screen _${i} "_" (box)))
        `;
      }

      const options: CompileOptions = {
        filePath: '/project/level0.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/level0.wire'], options);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Maximum include depth'))).toBe(true);
    });
  });

  // ===========================================================================
  // 11.8 Screenless Library Files
  // ===========================================================================

  describe('11.8 Screenless Library Files', () => {
    it('allows included files with only components', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "components.wire")
            (screen home "Home" (my-btn)))
        `,
        '/project/components.wire': `
          (wire
            (define my-btn ()
              (button "Click Me" :primary)))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(1);
    });

    it('allows included files with only layouts', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "layouts.wire")
            (screen home "Home" :layout app-layout
              (text "Content")))
        `,
        '/project/layouts.wire': `
          (wire
            (layout app-layout
              (box :col (header (text "H")) (slot) (footer (text "F")))))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.layouts).toHaveLength(1);
    });

    it('allows included files with components and layouts only', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "lib.wire")
            (screen home "Home" :layout app-layout (my-card)))
        `,
        '/project/lib.wire': `
          (wire
            (define my-card () (card (text "Card")))
            (layout app-layout (box (slot))))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(1);
      expect(result.document?.layouts).toHaveLength(1);
    });

    it('entry file still requires at least one screen', () => {
      const result = compile(`
        (wire
          (define my-comp () (box)))
      `);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.message.includes('at least one screen'))).toBe(true);
    });

    it('nested screenless includes work', async () => {
      const files: Record<string, string> = {
        '/project/main.wire': `
          (wire
            (include "level1.wire")
            (screen home "Home"
              (box (comp-1) (comp-2))))
        `,
        '/project/level1.wire': `
          (wire
            (include "level2.wire")
            (define comp-1 () (text "One")))
        `,
        '/project/level2.wire': `
          (wire
            (define comp-2 () (text "Two")))
        `,
      };

      const options: CompileOptions = {
        filePath: '/project/main.wire',
        resolver: createMockResolver(files),
      };

      const result = await compile(files['/project/main.wire'], options);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(2);
    });
  });

  // ===========================================================================
  // 11.9 Without Resolver
  // ===========================================================================

  describe('11.9 Without Resolver', () => {
    it('includes are parsed but not resolved without resolver', () => {
      const result = compile(`
        (wire
          (include "components.wire")
          (screen home "Home" (box)))
      `);

      // Sync compile without resolver
      expect(result.success).toBe(true);
      expect(result.document?.includes).toHaveLength(1);
      expect(result.document?.includes[0].path).toBe('components.wire');
    });

    it('compile returns sync result when no includes', () => {
      const result = compile(`
        (wire
          (screen home "Home" (box)))
      `);

      // Should be a sync result, not a Promise
      expect(result).not.toBeInstanceOf(Promise);
      expect(result.success).toBe(true);
    });
  });
});
