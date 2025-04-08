import * as vscode from "vscode";
import { HelloVegaPanel } from "./panels/HelloVegaPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log('"music-analyzer" is now active');

  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.helloWorld", () => {
      vscode.window.showInformationMessage(
        "Hello World from Music Analyzer Mr White!!"
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.openWebview", () => {
      HelloVegaPanel.render(context.extensionUri);
    })
  );
}

export function deactivate() {}