import * as vscode from "vscode";
import { HelloVegaPanel } from "./panels/HelloVegaPanel";
import { CompositionEditorPanel } from "./panels/CompositionEditorPanel";
import { CompositionProjectManager } from "./managers/CompositionProjectManager";
import { registerCommand } from "./utilities/vs-utils";
import { ProjectViewProvider } from "./views/ProjectViewProvider";
import { SourcesTreeProvider } from "./views/SourcesTreeProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('"music-analyzer" is now active');

  CompositionProjectManager.initialize(context);

  // initialize the tree view
  new SourcesTreeProvider(context, "music-analyzer.sourcesTree");

  // initialize the project view
  new ProjectViewProvider(context, "music-analyzer.projectView");

  registerCommand(context, "music-analyzer.openCompositionEditor", () => {
    CompositionEditorPanel.render(context.extensionUri);
  });

  registerCommand(context, "music-analyzer.helloVega", () => {
    HelloVegaPanel.render(context.extensionUri);
  });
}

export function deactivate() {}
