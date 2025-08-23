import * as vscode from 'vscode';
import { SnippetPanel } from './SnippetPanel';  // You’ll create this next

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.showPanel', () => {
      SnippetPanel.createOrShow(context.extensionUri);
    })
  );
}

export function deactivate() {}
