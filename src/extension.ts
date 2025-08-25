import * as vscode from 'vscode';
import { SnippetPanel } from './SnippetPanel';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fetch from 'node-fetch';

export function activate(context: vscode.ExtensionContext) {
  console.log("[XandriaAI] Extension activated ✅");

  // Existing Show Panel command
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.showPanel', () => {
      vscode.window.showInformationMessage("XandriaAI: Show Panel triggered");
      SnippetPanel.createOrShow(context.extensionUri);
    })
  );

  // New Capture and Send command
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.captureAndSend', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('Open a file to capture code.');
        return;
      }

      const selection = editor.selection;
      const code = editor.document.getText(selection) || editor.document.getText();
      if (!code) {
        vscode.window.showInformationMessage('No code found to send.');
        return;
      }

      const backendUrl = vscode.workspace.getConfiguration().get<string>('xandriaai.backendUrl')
        || 'http://localhost:5000/analyze';

      try {
        const res = await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            languageId: editor.document.languageId,
            fileName: editor.document.fileName
          })
        });

        if (!res.ok) {
          vscode.window.showErrorMessage(`Backend error ${res.status}: ${await res.text()}`);
          return;
        }

        const data = await res.json();
        vscode.window.showInformationMessage(`Xandria response: ${JSON.stringify(data).slice(0, 180)}…`);
      } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to send code: ${e?.message || e}`);
      }
    })
  );
}
