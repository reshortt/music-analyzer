import * as vscode from "vscode";
import { CompositionProject } from "./stores/ProjectStore";

export const VIEWS = {
  PROJECT_VIEW: "music-analyzer.projectView",
  SOURCES_TREE: "music-analyzer.sourcesTree",
};

export const CONTEXT = {
  IS_PROJECT_OPEN: "music-analyzer.isProjectOpen",
};

export const COMMANDS = {
  CREATE_PROJECT: {
    id: "music-analyzer.createProject",
    title: "Create Project",
  },
  OPEN_PROJECT: {
    id: "music-analyzer.openProject",
    title: "Open Project",
  },
  CLOSE_PROJECT: {
    id: "music-analyzer.closeProject",
    title: "Close Project",
  },
  RELOAD_PROJECT: {
    id: "music-analyzer.reloadProject",
    title: "Reload Project",
  },
  OPEN_COMPOSITION_EDITOR: {
    id: "music-analyzer.openCompositionEditor",
    title: "Open Composition Editor",
  },
};

// keys
export const SAVED_PROJECT_KEY = "musicAnalyzerCurrentProject";
export const RECENT_PROJECTS_KEY = "musicAnalyzerRecentProjects";

// state
export const state = {
  savedProject: {
    get: (context: vscode.ExtensionContext): CompositionProject | undefined => {
      const savedProject =
        context.workspaceState.get<string>(SAVED_PROJECT_KEY);
      return savedProject ? JSON.parse(savedProject) : undefined;
    },
    set: (
      context: vscode.ExtensionContext,
      project: CompositionProject | undefined
    ) => {
      context.workspaceState.update(
        SAVED_PROJECT_KEY,
        project ? JSON.stringify(project) : undefined
      );
    },
  },
  recentProjects: {
    get: (context: vscode.ExtensionContext): CompositionProject[] => {
      const recentProjects =
        context.globalState.get<string>(RECENT_PROJECTS_KEY);
      return recentProjects ? JSON.parse(recentProjects) : [];
    },
    update: (context: vscode.ExtensionContext, project: CompositionProject) => {
      const recentProjects = state.recentProjects.get(context);
      // Remove this project if it already exists in the list
      const filteredProjects = recentProjects.filter(
        (p) => !(p.name === project.name && p.location === project.location)
      );

      // Add the project to the beginning of the list
      project.lastOpened = new Date().toISOString();
      filteredProjects.unshift(project);
      state.recentProjects.set(context, filteredProjects);
    },
    set: (context: vscode.ExtensionContext, projects: CompositionProject[]) => {
      context.globalState.update(RECENT_PROJECTS_KEY, JSON.stringify(projects));
    },
  },
};
