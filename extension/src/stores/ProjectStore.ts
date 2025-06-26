import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { COMMANDS, CONTEXT, state } from "../constants";
import {
  registerCommand,
  setContext,
  showErrorMessage,
  showMessage,
} from "../utilities/vs-utils";
import type { CompositionProject } from "@music-analyzer/shared";
import { server } from "../utilities/server";

const projectEvents = new vscode.EventEmitter<{
  type: "created" | "loaded" | "closed" | "refreshed";
  project?: CompositionProject;
}>();

const PROJECT_FILE_NAME = "composition.json";

class ProjectStore {
  private static _instance: ProjectStore | undefined;
  private context: vscode.ExtensionContext;
  private currentProject: CompositionProject | undefined;

  private projectFileWatcher: vscode.FileSystemWatcher | undefined;

  public static readonly onProjectChanged = projectEvents.event;

  private constructor(context: vscode.ExtensionContext) {
    if (ProjectStore._instance) {
      throw new Error(
        "ProjectStore is a singleton - use getInstance() instead"
      );
    }

    this.context = context;

    // initialize the context and listen for project open/close events
    setContext(CONTEXT.IS_PROJECT_OPEN, false);
    ProjectStore.onProjectChanged(({ project }) => {
      setContext(CONTEXT.IS_PROJECT_OPEN, !!project);
    });

    // Initialize current project from workspace state if available
    const savedProject = state.savedProject.get(context);
    if (savedProject?.location) {
      this.load(path.join(savedProject.location, PROJECT_FILE_NAME));
    }

    // Next, try a currently open workspace
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!this.currentProject && workspace) {
      this.load(path.join(workspace.uri.fsPath, PROJECT_FILE_NAME));
    }

