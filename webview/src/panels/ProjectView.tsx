import { useEffect } from "react";
import { vscode } from "../utilities/vscode";
import { EXT_MESSAGES, ProjectMetadata } from "@music-analyzer/shared";
import { Tree } from "antd";
import { sse } from "../utilities/server";

export default function ProjectView() {
  const { data: metadata, error, pending } = sse.useMetadata();

  useEffect(() => {
    vscode.postMessage({ command: EXT_MESSAGES.WEBVIEW_VIEW_LOADED });
  }, []);

  if (pending) {
    return <div>.....</div>;
  }

  return metadata ? <YesProjectView metadata={metadata} /> : <NoProjectView />;
}

function YesProjectView({ metadata }: { metadata: ProjectMetadata }) {
  const treeData = [
    {
      title: (
        <span
          className="font-bold cursor-pointer"
          onClick={() => {
            vscode.postMessage({
              command: EXT_MESSAGES.OPEN_COMPOSITION_EDITOR,
            });
          }}
        >
          EDITOR
        </span>
      ),
      key: "0-0",
    },
    { title: <span className="font-bold">OUTPUT</span>, key: "0-1" },
  ];
  return <Tree treeData={treeData} className="px-4" />;
}

function NoProjectView() {
  return (
    <div className="flex flex-col gap-2 px-4">
      <p className="text-center">No project loaded</p>

      <div className="flex flex-col gap-2">
        <vscode-button
          onClick={() => {
            vscode.postMessage({ command: EXT_MESSAGES.OPEN_PROJECT });
          }}
        >
          Open Project
        </vscode-button>
        <vscode-button
          onClick={() => {
            vscode.postMessage({ command: EXT_MESSAGES.CREATE_PROJECT });
          }}
        >
          Create New Project
        </vscode-button>
      </div>
    </div>
  );
}
