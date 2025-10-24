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

    // ✅ Load HTML content
    this._panel.webview.html = this.getHtml(this._panel.webview, this._extensionUri);

    // ✅ Handle incoming messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === 'getSnippet') {
          try {
            const language = message.language || 'python';
            const codeContext = message.codeContext || '';

            if (!client) throw new Error('API client not available.');
            if (!codeContext.trim()) throw new Error('No code or prompt provided.');

            // ✅ Request snippet from backend
            const result = await client.getSuggestedSnippet({ language, codeContext });

            this._panel.webview.postMessage({
              command: 'displaySnippet',
              snippet: result.snippet || '// No output received from backend.'
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

  // ✅ Create or reveal panel
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

  public postMessage(message: any) {
    this._panel.webview.postMessage(message);
  }

  // ✅ Updated HTML with working Generate button
  private getHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const media = vscode.Uri.joinPath(extensionUri, 'media');
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(media, 'styles.css'));
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
    );

    const csp = `
      default-src 'none';
      img-src ${webview.cspSource} data:;
      style-src ${webview.cspSource} 'unsafe-inline';
      script-src ${webview.cspSource} 'unsafe-inline';
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
      <img src="${webview.asWebviewUri(vscode.Uri.joinPath(media, 'xandria_logo.png'))}" alt="XandriaAI Logo" class="logo" />
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

  <script>
    const vscode = acquireVsCodeApi();

    document.getElementById("generate").addEventListener("click", () => {
      const codeInput = document.getElementById("codeInput").value.trim();
      const status = document.getElementById("status");
      status.textContent = "⏳ Generating...";
      vscode.postMessage({
        command: "getSnippet",
        language: "python", // can be dynamic later
        codeContext: codeInput
      });
    });

    document.getElementById("clear").addEventListener("click", () => {
      document.getElementById("codeInput").value = "";
      document.getElementById("output").textContent = "";
    });

    document.getElementById("copy").addEventListener("click", async () => {
      const output = document.getElementById("output").textContent;
      await navigator.clipboard.writeText(output);
    });

    document.getElementById("insert").addEventListener("click", () => {
      const output = document.getElementById("output").textContent;
      vscode.postMessage({ type: "insertSnippet", text: output });
    });

    window.addEventListener("message", (event) => {
      const message = event.data;
      const outputEl = document.getElementById("output");
      const status = document.getElementById("status");

      if (message.command === "displaySnippet") {
        outputEl.textContent = message.snippet;
        status.textContent = "✅ Done.";
      }
    });
  </script>
</body>
</html>`;
  }
}
