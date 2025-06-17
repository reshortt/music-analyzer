import express from "express";
import cors from "cors";
import { PROJ_EVENTS, ServerProjectStore } from "./stores/ServerProjectStore";
import {
  CompositionProject,
  Duration,
  Octave,
  Pattern,
  Pitch,
  PlacedNote,
} from "@music-analyzer/shared";
import { handleSSE } from "./utilities/sse";

// Setup
const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize project store
ServerProjectStore.getInstance();

app.post("/project/load", (req, res) => {
  const { token, project } = req.body;

  ServerProjectStore.setProject(token, project);

  res.status(200).json({ message: "Project loaded" });
});

app.post("/project/close", (req, res) => {
  const { token } = req.body;

  ServerProjectStore.removeProject(token);

  res.status(200).json({ message: "Project closed" });
});

app.get("/project/patterns", (req, res) => {
  handleSSE(req, res, PROJ_EVENTS.PATTERNS, (token) => {
    const project = ServerProjectStore.getProject(token);

    if (!project) {
      throw new Error("Project not found");
    }

    return project.patterns;
  });
});

app.get("/project/metadata", (req, res) => {
  handleSSE(req, res, PROJ_EVENTS.METADATA, (token) => {
    const project = ServerProjectStore.getProject(token);

    if (!project) {
      throw new Error("Project not found");
    }

    return {
      name: project.name,
      location: project.location,
      created: project.created,
      lastOpened: project.lastOpened,
    };
  });
});

app.post("/project/patterns/randomize", (req, res) => {
  const { token } = req.body;

  const project = ServerProjectStore.getProject(token);

  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const patterns = Array(4)
    .fill(null)
    .map(() => {
      return Array(4)
        .fill(null)
        .map(() => {
          return {
            pitch: "C" as Pitch,
            duration: "1" as Duration,
            octave: 4 as Octave,
            startTime: Math.random() * 100,
          };
        }) as PlacedNote[];
    });

  ServerProjectStore.updatePatterns(token, patterns);

  res.status(200).json({ message: "Patterns randomized" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
