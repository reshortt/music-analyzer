import * as vscode from "vscode";
import { CompositionProjectManager } from "../managers/CompositionProjectManager";
import { getNonce } from "../utilities/nonce";
import { COMMANDS } from "../constants";

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
      CompositionProjectManager.onProjectChanged((event) => {
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

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

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
            this._updateWebview()
            break;
          case "createNewProject":
            vscode.commands.executeCommand(COMMANDS.CREATE_PROJECT.id);
            break;
          case "openProject":
            vscode.commands.executeCommand(COMMANDS.OPEN_PROJECT.id);
            break;
            
        }
      },
      undefined,
      this._disposables
    );
  }

  private _updateWebview() {
    if (this._view) {
      const projectManager = CompositionProjectManager.getInstance();
      const currentProject = projectManager.getCurrentProject();

      this._view.webview.postMessage({
        command: "projectStateChanged",
        payload: {
          project: currentProject,
        },
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._context.extensionUri,
        "out",
        "webview",
        "assets",
        "index.js"
      )
    );

    // Get the local path to main style run in the webview
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._context.extensionUri,
        "out",
        "webview",
        "assets",
        "index.css"
      )
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en" style="width: 100%; overflow-x: hidden;">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link href="${styleUri}" rel="stylesheet" />
          <title>Composition View</title>
        </head>
        <body style="width: 100%; overflow-x: hidden; padding: 0 !important;">
          <div id="root" style="width: 100%; overflow-x: hidden;"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
  }
}
