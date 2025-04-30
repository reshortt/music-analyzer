import { useEffect, useState } from "react";
import { vscode } from "../utilities/vscode";
import type { CompositionProject } from "@music-analyzer/shared";

export default function ProjectViewPanel() {
  const [project, setProject] = useState<CompositionProject | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.command === "projectStateChanged") {
        setProject(event.data.payload.project);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {project ? (
        <div>
          <h2>Current Project</h2>
          <pre>{JSON.stringify(project, null, 2)}</pre>
        </div>
      ) : (
        <p className="text-center">No project loaded</p>
      )}
      <div className="flex flex-col gap-2">
        <vscode-button
          onClick={() => {
            vscode.postMessage({ command: "openProject" });
          }}
        >
          Open Project
        </vscode-button>
        <vscode-button
          onClick={() => {
            vscode.postMessage({ command: "createNewProject" });
          }}
        >
          Create New Project
        </vscode-button>
      </div>
    </div>
  );
}
