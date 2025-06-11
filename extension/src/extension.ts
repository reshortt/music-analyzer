import * as vscode from "vscode";
import { CompositionEditorPanel } from "./panels/CompositionEditorPanel";
import { CompositionProjectManager } from "./managers/CompositionProjectManager";
import { registerCommand } from "./utilities/vs-utils";
import { ProjectViewProvider } from "./views/ProjectViewProvider";
import { SourcesTreeProvider } from "./views/SourcesTreeProvider";
import { COMMANDS, VIEWS } from "./constants";

export function activate(context: vscode.ExtensionContext) {
  CompositionProjectManager.initialize(context);

  // initialize the tree view
  new SourcesTreeProvider(context, VIEWS.SOURCES_TREE);

  // initialize the project view
  new ProjectViewProvider(context, VIEWS.PROJECT_VIEW);

  registerCommand(context, COMMANDS.OPEN_COMPOSITION_EDITOR.id, () => {
    CompositionEditorPanel.render(context.extensionUri);
  });

  console.log('"music-analyzer" is now active');
}

export function deactivate() {}
