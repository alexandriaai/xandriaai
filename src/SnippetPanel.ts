import * as vscode from 'vscode';

export class SnippetPanel {
  public static createOrShow(extensionUri: vscode.Uri) {
    const panel = vscode.window.createWebviewPanel(
      'snippetPanel',
      'Xandria AI',
      vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );

    panel.webview.html = this.getHtml(panel.webview, extensionUri);

    panel.webview.onDidReceiveMessage(
      (message) => {
        if (message.command === 'getSnippet') {
          const snippets = [
            "console.log('Hello, World!');",
            "function sum(a, b) { return a + b; }",
            "const square = x => x * x;",
            "for (let i = 0; i < 10; i++) { console.log(i); }"
          ];
          const random = Math.floor(Math.random() * snippets.length);
          panel.webview.postMessage({
            command: 'displaySnippet',
            snippet: snippets[random]
          });
        }
      },
      undefined,
      []
    );
  }

  private static getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Xandria AI</title>
        <style>
          body {
            font-family: sans-serif;
            padding: 1rem;
            background-color: #1e1e1e;
            color: #ffffff;
          }
          #snippetBox {
            width: 100%;
            height: 150px;
            background: #333;
            padding: 10px;
            border: 1px solid #555;
            border-radius: 4px;
            color: white;
            white-space: pre-wrap;
          }
          button {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background-color: #007acc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #005f99;
          }
        </style>
      </head>
      <body>
        <h1>Code Snippet Generator</h1>
        <div id="snippetBox">Press the button to generate a snippet...</div>
        <button id="generateSnippet">Generate Snippet</button>

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
