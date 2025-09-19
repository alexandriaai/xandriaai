import * as vscode from 'vscode';
import { SnippetPanel } from './SnippetPanel';
import { registerFeedbackButton } from './Feedback_Button';
import { ApiClient } from './apiClient';
import { formatResponse } from './ResponseFormatter';  // ✅ Use external formatter

export function activate(context: vscode.ExtensionContext) {
  console.log("🚀 XandriaAI extension activating...");
  console.log("[XandriaAI] Extension activated ✅");

  // ---------------------
  // Show main snippet panel
  // ---------------------
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.showPanel', () => {
      console.log("✅ Command triggered: xandriaai.showPanel");
      SnippetPanel.createOrShow(context.extensionUri, context);
    })
  );

  // ---------------------
  // Store API token in VS Code SecretStorage
  // ---------------------
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.setApiToken', async () => {
      console.log("✅ Command triggered: xandriaai.setApiToken");
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

  // ---------------------
  // Run code analysis on current file or selection (AST parser work)
  // ---------------------
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

  // ---------------------
  // Format and Send (Response Formatter work)
  // ---------------------
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.formatAndSend', () => {
      console.log("✅ Command registered and running: xandriaai.formatAndSend");

      // Simulated subsystem results for now
      const rawResults = {
        snippetGenerator: { code: "console.log('Hello Xandria');" },
        docLookup: { reference: "https://docs.example.com/api" },
        feedback: { user: "Looks good!" }
      };

      const formatted = formatResponse(rawResults);
      console.log("📦 Formatted JSON:", formatted);

      // Send JSON to panel (ensure SnippetPanel has a handler for this)
      SnippetPanel.currentPanel?.postMessage({
        type: 'formattedResponse',
        data: formatted
      });

      vscode.window.showInformationMessage('Formatted response sent to panel.');
    })
  );

  console.log("✅ All commands registered: showPanel, setApiToken, testAnalyze, formatAndSend");

  // ---------------------
  // Register feedback button
  // ---------------------
  registerFeedbackButton(context);

  // If you later want inline suggestions, re-enable this:
  // registerInlineProvider(context);
}

export function deactivate() {
  console.log("🛑 XandriaAI extension deactivated");
}
