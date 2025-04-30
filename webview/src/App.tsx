import { useState, useEffect } from "react";
import { vscode } from "./utilities/vscode";
import "@vscode-elements/elements/dist/bundled.js";
import "@vscode-elements/elements/dist/main.d.ts";
import CompositionEditorPanel from "./panels/CompositionEditorPanel";
import HelloVegaPanel from "./panels/HelloVegaPanel";
import ProjectViewPanel from "./panels/ProjectViewPanel";

function App() {
  const [viewType, setViewType] = useState<string>();

  useEffect(() => {
    // Listen for messages from the extension
    const messageListener = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case "setView":
          setViewType(message.viewType);
          break;
      }
    };

    window.addEventListener("message", messageListener);

    // Send a message to the extension on load
    vscode.postMessage({
      command: "webviewLoaded",
    });

    return () => window.removeEventListener("message", messageListener);
  }, []);

  if (viewType === undefined) {
    return <p>Loading...</p>;
  }

  if (viewType === "compositionEditor") {
    return <CompositionEditorPanel />;
  }
  if (viewType === "helloVega") {
    return <HelloVegaPanel />;
  }
  if (viewType === "projectView") {
    return <ProjectViewPanel />;
  }

  return <p>INVALID TYPE {viewType} </p>;
}

export default App;
