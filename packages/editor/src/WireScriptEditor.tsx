import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language';
import { lintKeymap } from '@codemirror/lint';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import { useCallback, useEffect, useRef } from 'react';
import { wireScript } from './language/index.js';
import { wireScriptTheme } from './themes/wirescript-theme.js';

// Compartments for dynamic reconfiguration
const themeCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

export interface WireScriptEditorProps {
  /** Initial source code */
  value?: string;
  /** Called when the content changes */
  onChange?: (value: string) => void;
  /** Use dark theme */
  dark?: boolean;
  /** Make editor read-only */
  readOnly?: boolean;
  /** Additional extensions */
  extensions?: Extension[];
  /** CSS class for the container */
  className?: string;
  /** Inline styles for the container */
  style?: React.CSSProperties;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
}

/**
 * CodeMirror 6 editor component for WireScript
 */
export function WireScriptEditor({
  value = '',
  onChange,
  dark = false,
  readOnly = false,
  extensions = [],
  className,
  style,
  autoFocus = false,
  placeholder,
}: WireScriptEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create update listener
  const updateListener = useCallback(() => {
    return EditorView.updateListener.of((update) => {
      if (update.docChanged && onChangeRef.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });
  }, []);

  // Initialize editor (only once on mount)
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: [
        // Basic setup
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),

        // Keymaps
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),

        // WireScript language
        wireScript(),

        // Theme (in compartment for dynamic updates)
        themeCompartment.of(wireScriptTheme(dark)),

        // Read-only mode (in compartment for dynamic updates)
        readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),

        // Change listener
        updateListener(),

        // Placeholder
        placeholder ? EditorView.contentAttributes.of({ 'data-placeholder': placeholder }) : [],

        // User extensions
        ...extensions,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    if (autoFocus) {
      view.focus();
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoFocus,
    dark,
    extensions,
    placeholder,
    readOnly, // Change listener
    updateListener,
  ]); // Only run once on mount - value updates handled by separate effect

  // Update content when value prop changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
    }
  }, [value]);

  // Update theme when dark prop changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    // Reconfigure theme compartment
    view.dispatch({
      effects: themeCompartment.reconfigure(wireScriptTheme(dark)),
    });
  }, [dark]);

  // Update readOnly when prop changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    // Reconfigure readOnly compartment
    view.dispatch({
      effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: '100%',
        overflow: 'auto',
        ...style,
      }}
    />
  );
}

/**
 * Get the current EditorView instance (for advanced use cases)
 */
export function useEditorView(_ref: React.RefObject<HTMLDivElement>): EditorView | null {
  // This would need to be connected to the actual view ref
  // For now, this is a placeholder
  return null;
}
