import * as vscode from "vscode";
import { HelloVegaPanel } from "./panels/HelloVegaPanel";
import { CompositionEditorPanel } from "./panels/CompositionEditorPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log('"music-analyzer" is now active');

  // General commands
  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.helloWorld", () => {
      vscode.window.showInformationMessage(
        "Hello World from Music Analyzer Mr White!!"
      );
    })
  );

  // Composition editor-related commands
  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.compositionEditor", () => {
      vscode.window.showInformationMessage(
        "Welcome to the Composition Editor!"
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.openCompositionEditor", () => {
      CompositionEditorPanel.render(context.extensionUri);
    })
  );

  // Webview-related commands
  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.openWebview", () => {
      HelloVegaPanel.render(context.extensionUri);
    })
  );
}

export function deactivate() {}