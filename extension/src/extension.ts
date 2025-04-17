import * as vscode from "vscode";
import { HelloVegaPanel } from "./panels/HelloVegaPanel";
import { CompositionEditorPanel } from "./panels/CompositionEditorPanel";
import { CompositionProjectManager } from "./managers/CompositionProjectManager";
import { ProjectTreeProvider } from "./views/ProjectTreeProvider";
import { registerCommand } from "./utilities/commands";

export function activate(context: vscode.ExtensionContext) {
  console.log('"music-analyzer" is now active');

  // initialize the project manager
  CompositionProjectManager.getInstance(context);

  // initialize the tree view
  const projectTreeProvider = new ProjectTreeProvider();
  vscode.window.registerTreeDataProvider(
    "music-analyzer.projectView",
    projectTreeProvider
  );

  // Subscribe to project changes to refresh the tree view
  context.subscriptions.push(
    CompositionProjectManager.onProjectChanged(() => {
      projectTreeProvider.refresh();
    })
  );

  registerCommand(context, "music-analyzer.openCompositionEditor", () => {
    CompositionEditorPanel.render(context.extensionUri);
  });

  // Webview-related commands
  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.helloVega", () => {
      HelloVegaPanel.render(context.extensionUri);
    })
  );
}

export function deactivate() {}
