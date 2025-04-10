import { useState, useEffect } from "react";
import "./App.css";
import { vscode } from "./utilities/vscode";

function App() {
  const [message, setMessage] = useState("Hello from React!");
  const [viewType, setViewType] = useState<string>()

  useEffect(() => {
    // Listen for messages from the extension
    const messageListener = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case "update":
          setMessage(message.text);
          break;
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

  const handleButtonClick = () => {
    vscode.postMessage({
      command: "hello",
      text: "Hello from React to Extension!",
    });
  };

  return (
    <div className="app">
      <h1>{viewType} : {message}</h1>
      <button onClick={handleButtonClick}>Send Message to Extension</button>
    </div>
  );
}

export default App;