import { Disposable, Webview, window, WebviewPanel, Uri } from "vscode";
import { getHtmlForWebview } from "../utilities/webview";
import { EXT_MESSAGES } from "@music-analyzer/shared";
import { ProjectStore } from "../stores/ProjectStore";

/**
 * Base class for all panels. Uses the same react build.
 */
export abstract class BasePanel {
  protected readonly _panel: WebviewPanel;
  protected readonly _extensionUri: Uri;
  protected _disposables: Disposable[] = [];
  protected _viewType: string;

  constructor(panel: WebviewPanel, extensionUri: Uri, viewType: string) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._viewType = viewType;

    // Set an event listener to listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = getHtmlForWebview(
      this._panel.webview,
      extensionUri
    );

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;

        switch (command) {
          case EXT_MESSAGES.WEBVIEW_LOADED:
            // React app is now loaded and ready to receive messages
            webview.postMessage({
              command: EXT_MESSAGES.SET_VIEW,
              viewType: this._viewType,
            });
            webview.postMessage({
              command: EXT_MESSAGES.PROJECT_TOKEN,
              token: ProjectStore.getStore().getProject()?.location,
            });
            break;
        }
      },
      undefined,
      this._disposables
    );
  }
}
