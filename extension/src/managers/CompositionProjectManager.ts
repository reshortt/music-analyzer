import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

type CompositionProject = {
  name: string;
  location: string;
};

class CompositionProjectManager {
  private static _instance: CompositionProjectManager | undefined;
  private context: vscode.ExtensionContext;
  private currentProject: CompositionProject | undefined;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public static getInstance(context?: vscode.ExtensionContext): CompositionProjectManager {
    if (!CompositionProjectManager._instance) {
      if (!context) {
        throw new Error("Context is required to initialize CompositionProjectManager");
      }
      CompositionProjectManager._instance = new CompositionProjectManager(context);
    }
    return CompositionProjectManager._instance;
  }

  async createNewProject(name: string, location: string): Promise<void> {
    try {
      // Create the project directory if it doesn't exist
      if (!fs.existsSync(location)) {
        fs.mkdirSync(location, { recursive: true });
      }

      // Create the composition.json file
      const compositionFilePath = path.join(location, "composition.json");
      const compositionData = {
        name: name,
      };

      fs.writeFileSync(
        compositionFilePath,
        JSON.stringify(compositionData, null, 2)
      );

      // Set the current project
      this.currentProject = {
        name,
        location,
      };

      vscode.window.showInformationMessage(
        `Project "${name}" created successfully at ${location}`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create project: ${error}`);
    }
  }

  async loadProject(projectFilePath: string): Promise<void> {
    try {
      // Check if the file exists
      if (!fs.existsSync(projectFilePath)) {
        vscode.window.showErrorMessage(`Project file not found: ${projectFilePath}`);
        return;
      }

      // Read and parse the composition.json file
      const fileContent = fs.readFileSync(projectFilePath, 'utf8');
      const projectData = JSON.parse(fileContent);

      // Validate the project data
      if (!projectData.name) {
        vscode.window.showErrorMessage('Invalid project file: missing name property');
        return;
      }

      // Get the project directory (parent of the composition.json file)
      const projectLocation = path.dirname(projectFilePath);

      // Set the current project
      this.currentProject = {
        name: projectData.name,
        location: projectLocation,
      };

      vscode.window.showInformationMessage(
        `Project "${projectData.name}" loaded successfully`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load project: ${error}`);
    }
  }

  getCurrentProject(): CompositionProject | undefined {
    return this.currentProject;
  }
}

export { CompositionProjectManager, CompositionProject };