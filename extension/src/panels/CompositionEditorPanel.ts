import { WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { VegaPanel } from "./VegaPanel";

export class CompositionEditorPanel extends VegaPanel {
  public static currentPanel: CompositionEditorPanel | undefined;
  private static viewType = "compositionEditor";
  private static title = "Composition Editor";

  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    super(panel, extensionUri, CompositionEditorPanel.viewType);
  }

  public static render(extensionUri: Uri) {
    if (CompositionEditorPanel.currentPanel) {
      // If the webview panel already exists reveal it
      CompositionEditorPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        CompositionEditorPanel.viewType,
        CompositionEditorPanel.title,
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          enableScripts: true,
          localResourceRoots: [Uri.joinPath(extensionUri, "out")],
        }
      );

      CompositionEditorPanel.currentPanel = new CompositionEditorPanel(
        panel,
        extensionUri
      );
    }
  }

  public dispose() {
    CompositionEditorPanel.currentPanel = undefined;
    super.dispose();
  }
}
