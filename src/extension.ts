import * as vscode from 'vscode';
import { SnippetPanel } from './SnippetPanel';
import { registerFeedbackButton } from './Feedback_Button';
// import { registerInlineProvider } from './inlinesuggestion';
import { ApiClient } from './apiClient';

export function activate(context: vscode.ExtensionContext) {
  console.log("[XandriaAI] Extension activated ✅");

  // Show main snippet panel
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.showPanel', () => {
      SnippetPanel.createOrShow(context.extensionUri, context);
    })
  );

  // Store API token in VS Code SecretStorage
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.setApiToken', async () => {
      const token = await vscode.window.showInputBox({
        prompt: 'Enter XandriaAI API token',
        ignoreFocusOut: true,
        password: true,
        placeHolder: 'paste your token…'
      });
      if (token) {
        await context.secrets.store('xandriaai.apiToken', token);
        vscode.window.showInformationMessage('XandriaAI token saved securely.');
      }
    })
  );

  // Run code analysis on current file or selection
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.testAnalyze', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor. Open a file first.");
        return;
      }

      const selection = editor.selection;
      const code = editor.document.getText(selection) || editor.document.getText();
      const language = editor.document.languageId;

      try {
        const client = new ApiClient(context);
        const response = await client.getSuggestedSnippet({
          language,
          codeContext: code
        });
        vscode.window.showInformationMessage(
          `XandriaAI response: ${response.snippet}`
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Failed to analyze code: ${err?.message || err}`
        );
      }
    })
  );

  // Feedback button in status bar
  registerFeedbackButton(context);

  // If you later want inline suggestions, re-enable this:
  // registerInlineProvider(context);
}

export function deactivate() {}
