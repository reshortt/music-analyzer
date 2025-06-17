import { CompositionProject, Pattern } from "@music-analyzer/shared";
import EventEmitter from "events";

export const PROJ_EVENTS = {
  PATTERNS: "patterns",
  METADATA: "metadata",
} as const;

export class ServerProjectStore {
  private static instance: ServerProjectStore;
  private projectMap: Map<string, CompositionProject> = new Map();
  private eventEmitter: EventEmitter;

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public static getInstance(): ServerProjectStore {
    if (!ServerProjectStore.instance) {
      ServerProjectStore.instance = new ServerProjectStore();
    }
    return ServerProjectStore.instance;
  }

  public get projects(): Map<string, CompositionProject> {
    return this.projectMap;
  }

  public static setProject(token: string, project: CompositionProject): void {
    ServerProjectStore.instance.projectMap.set(token, project);
  }

  public static removeProject(token: string): void {
    ServerProjectStore.instance.projectMap.delete(token);
  }

  public static getProject(token: string): CompositionProject | undefined {
    return ServerProjectStore.instance.projectMap.get(token);
  }

  public static on(token: string, eventId: string, handler: () => void): void {
    ServerProjectStore.instance.eventEmitter.on(`${token}:${eventId}`, handler);
  }

  public static removeListener(
    token: string,
    eventId: string,
    handler: () => void
  ): void {
    ServerProjectStore.instance.eventEmitter.removeListener(
      `${token}:${eventId}`,
      handler
    );
  }

  ///

  public static updatePatterns(token: string, patterns: Pattern[]): void {
    const project = ServerProjectStore.getProject(token);
    if (!project) {
      return;
    }
    project.patterns = patterns;
    ServerProjectStore.setProject(token, project);
    ServerProjectStore.instance.eventEmitter.emit(
      `${token}:${PROJ_EVENTS.PATTERNS}`,
      patterns
    );
  }
}
