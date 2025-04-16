import * as vscode from "vscode";
import { HelloVegaPanel } from "./panels/HelloVegaPanel";
import { CompositionEditorPanel } from "./panels/CompositionEditorPanel";
import { CompositionProjectManager } from "./managers/CompositionProjectManager";
import { ProjectTreeProvider } from "./views/ProjectTreeProvider";



export function activate(context: vscode.ExtensionContext) {


  const projectManager = CompositionProjectManager.getInstance(context)
  const projectTreeProvider = new ProjectTreeProvider()
  vscode.window.registerTreeDataProvider("music-analyzer.projectView", projectTreeProvider)

  console.log('"music-analyzer" is now active');


  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.openCompositionEditor", () => {
      CompositionEditorPanel.render(context.extensionUri);
    })
  );

  // Webview-related commands
  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.helloVega", () => {
      HelloVegaPanel.render(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("music-analyzer.createProject", async () => {
      const projName = await vscode.window.showInputBox({
        title: "New Project Name",
        placeHolder: "My New Project",
        prompt: "Enter a new project name"
      }
      );
      if (!projName) return;
      const projLocation = await vscode.window.showOpenDialog({
        openLabel: "Select project location",
        canSelectFiles: false,
        canSelectFolders: true,
        title: "Select project folder"
      })
      if (!projLocation || projLocation.length === 0) return;

      await projectManager.createNewProject(projName, projLocation[0].fsPath)
      projectTreeProvider.refresh()
    })
  );
}

export function deactivate() { }