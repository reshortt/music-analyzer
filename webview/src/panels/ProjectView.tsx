import { useEffect, useState } from "react";
import { vscode } from "../utilities/vscode";
import type { CompositionProject } from "@music-analyzer/shared";

export default function ProjectView() {
  const [project, setProject] = useState<CompositionProject | null>(null);

  useEffect(() => {
    vscode.postMessage({ command: "webviewViewLoaded" });
  }, []);

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

  return (project ? <YesProjectView project={project} /> : <NoProjectView />)
}

function YesProjectView(props: { project: CompositionProject }) {
  const { project } = props;
  return <vscode-tree id="tree-basic-example">{project.name}</vscode-tree>
}

function NoProjectView() {
  return <div className="flex flex-col gap-2">

    <p className="text-center">No project loaded</p>

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
}
