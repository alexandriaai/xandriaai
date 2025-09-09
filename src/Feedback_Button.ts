import * as vscode from 'vscode';

export function registerFeedbackButton(context: vscode.ExtensionContext) {
  // Create a feedback button in the status bar
  const feedbackBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  feedbackBtn.text = "$(comment-discussion) Feedback";
  feedbackBtn.tooltip = "Send feedback on code suggestions";
  feedbackBtn.command = "xandriaai.sendFeedback";
  feedbackBtn.show();
  context.subscriptions.push(feedbackBtn);

  // Register the command
  const disposable = vscode.commands.registerCommand("xandriaai.sendFeedback", async () => {
    const feedback = await vscode.window.showInputBox({ prompt: "Enter your feedback" });
    if (feedback) {
      vscode.window.showInformationMessage("Thanks for your feedback!");
    }
  });
  context.subscriptions.push(disposable);
}