import { createContext, useContext, useState } from "react";
import { useExtensionListener } from "../utilities/vscode";
import { EXT_MESSAGES } from "@music-analyzer/shared";

type ServerState = {
  token: string | null;
};

const ServerContext = createContext({} as ServerState);

export const useServer = () => {
  const server = useContext(ServerContext);
  if (!server) {
    throw new Error("Server context not found");
  }
  return server;
};

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useExtensionListener(EXT_MESSAGES.PROJECT_TOKEN, (event) => {
    setToken(event.data.token);
  });

  return (
    <ServerContext.Provider value={{ token }}>
      {children}
    </ServerContext.Provider>
  );
}
