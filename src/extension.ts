import * as vscode from 'vscode';
import { SnippetPanel } from './SnippetPanel';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('xandriaai.showPanel', () => {
      SnippetPanel.createOrShow(context.extensionUri); // ✅ Only this!
    })
  );
}

export function deactivate() {}
