import {
  Pattern,
  ProjectMetadata,
  SERVER_BASE_URL,
} from "@music-analyzer/shared";
import { useServer } from "../layers/Server";
import { useSSE } from "./sse";

async function callServer(path: string, body?: any, options?: RequestInit) {
  const response = await fetch(`${SERVER_BASE_URL}/${path}`, {
    body: JSON.stringify(body),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  return response.json();
}

export const sse = {
  usePatterns: () => useSSE<Pattern[]>("project/patterns"),
  useMetadata: () => useSSE<ProjectMetadata>("project/metadata"),
};

export const useServerActions = () => {
  const { token } = useServer();

  return {
    randomizePatterns: () => {
      if (!token) {
        throw new Error("No token found");
      }
      return callServer("project/patterns/randomize", { token });
    },
  };
};
