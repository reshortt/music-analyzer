import { useEffect, useState } from "react";
import { vscode } from "../utilities/vscode";

export default function ActivityBarPanel() {
  const [project, setProject] = useState<any>(null);

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
    <div>
      <h4>Activity Bar</h4>
      {project ? (
        <div>
          <h2>Current Project</h2>
          <pre>{JSON.stringify(project, null, 2)}</pre>
        </div>
      ) : (
        <p>No project loaded</p>
      )}
    </div>
  );
}
