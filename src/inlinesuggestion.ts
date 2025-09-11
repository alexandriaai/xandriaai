import * as vscode from 'vscode';

export function registerInlineProvider(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: "**" }, // you can narrow this by language
    {
      provideInlineCompletionItems(document, position, ctx, token) {
        console.log("🔮 Inline provider called at line", position.line);
        const linePrefix = document.lineAt(position).text.substring(0, position.character);

      
          return [
            {
              insertText: "log('Hello from XandriaAI');",
              range: new vscode.Range(position, position),
            },
          ];
        

        
      }
    }
  );

  context.subscriptions.push(provider);
}
