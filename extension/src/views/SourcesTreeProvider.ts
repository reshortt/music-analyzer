import * as vscode from "vscode";
import { CompositionProjectManager } from "../managers/CompositionProjectManager";

export class SourcesTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _disposables: vscode.Disposable[] = [];
  private _context: vscode.ExtensionContext;
  private _viewId: string;

  constructor(context: vscode.ExtensionContext, viewId: string) {
    this._context = context;
    this._viewId = viewId;

    // Subscribe to project changes to refresh the tree view
    this._disposables.push(
      CompositionProjectManager.onProjectChanged(() => {
        this.refresh();
      })
    );

    // register the tree view provider
    this._disposables.push(
      vscode.window.registerTreeDataProvider(viewId, this)
    );
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      // Root level
      return this._getRootItems();
    }

    return Promise.resolve([]);
  }

  private async _getRootItems(): Promise<vscode.TreeItem[]> {
    // Get the project manager instance
    const projectManager = CompositionProjectManager.getInstance();
    const currentProject = projectManager.getCurrentProject();

    if (currentProject) {
      // Project is loaded
      return [
        this._createTreeItem(
          `Project: ${currentProject.name}`,
          vscode.TreeItemCollapsibleState.None,
          "project",
          {
            command: "music-analyzer.openProject",
            title: "Open Project",
            arguments: [],
          }
        ),
        this._createTreeItem(
          `Location: ${currentProject.location}`,
          vscode.TreeItemCollapsibleState.None,
          "folder"
        ),
        this._createTreeItem(
          "Create New Project",
          vscode.TreeItemCollapsibleState.None,
          "add",
          {
            command: "music-analyzer.createProject",
            title: "Create Project",
            arguments: [],
          }
        ),
      ];
    }

    // No project loaded
    return [
      this._createTreeItem(
        "No project loaded",
        vscode.TreeItemCollapsibleState.None,
        "info"
      ),
      this._createTreeItem(
        "Create New Project",
        vscode.TreeItemCollapsibleState.None,
        "add",
        {
          command: "music-analyzer.createProject",
          title: "Create Project",
          arguments: [],
        }
      ),
      this._createTreeItem(
        "Load Project",
        vscode.TreeItemCollapsibleState.None,
        "folder-opened",
        {
          command: "music-analyzer.openProject",
          title: "Load Project",
          arguments: [],
        }
      ),
    ];
  }

  private _createTreeItem(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    icon: string,
    command?: vscode.Command
  ): vscode.TreeItem {
    const item = new vscode.TreeItem(label, collapsibleState);
    item.tooltip = label;
    item.description = "";
    item.iconPath = new vscode.ThemeIcon(icon);
    if (command) {
      item.command = command;
    }
    return item;
  }
}
