import * as vscode from 'vscode';
import { ApiClient } from './apiClient';

export class SnippetPanel {
  public static createOrShow(extensionUri: vscode.Uri, context?: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
      'snippetPanel',
      'Xandria AI',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.getHtml(panel.webview, extensionUri);
    const client = context ? new ApiClient(context) : undefined;

    panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === 'getSnippet') {
          try {
            const editor = vscode.window.activeTextEditor;
            const selection = editor ? editor.document.getText(editor.selection) : '';
            const language = editor ? editor.document.languageId : 'plaintext';

            if (!client) throw new Error('API client not available');

            const result = await client.getSuggestedSnippet({
              language,
              codeContext: selection || (editor ? editor.document.getText() : '')
            });

            panel.webview.postMessage({ command: 'displaySnippet', snippet: result.snippet });
          } catch (err: any) {
            const msg = err?.message ?? String(err);
            vscode.window.showErrorMessage(`XandriaAI: ${msg}`);
            panel.webview.postMessage({ command: 'displaySnippet', snippet: `⚠️ ${msg}` });
          }
        }
      },
      undefined
    );
  }

  private static getHtml(_webview: vscode.Webview, _extensionUri: vscode.Uri) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xandria AI</title>
        <style>
          body { font-family: sans-serif; padding: 1rem; background: #1e1e1e; color: #fff; }
          #snippetBox { width: 100%; min-height: 200px; background: #111; border-radius: 6px; padding: 12px; white-space: pre-wrap; }
          button { padding: 8px 12px; border-radius: 6px; border: 0; margin: 0.5rem 0; cursor: pointer; }
        </style>
      </head>
      <body>
        <h2>🔮 Xandria AI</h2>
        <p>Select some code in the editor (optional) and click Generate.</p>
        <button id="generateSnippet">Generate Snippet</button>
        <pre id="snippetBox">No snippet yet…</pre>
        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById('generateSnippet').addEventListener('click', () => {
            vscode.postMessage({ command: 'getSnippet' });
          });
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'displaySnippet') {
              document.getElementById('snippetBox').textContent = message.snippet;
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}

