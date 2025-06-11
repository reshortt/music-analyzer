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

const projectEvents = new vscode.EventEmitter<{
  type: "created" | "loaded" | "closed" | "refreshed";
  project?: CompositionProject;
}>();

const PROJECT_FILE_NAME = "composition.json";

class CompositionProjectManager {
  private static _instance: CompositionProjectManager | undefined;
  private context: vscode.ExtensionContext;
  private currentProject: CompositionProject | undefined;

  private projectFileWatcher: vscode.FileSystemWatcher | undefined;

  public static readonly onProjectChanged = projectEvents.event;

  private constructor(context: vscode.ExtensionContext) {
    if (CompositionProjectManager._instance) {
      throw new Error(
        "CompositionProjectManager is a singleton - use getInstance() instead"
      );
    }

    this.context = context;

    // initialize the context and listen for project open/close events
    setContext(CONTEXT.IS_PROJECT_OPEN, false);
    CompositionProjectManager.onProjectChanged(({ project }) => {
      setContext(CONTEXT.IS_PROJECT_OPEN, !!project);
    });

    // Initialize current project from workspace state if available
    const savedProject = state.savedProject.get(context);
    if (savedProject?.location) {
      this.loadProject(path.join(savedProject.location, PROJECT_FILE_NAME));
    }

    // Next, try a currently open workspace
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!this.currentProject && workspace) {
      this.loadProject(path.join(workspace.uri.fsPath, PROJECT_FILE_NAME));
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
              this.closeProject();
            }
          }
        }
      })
    );

    registerCommand(context, COMMANDS.CREATE_PROJECT.id, async () => {
      await this.createProject();
    });

    registerCommand(context, COMMANDS.OPEN_PROJECT.id, async () => {
      await this.openProject();
    });

    registerCommand(context, COMMANDS.CLOSE_PROJECT.id, () => {
      this.closeProject();
    });

    registerCommand(context, COMMANDS.REFRESH_PROJECT.id, () => {
      this.refreshProject();
    });

    // Set the instance after successful initialization
    CompositionProjectManager._instance = this;
  }

  private async createProject(): Promise<void> {
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
      await this.createNewProject(name, location);
    }
  }

  private async openProject(): Promise<void> {
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
        await this.loadProject(fileUri[0].fsPath);
      }
    } else {
      // Find the project from recent projects
      const project = recentProjects.find(
        (p) =>
          p.name === selection.label && p.location === selection.description
      );
      if (project) {
        const projectFilePath = path.join(project.location, PROJECT_FILE_NAME);
        await this.loadProject(projectFilePath);
      }
    }
  }

  private setupProjectFileWatcher(): void {
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
      this.refreshProject();
    });

    // Listen for deletion of the project file
    this.projectFileWatcher.onDidDelete(() => {
      vscode.window.showWarningMessage(
        "The project file was deleted. The project will be closed.",
        "OK"
      );
      this.closeProject();
    });

    // Add to disposables
    this.context.subscriptions.push(this.projectFileWatcher);
  }

  private setupProject(project: CompositionProject): void {
    // Set the current project
    this.currentProject = project;

    // Save to workspace state
    state.savedProject.set(this.context, this.currentProject);

    // Update recent projects
    state.recentProjects.update(this.context, this.currentProject);

    // Setup file watcher
    this.setupProjectFileWatcher();
  }

  private async createNewProject(
    name: string,
    location: string
  ): Promise<void> {
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
        lastModified: new Date().toISOString(),
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
      };

      this.setupProject(project);

      // Emit project changed event
      projectEvents.fire({ type: "created", project: this.currentProject });

      showMessage(`Project "${name}" created successfully at ${location}`);
    } catch (error) {
      showErrorMessage(`Failed to create project: ${error}`);
    }
  }

  private async loadProject(projectFilePath: string): Promise<void> {
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
      };

      this.setupProject(project);

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

  public closeProject(): void {
    if (!this.currentProject) {
      return;
    }

    const projectName = this.currentProject.name;

    this.currentProject = undefined;
    state.savedProject.set(this.context, undefined);

    if (this.projectFileWatcher) {
      this.projectFileWatcher.dispose();
      this.projectFileWatcher = undefined;
    }

    projectEvents.fire({ type: "closed" });

    showMessage(`Project "${projectName}" closed`);
  }

  public async refreshProject(): Promise<void> {
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

  public getCurrentProject(): CompositionProject | undefined {
    return this.currentProject;
  }

  public static getInstance(
    context?: vscode.ExtensionContext
  ): CompositionProjectManager {
    if (!CompositionProjectManager._instance) {
      if (!context) {
        throw new Error(
          "Context is required to initialize CompositionProjectManager"
        );
      }
      CompositionProjectManager._instance = new CompositionProjectManager(
        context
      );
    }
    return CompositionProjectManager._instance;
  }

  public static initialize(context: vscode.ExtensionContext): void {
    this.getInstance(context);
  }
}

export { CompositionProjectManager, CompositionProject };
