import * as vscode from 'vscode';
import { ApiClient } from './apiClient';

export class SnippetPanel {
  public static currentPanel: SnippetPanel | undefined;  // ✅ track current panel instance
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context?: vscode.ExtensionContext) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    const client = context ? new ApiClient(context) : undefined;

    this._panel.webview.html = this.getHtml(this._panel.webview, this._extensionUri);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === 'getSnippet') {
          try {
            const editor = vscode.window.activeTextEditor;
            const selection = editor ? editor.document.getText(editor.selection) : '';
            const language = editor ? editor.document.languageId : 'plaintext';

            if (!client) {
              throw new Error('API client not available');
            }

            const result = await client.getSuggestedSnippet({
              language,
              codeContext: selection || (editor ? editor.document.getText() : '')
            });

            this._panel.webview.postMessage({ command: 'displaySnippet', snippet: result.snippet });
          } catch (err: any) {
            const msg = err?.message ?? String(err);
            vscode.window.showErrorMessage(`XandriaAI: ${msg}`);
            this._panel.webview.postMessage({ command: 'displaySnippet', snippet: `⚠️ ${msg}` });
          }
        }

        // ✅ Handle feedback message
        else if (message.command === 'feedback') {
          const feedbackValue = message.value;
          console.log(`User feedback received: ${feedbackValue}`);
          vscode.window.showInformationMessage(`Thanks for your feedback: ${feedbackValue}`);
        }

        // ✅ Handle formatted response from extension.ts
        else if (message.type === 'formattedResponse') {
          this._panel.webview.postMessage({
            command: 'displayFormatted',
            payload: message.data
          });
        }
      },
      undefined,
      this._disposables
    );
  }

  // ✅ Create or show panel
  public static createOrShow(extensionUri: vscode.Uri, context?: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (SnippetPanel.currentPanel) {
      SnippetPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'snippetPanel',
      'Xandria AI',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    SnippetPanel.currentPanel = new SnippetPanel(panel, extensionUri, context);

    panel.onDidDispose(() => {
      SnippetPanel.currentPanel = undefined;
    });
  }

  // ✅ Allow extension.ts to send messages into the panel
  public postMessage(message: any) {
    this._panel.webview.postMessage(message);
  }

  // ✅ Load SnippetPanel.html
  private getHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const fs = require('fs');
    const path = vscode.Uri.joinPath(extensionUri, 'src', 'SnippetPanel.html');
    return fs.readFileSync(path.fsPath, 'utf8');
  }
}
