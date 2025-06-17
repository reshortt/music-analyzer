import { DockviewReact, DockviewReadyEvent } from "dockview";
import "dockview/dist/styles/dockview.css";
import { sse, useServerActions } from "../utilities/server";

export default function CompositionEditorPanel() {
  const onReady = (event: DockviewReadyEvent) => {
    event.api.addPanel({
      component: "settings",
      id: "panel_1",
      title: "Settings",
      position: { direction: "left" },
    });
    event.api.addPanel({
      component: "pianoRoll",
      id: "panel_2",
      title: "Piano Roll",
      position: { direction: "right" },
    });
  };

  return (
    <DockviewReact
      className="dockview-theme-abyss"
      onReady={onReady}
      components={{
        settings: ProjectSettings,
        pianoRoll: PianoRoll,
      }}
    />
  );
}

function PianoRoll(): React.JSX.Element {
  const { data: patterns, error, loading } = sse.usePatterns();
  const sa = useServerActions();

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {patterns &&
        patterns.map((pattern, index) => (
          <div key={JSON.stringify(pattern) + index}>
            {JSON.stringify(pattern)}
          </div>
        ))}
      <button onClick={() => sa.randomizePatterns()}>Randomize Patterns</button>
    </div>
  );
}

function ProjectSettings(): React.JSX.Element {
  return <div> Hello Project Settings </div>;
}
