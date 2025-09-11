import * as vscode from 'vscode';
import { SnippetPanel } from './SnippetPanel';
import {registerFeedbackButton} from './Feedback_Button';
//import {registerInlineProvider} from './inlinesuggestion';

export function activate(context: vscode.ExtensionContext) {
  // Show panel
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.showPanel', () => {
      SnippetPanel.createOrShow(context.extensionUri, context);
    })
  );

  // Set API token (stored securely in SecretStorage)
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
  registerFeedbackButton(context);
  //registerInlineProvider(context);
}

export function deactivate() {}
