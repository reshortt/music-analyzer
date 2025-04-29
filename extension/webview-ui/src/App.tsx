import { useState, useEffect } from "react";
import "./App.css";
import { vscode } from "./utilities/vscode";
import "@vscode-elements/elements/dist/bundled.js";
import CompositionEditorPanel from "./panels/CompositionEditorPanel";
import HelloVegaPanel from "./panels/HelloVegaPanel";

function App() {
  const [viewType, setViewType] = useState<string>()

  useEffect(() => {
    // Listen for messages from the extension
    const messageListener = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case "setView":
          setViewType(message.viewType)
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

  if (viewType == "compositionEditor") {
    return <CompositionEditorPanel />
  }
  else if (viewType == "helloVega") {
    return <HelloVegaPanel />
  }
  else if (viewType == undefined) {
    return <p>Loading...</p>
  }
  else {
    return <p>INVALID TYPE {viewType} </p>
  }
}

export default App;