    // Listen for workspace folder changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        // If any workspace is removed, check if it's the current project
        if (event.removed.length > 0) {
          if (this.currentProject) {
            const projectUri = vscode.Uri.file(this.currentProject.location);
            const isRemoved = event.removed.some(
              (folder) =>
                folder.uri.fsPath === projectUri.fsPath ||
                folder.uri.fsPath === path.dirname(projectUri.fsPath)
            );

            if (isRemoved) {
              this.close();
            }
          }
        }
      })
    );

    registerCommand(context, COMMANDS.CREATE_PROJECT.id, async () => {
      await this.create();
    });

    registerCommand(context, COMMANDS.OPEN_PROJECT.id, async () => {
      await this.open();
    });

    registerCommand(context, COMMANDS.CLOSE_PROJECT.id, () => {
      this.close();
    });

    registerCommand(context, COMMANDS.RELOAD_PROJECT.id, () => {
      this.reload();
    });

    // Set the instance after successful initialization
    ProjectStore._instance = this;
  }

  // create a new project, prompt user for name and location
  private async create(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: "Enter project name",
      placeHolder: "My Composition Project",
    });

    // User cancelled
    if (!name) {
      return;
    }

    let location: string | undefined;

    // If workspace is open, suggest it
    if (
      vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length > 0
    ) {
      const useWorkspace = await vscode.window.showQuickPick(
        ["Use current workspace", "Choose another location"],
        { placeHolder: "Select project location" }
      );

      if (useWorkspace === "Use current workspace") {
        location = vscode.workspace.workspaceFolders[0].uri.fsPath;
      }
    }

    // If location is not set, ask user for it
    if (!location) {
      const folderUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: "Select Project Location",
      });

      if (folderUri && folderUri.length > 0) {
        location = folderUri[0].fsPath;
      }
    }

    if (location) {
      try {
        // Create the project directory if it doesn't exist
        if (!fs.existsSync(location)) {
          fs.mkdirSync(location, { recursive: true });
        }

        // Create the composition.json file
        const compositionFilePath = path.join(location, PROJECT_FILE_NAME);
        const compositionData = {
          name: name,
          created: new Date().toISOString(),
          lastOpened: new Date().toISOString(),
          arrangement: [],
          renditions: [],
        };

        fs.writeFileSync(
          compositionFilePath,
          JSON.stringify(compositionData, null, 2)
        );

        const project: CompositionProject = {
          name,
          location,
          created: compositionData.created,
          lastOpened: new Date().toISOString(),
          patterns: [],
          arrangement: [],
          renditions: [],
        };

        await this.initialize(project);

        // Emit project changed event
        projectEvents.fire({ type: "created", project: this.currentProject });

        showMessage(`Project "${name}" created successfully at ${location}`);
      } catch (error) {
        showErrorMessage(`Failed to create project: ${error}`);
      }
    }
  }

  // open a project, prompt user for project to open or browse for a project file
  private async open(): Promise<void> {
    const recentProjects = state.recentProjects.get(this.context);

    let options: vscode.QuickPickItem[] = recentProjects.map((project) => ({
      label: project.name,
      description: project.location,
      detail: `Last opened: ${project.lastOpened || "Unknown"}`,
    }));

    options.push({
      label: "Browse...",
      description: "Select a project file from the file system",
    });

    const selection = await vscode.window.showQuickPick(options, {
      placeHolder: "Select project to open",
    });

    // User cancelled
    if (!selection) {
      return;
    }

    if (selection.label === "Browse...") {
      const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { "Composition Project": ["json"] },
        openLabel: "Open Project",
      });

      if (fileUri && fileUri.length > 0) {
        await this.load(fileUri[0].fsPath);
      }
    } else {
      // Find the project from recent projects
      const project = recentProjects.find(
        (p) =>
          p.name === selection.label && p.location === selection.description
      );
      if (project) {
        const projectFilePath = path.join(project.location, PROJECT_FILE_NAME);
        await this.load(projectFilePath);
      }
    }
  }

  // with project metadata, setup the project store
  private async initialize(project: CompositionProject) {
    // Set the current project
    this.currentProject = project;

    await server.loadProject(project.location, project);

    // Save to workspace state
    state.savedProject.set(this.context, this.currentProject);

    // Update recent projects
    state.recentProjects.update(this.context, this.currentProject);

    // Setup file watcher
    // Remove any existing file watcher
    if (this.projectFileWatcher) {
      this.projectFileWatcher.dispose();
    }

    if (!this.currentProject) {
      return;
    }

    const projectFilePath = path.join(
      this.currentProject.location,
      PROJECT_FILE_NAME
    );

    // Create new file watcher for the project file
    this.projectFileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.Uri.file(path.dirname(projectFilePath)),
        path.basename(projectFilePath)
      )
    );

    // Listen for changes to the project file
    this.projectFileWatcher.onDidChange(() => {
      this.reload();
    });

    // Listen for deletion of the project file
    this.projectFileWatcher.onDidDelete(() => {
      vscode.window.showWarningMessage(
        "The project file was deleted. The project will be closed.",
        "OK"
      );
      this.close();
    });

    // Add to disposables
    this.context.subscriptions.push(this.projectFileWatcher);
  }

  // load an existing project from a file path
  private async load(projectFilePath: string): Promise<void> {
    try {
      // Check if the file exists
      if (!fs.existsSync(projectFilePath)) {
        showErrorMessage(`Project file not found: ${projectFilePath}`);
        return;
      }

      // Read and parse the composition.json file
      const fileContent = fs.readFileSync(projectFilePath, "utf8");
      const projectData = JSON.parse(fileContent);

      // Validate the project data
      if (!projectData.name) {
        showErrorMessage("Invalid project file: missing name property");
        return;
      }

      // Get the project directory (parent of the composition.json file)
      const projectLocation = path.dirname(projectFilePath);

      const project: CompositionProject = {
        name: projectData.name,
        location: projectLocation,
        created: projectData.created,
        lastOpened: new Date().toISOString(),
        patterns: [],
        arrangement: [],
        renditions: [],
      };

      await this.initialize(project);

      // Update workspace to the project location
      const uri = vscode.Uri.file(projectLocation);
      vscode.workspace.updateWorkspaceFolders(
        0,
        vscode.workspace.workspaceFolders?.length || 0,
        { uri }
      );

      projectEvents.fire({ type: "loaded", project: this.currentProject });

      showMessage(`Project "${projectData.name}" loaded successfully`);
    } catch (error) {
      showErrorMessage(`Failed to load project: ${error}`);
    }
  }

  // close the current project
  public async close(): Promise<void> {
    if (!this.currentProject) {
      return;
    }

    const projectName = this.currentProject.name;

    await server.closeProject(this.currentProject.location);

    this.currentProject = undefined;
    state.savedProject.set(this.context, undefined);

    if (this.projectFileWatcher) {
      this.projectFileWatcher.dispose();
      this.projectFileWatcher = undefined;
    }

    projectEvents.fire({ type: "closed" });

    showMessage(`Project "${projectName}" closed`);
  }

  // reload the current project from the project file
  public async reload(): Promise<void> {
    if (!this.currentProject) {
      return;
    }

    const projectFilePath = path.join(
      this.currentProject.location,
      PROJECT_FILE_NAME
    );

    try {
      const fileContent = fs.readFileSync(projectFilePath, "utf8");
      const projectData = JSON.parse(fileContent);

      this.currentProject = {
        ...this.currentProject,
        name: projectData.name,
        created: projectData.created,
      };

      state.savedProject.set(this.context, this.currentProject);

      projectEvents.fire({ type: "refreshed", project: this.currentProject });
    } catch (error) {
      showErrorMessage(`Failed to refresh project: ${error}`);
    }
  }

  public getProject(): CompositionProject | undefined {
    return this.currentProject;
  }

  public static getStore(context?: vscode.ExtensionContext): ProjectStore {
    if (!ProjectStore._instance) {
      if (!context) {
        throw new Error("Context is required to initialize ProjectStore");
      }
      ProjectStore._instance = new ProjectStore(context);
    }
    return ProjectStore._instance;
  }

  public static initializeStore(context: vscode.ExtensionContext): void {
    this.getStore(context);
  }
}

export { ProjectStore, CompositionProject };
