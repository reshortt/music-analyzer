import { WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { VegaPanel } from "./VegaPanel";

export class HelloVegaPanel extends VegaPanel {
  public static currentPanel: HelloVegaPanel | undefined;
  private static viewType = "showHelloWorld";
  private static title = "Hello Vega";

  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    super(panel, extensionUri, HelloVegaPanel.viewType);
  }

  public static render(extensionUri: Uri) {
    if (HelloVegaPanel.currentPanel) {
      // If the webview panel already exists reveal it
      HelloVegaPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        HelloVegaPanel.viewType,
        HelloVegaPanel.title,
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          enableScripts: true,
          localResourceRoots: [Uri.joinPath(extensionUri, "out")],
        }
      );

      HelloVegaPanel.currentPanel = new HelloVegaPanel(panel, extensionUri);
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    HelloVegaPanel.currentPanel = undefined;
    super.dispose();
  }
}
