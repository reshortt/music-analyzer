import * as vscode from "vscode";
import { CompositionProjectManager } from "../managers/CompositionProjectManager";
import { COMMANDS } from "../constants";
import { getHtmlForWebview } from "../utilities/webview";

export class ProjectViewProvider implements vscode.WebviewViewProvider {
  private _viewId: string;
  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext, viewId: string) {
    this._context = context;
    this._viewId = viewId;

    // Subscribe to project changes
    this._disposables.push(
      CompositionProjectManager.onProjectChanged(() => {
        this._updateWebview();
      })
    );

    // register the view provider
    this._disposables.push(
      vscode.window.registerWebviewViewProvider(viewId, this)
    );
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._context.extensionUri,
        vscode.Uri.joinPath(this._context.extensionUri, "out", "webview"),
      ],
    };

    webviewView.webview.html = getHtmlForWebview(
      webviewView.webview,
      this._context.extensionUri
    );

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      async (data) => {
        switch (data.command) {
          case "webviewLoaded":
            // Set the view type when the webview is loaded
            webviewView.webview.postMessage({
              command: "setView",
              viewType: "projectView",
            });
            break;
          case "webviewViewLoaded":
            this._updateWebview();
            break;
          case "createNewProject":
            vscode.commands.executeCommand(COMMANDS.CREATE_PROJECT.id);
            break;
          case "openProject":
            vscode.commands.executeCommand(COMMANDS.OPEN_PROJECT.id);
            break;
          case "openCompositionEditor":
            vscode.commands.executeCommand(COMMANDS.OPEN_COMPOSITION_EDITOR.id);
            break;
        }
      },
      undefined,
      this._disposables
    );
  }

  private _updateWebview() {
    if (!this._view) {
      return;
    }

    const projectManager = CompositionProjectManager.getInstance();
    const currentProject = projectManager.getCurrentProject();

    this._view.webview.postMessage({
      command: "projectStateChanged",
      payload: {
        project: currentProject,
      },
    });

    this._view.title = currentProject?.name || "Untitled Project";
  }
}
