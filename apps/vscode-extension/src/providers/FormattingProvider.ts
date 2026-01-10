import * as vscode from 'vscode';
import { format } from '@wirescript/dsl';

/**
 * Provides document formatting for WireScript files.
 */
export class FormattingProvider
  implements vscode.DocumentFormattingEditProvider
{
  provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    const source = document.getText();

    try {
      const formatted = format(source);

      // If formatting failed or produced same output, return empty
      if (!formatted || formatted === source) {
        return [];
      }

      // Replace entire document
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(source.length)
      );

      return [vscode.TextEdit.replace(fullRange, formatted)];
    } catch {
      // Formatting failed (likely syntax error), return empty
      return [];
    }
  }
}
