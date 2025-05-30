import { useEffect, useState } from "react";
import { vscode } from "../utilities/vscode";
import type { CompositionProject } from "@music-analyzer/shared";

export default function ProjectView() {
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
          <h2 className="underline"> Current Project</h2>

          <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
            <span className="font-medium ">Project:</span>
            <span>{project.name}</span>
            <span className="font-medium ">Location:</span>
            <span>{project.location}</span>
            <span className="font-medium ">Created:</span>
            <span>{project.created ?? "None"}</span>
            <span className="font-medium ">Last Opened:</span>
            <span>{project.lastOpened ? project.lastOpened : "None"}</span>
          </div>
        </div>
      ) : (
        <>
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
       </>
      )}

    </div>
  );
}
