import { useEffect, useState } from "react";
import { vscode } from "../utilities/vscode";

export default function HelloVegaPanel() {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.command === "setView") {
        setMessage(`View Type: ${event.data.viewType}`);
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const sendMessage = () => {
    vscode.postMessage({ command: "hello", text: "Hello from React!" });
  };

  return (
    <div>
      <h1>Hello Vega Panel</h1>
      <p>{message}</p>
      <vscode-button onClick={sendMessage}>
        Send Message to Extension
      </vscode-button>
    </div>
  );
}
