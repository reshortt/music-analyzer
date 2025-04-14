import * as vscode from "vscode";
import { CompositionProjectManager, CompositionProject } from "../managers/CompositionProjectManager";

export class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined | null | void> = new vscode.EventEmitter<ProjectTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {
    // No need to pass projectManager as a parameter, we'll use the singleton
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ProjectTreeItem): Thenable<ProjectTreeItem[]> {
    if (!element) {
      // Root level
      return this._getRootItems();
    }

    return Promise.resolve([]);
  }

  private async _getRootItems(): Promise<ProjectTreeItem[]> {
    // Get the project manager instance
    const projectManager = CompositionProjectManager.getInstance();
    const currentProject = projectManager.getCurrentProject();
    
    if (currentProject) {
      // Project is loaded
      return [
        new ProjectTreeItem(
          `Project: ${currentProject.name}`,
          vscode.TreeItemCollapsibleState.None,
          "project",
          {
            command: "music-analyzer.openProject",
            title: "Open Project",
            arguments: []
          }
        ),
        new ProjectTreeItem(
          `Location: ${currentProject.location}`,
          vscode.TreeItemCollapsibleState.None,
          "folder",
          undefined
        ),
        new ProjectTreeItem(
          "Create New Project",
          vscode.TreeItemCollapsibleState.None,
          "add",
          {
            command: "music-analyzer.createProject",
            title: "Create Project",
            arguments: []
          }
        )
      ];
    } else {
      // No project loaded
      return [
        new ProjectTreeItem(
          "No project loaded",
          vscode.TreeItemCollapsibleState.None,
          "info",
          undefined
        ),
        new ProjectTreeItem(
          "Create New Project",
          vscode.TreeItemCollapsibleState.None,
          "add",
          {
            command: "music-analyzer.createProject",
            title: "Create Project",
            arguments: []
          }
        ),
        new ProjectTreeItem(
          "Load Project",
          vscode.TreeItemCollapsibleState.None,
          "folder-opened",
          {
            command: "music-analyzer.openProject",
            title: "Load Project",
            arguments: []
          }
        )
      ];
    }
  }
}

class ProjectTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly icon: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = label;
    this.description = "";
    this.iconPath = new vscode.ThemeIcon(icon);
    if (command) {
      this.command = command;
    }
  }
} 