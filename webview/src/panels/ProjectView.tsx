import { useEffect, useState } from "react";
import { vscode } from "../utilities/vscode";
import type { CompositionProject } from "@music-analyzer/shared";
import { Tree } from "antd";


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
  const treeData = [
    {
      title: (
        <span
          className="font-bold cursor-pointer"
          onClick={() => {
            vscode.postMessage({ command: "openCompositionEditor" });
          }}
        >
          EDITOR
        </span>
      ),
      key: "0-0",
    },
    { title: <span className="font-bold">OUTPUT</span>, key: "0-1" },
  ];
  return <Tree treeData={treeData} />;
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
