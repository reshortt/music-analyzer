import * as vscode from "vscode";
import { ProjectStore } from "../stores/ProjectStore";
import { COMMANDS } from "../constants";
import { getHtmlForWebview } from "../utilities/webview";
import { EXT_MESSAGES } from "@music-analyzer/shared";

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
      ProjectStore.onProjectChanged(() => {
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
          case EXT_MESSAGES.WEBVIEW_LOADED:
            // Set the view type when the webview is loaded
            webviewView.webview.postMessage({
              command: EXT_MESSAGES.SET_VIEW,
              viewType: "projectView",
            });
            webviewView.webview.postMessage({
              command: EXT_MESSAGES.PROJECT_TOKEN,
              token: ProjectStore.getStore().getProject()?.location,
            });
            break;
          case EXT_MESSAGES.WEBVIEW_VIEW_LOADED:
            this._updateWebview();
            break;
          case EXT_MESSAGES.CREATE_PROJECT:
            vscode.commands.executeCommand(COMMANDS.CREATE_PROJECT.id);
            break;
          case EXT_MESSAGES.OPEN_PROJECT:
            vscode.commands.executeCommand(COMMANDS.OPEN_PROJECT.id);
            break;
          case EXT_MESSAGES.OPEN_COMPOSITION_EDITOR:
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

    const projectManager = ProjectStore.getStore();
    const currentProject = projectManager.getProject();

    this._view.webview.postMessage({
      command: EXT_MESSAGES.PROJECT_TOKEN,
      token: ProjectStore.getStore().getProject()?.location,
    });

    this._view.title = currentProject?.name || "Untitled Project";
  }
}
