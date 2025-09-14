//import from ResponseFormatter.ts added
import * as vscode from 'vscode';
import { SnippetPanel } from './SnippetPanel';
import { registerFeedbackButton } from './Feedback_Button';
import { formatResponse } from './ResponseFormatter';  // ✅ Use external formatter

export function activate(context: vscode.ExtensionContext) {
  console.log("🚀 XandriaAI extension activating...");

  // Show panel
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.showPanel', () => {
      console.log("✅ Command triggered: xandriaai.showPanel");
      SnippetPanel.createOrShow(context.extensionUri, context);
    })
  );

  // Set API token (stored securely in SecretStorage)
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
  // Test: Format and Send JSON to SnippetPanel
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

  console.log("✅ All commands registered: showPanel, setApiToken, formatAndSend");

  // Register feedback button
  registerFeedbackButton(context);
}

export function deactivate() {
  console.log("🛑 XandriaAI extension deactivated");
}
