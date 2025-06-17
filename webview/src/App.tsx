import { useState, useEffect } from "react";
import { useExtensionListener, vscode } from "./utilities/vscode";
import CompositionEditorPanel from "./panels/CompositionEditorPanel";
import ProjectView from "./panels/ProjectView";
import { EXT_MESSAGES, VIEW_TYPES } from "@music-analyzer/shared";

function App() {
  const [viewType, setViewType] = useState<string>();

  useExtensionListener(EXT_MESSAGES.SET_VIEW, (event) => {
    setViewType(event.data.viewType);
  });

  useEffect(() => {
    // Send a message to the extension on load
    vscode.postMessage({ command: EXT_MESSAGES.WEBVIEW_LOADED });
  }, []);

  if (viewType === undefined) {
    return <p>Loading...</p>;
  }

  if (viewType === VIEW_TYPES.COMPOSITION_EDITOR) {
    return <CompositionEditorPanel />;
  }

  if (viewType === VIEW_TYPES.PROJECT_VIEW) {
    return <ProjectView />;
  }

  return <p>INVALID TYPE {viewType} </p>;
}

export default App;
