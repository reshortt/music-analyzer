import { CompositionProject, SERVER_BASE_URL } from "@music-analyzer/shared";

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

export const server = {
  loadProject: async (token: string, project: CompositionProject) => {
    return callServer(`project/load`, { token, project });
  },
  closeProject: async (token: string) => {
    return callServer(`project/close`, { token });
  },
};
