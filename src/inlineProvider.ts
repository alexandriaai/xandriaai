import * as vscode from 'vscode';
import { ApiClient } from './apiClient';

export function registerInlineProvider(context: vscode.ExtensionContext) {
  const provider: vscode.InlineCompletionItemProvider = {
    async provideInlineCompletionItems(doc, pos, _ctx, _token) {
      try {
        const client = new ApiClient(context);

        // Use current line + a small context window
        const startLine = Math.max(0, pos.line - 20);
        const range = new vscode.Range(startLine, 0, pos.line, pos.character);
        const codeContext = doc.getText(range);
        const language = doc.languageId;

        const res = await client.getSuggestedSnippet({ language, codeContext });

        if (!res?.snippet?.trim()) return { items: [] };

        // Show as a single-line ghost text starting at the cursor
        const item = new vscode.InlineCompletionItem(res.snippet, new vscode.Range(pos, pos));
        return { items: [item] };
      } catch {
        return { items: [] };
      }
    }
  };

  const selector: vscode.DocumentSelector = [
    { language: 'python', scheme: 'file' },
    { language: 'javascript', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
  ];

  const sub = vscode.languages.registerInlineCompletionItemProvider(selector, provider);
  context.subscriptions.push(sub);
}
