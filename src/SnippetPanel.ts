import * as vscode from 'vscode';
import { ApiClient } from './apiClient';

export class SnippetPanel {
  public static currentPanel: SnippetPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context?: vscode.ExtensionContext) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    const client = context ? new ApiClient(context) : undefined;

    // Load HTML content into the Webview
    this._panel.webview.html = this.getHtml(this._panel.webview, this._extensionUri);

    // Handle incoming messages from the Webview
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

            this._panel.webview.postMessage({
              command: 'displaySnippet',
              snippet: result.snippet
            });
          } catch (err: any) {
            const msg = err?.message ?? String(err);
            vscode.window.showErrorMessage(`XandriaAI: ${msg}`);
            this._panel.webview.postMessage({
              command: 'displaySnippet',
              snippet: `⚠️ ${msg}`
            });
          }
        } 
        
        else if (message.command === 'feedback') {
          vscode.window.showInformationMessage(`Thanks for your feedback: ${message.value}`);
        } 
        
        else if (message.type === 'formattedResponse') {
          this._panel.webview.postMessage({
            command: 'displayFormatted',
            payload: message.data
          });
        } 
        
        else if (message.type === 'insertSnippet' && message.text) {
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            await editor.insertSnippet(new vscode.SnippetString(message.text), editor.selection.start);
          }
        }
      },
      undefined,
      this._disposables
    );
  }

  // Create or reveal existing panel
  public static createOrShow(extensionUri: vscode.Uri, context?: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (SnippetPanel.currentPanel) {
      SnippetPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'snippetPanel',
      'Xandria AI',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode', 'codicons', 'dist')
        ]
      }
    );

    SnippetPanel.currentPanel = new SnippetPanel(panel, extensionUri, context);

    panel.onDidDispose(() => {
      SnippetPanel.currentPanel = undefined;
    });
  }

  // Post messages from extension.ts to the webview
  public postMessage(message: any) {
    this._panel.webview.postMessage(message);
  }

  // Load HTML template for the Webview
  private getHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const media = vscode.Uri.joinPath(extensionUri, 'media');
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(media, 'styles.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(media, 'script.js'));
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
    );

    const csp = `
      default-src 'none';
      img-src ${webview.cspSource} data:;
      style-src ${webview.cspSource} 'unsafe-inline';
      script-src ${webview.cspSource};
      font-src ${webview.cspSource};
    `;

    return /* html */ `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="${codiconsUri}" rel="stylesheet">
  <link href="${stylesUri}" rel="stylesheet">
  <title>Xandria AI: – Code Snippet Generator</title>
</head>
<body>
  <div class="container">
  <header class="header">
  <img src="${webview.asWebviewUri(vscode.Uri.joinPath(media, 'xandria_logo.png'))}" 
       alt="XandriaAI Logo" class="logo" />
  <h1>XandriaAI:</h1>
  <p class="subtle">Your AI-powered code snippet generator</p>
</header>


    <section class="card">
      <label class="field-label" for="codeInput">Input Code</label>
      <textarea id="codeInput" placeholder="Paste your code here..."></textarea>
      <div class="row">
        <div class="btn-group">
          <button id="generate" class="btn primary"><i class="codicon codicon-play"></i> Generate</button>
          <button id="clear" class="btn"><i class="codicon codicon-trash"></i> Clear</button>
        </div>
        <div id="status" class="status" aria-live="polite"></div>
      </div>
    </section>

    <section class="card">
      <div class="card-header">
        <span>Output</span>
        <div class="tools">
          <button id="copy" class="icon-btn" title="Copy"><i class="codicon codicon-clippy"></i></button>
          <button id="insert" class="icon-btn" title="Insert into editor"><i class="codicon codicon-symbol-snippet"></i></button>
        </div>
      </div>
      <pre id="output" class="output" tabindex="0" aria-label="Generated snippet output">💡 Press "Generate" to create a snippet!</pre>
    </section>
  </div>

  <div id="toast" class="toast" hidden>
    <i class="codicon codicon-info"></i><span id="toastText"></span>
  </div>

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
