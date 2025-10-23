import * as vscode from 'vscode';
import { SnippetPanel } from './SnippetPanel';
import { registerFeedbackButton } from './Feedback_Button';
import { ApiClient } from './apiClient';
import { formatResponse } from './ResponseFormatter';
import { registerInlineProvider } from './inlineProvider';
import * as fs from "fs";
import * as path from "path";
console.log("🟣 XandriaAI Extension Booting — Debug Logging Enabled");


let config: any;

try {
  // look both in out/.. and directly in extension root
  const rootPath = path.join(__dirname, "..", "config.json");
  const fallbackPath = path.join(__dirname, "../..", "config.json");

  const configPath = fs.existsSync(rootPath) ? rootPath : fallbackPath;
  const rawData = fs.readFileSync(configPath, "utf-8");
  config = JSON.parse(rawData);

  console.log(`[XandriaAI] Loaded config from ${configPath}`);
  console.log(`[XandriaAI] Project: ${config.projectName}, version ${config.version}`);
} catch (err) {
  console.error("[XandriaAI] Failed to load config.json:", err);
}

// ---------------------
// Extension Activation
// ---------------------
export function activate(context: vscode.ExtensionContext) {
  console.log("🚀 XandriaAI extension activating...");
  console.log("[XandriaAI] Extension activated ✅");

  registerInlineProvider(context);

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
  // Display config-based message (optional)
  // ---------------------
  if (config && config.frontend?.showLogs) {
    vscode.window.showInformationMessage(
      `🚀 ${config.projectName} loaded (Theme: ${config.frontend.theme})`
    );
  }

  // ---------------------
  // Store API token
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
  // Run code analysis (3.1 AST Parser)
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
        const result = await client.analyzeCode({
          code,
          languageId: language,
          fileName: editor.document.fileName
        });

        vscode.window.showInformationMessage(
          `AST Parser: Found ${result.analysis.functions.length} functions and ${result.analysis.classes.length} classes`
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to analyze code: ${err?.message || err}`);
      }
    })
  );

  // ---------------------
  // Format and Send (2.3 Response Formatter)
  // ---------------------
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.formatAndSend', () => {
      console.log("✅ Command registered and running: xandriaai.formatAndSend");

      const rawResults = {
        snippetGenerator: { code: "console.log('Hello Xandria');" },
        docLookup: { reference: "https://docs.example.com/api" },
        feedback: { user: "Looks good!" }
      };

      const formatted = formatResponse(rawResults);
      console.log("📦 Formatted JSON:", formatted);

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
}

// ---------------------
// Extension Deactivation
// ---------------------
export function deactivate() {
  console.log("🛑 XandriaAI extension deactivated");
}
