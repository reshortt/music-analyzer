import * as vscode from "vscode";

export function registerCommand(
  context: vscode.ExtensionContext,
  command: string,
  callback: () => void
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(command, callback)
  );
}

export function showMessage(message: string) {
  vscode.window.showInformationMessage(message);
}

export function showErrorMessage(message: string) {
  vscode.window.showErrorMessage(message);
}
