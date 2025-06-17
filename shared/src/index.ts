export type Pitch =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";
export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Duration = "1" | "2" | "4" | "8" | "16" | "32" | "64";

export type Note = {
  pitch: Pitch;
  octave: Octave;
  duration: Duration;
};

export type PlacedNote = Note & {
  startTime: number;
};

export type Pattern = PlacedNote[];

export type PlacedPattern = Pattern & {
  startTime: number;
  track: number;
};

export type Arrangement = PlacedPattern[];

export type Rendition = {
  id: string;
  name: string;
};

export type ProjectMetadata = {
  name: string;
  location: string;
  created: string;
  lastOpened?: string;
};

export type CompositionProject = {
  name: string;
  location: string;
  created: string;
  lastOpened?: string;
  patterns: Pattern[];
  arrangement: Arrangement;
  renditions: Rendition[];
};

export const SERVER_BASE_URL = "http://localhost:3003";

export const EXT_MESSAGES = {
  SET_VIEW: "setView",
  PROJECT_TOKEN: "projectToken",
  WEBVIEW_LOADED: "webviewLoaded",
  WEBVIEW_VIEW_LOADED: "webviewViewLoaded",
  OPEN_COMPOSITION_EDITOR: "openCompositionEditor",
  OPEN_PROJECT: "openProject",
  CREATE_PROJECT: "createProject",
} as const;

export const VIEW_TYPES = {
  COMPOSITION_EDITOR: "compositionEditor",
  PROJECT_VIEW: "projectView",
} as const;
