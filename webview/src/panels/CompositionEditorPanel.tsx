import { useEffect, useState } from "react";
import { vscode } from "../utilities/vscode";
import { DockviewReact, DockviewApi, DockviewReadyEvent, DockviewPanelApi } from "dockview";
import "dockview/dist/styles/dockview.css"


export default function CompositionEditorPanel() {
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

  const onReady = (event: DockviewReadyEvent) => {
    event.api.addPanel({ component: "settings", id: "panel_1", title: "Settings", position: { direction: "left" } });
    event.api.addPanel({ component: "pianoRoll", id: "panel_2", title: "Piano Roll", position: { direction: "right" } });
  }

  return (
    <DockviewReact
      className="dockview-theme-abyss"
      onReady={onReady}
      components={{
        "settings": ProjectSettings,
        "pianoRoll": PianoRoll
      }}
    />
  );
}

function PianoRoll(): React.JSX.Element {
  return <div> Hello Piano Roll </div>
}

function ProjectSettings(): React.JSX.Element {
  return <div> Hello Project Settings </div>
}
