import { Request, Response } from "express";
import { ServerProjectStore } from "../stores/ServerProjectStore";

type SSEHandler<T> = (token: string) => T | undefined;

export function handleSSE<T>(
  req: Request,
  res: Response,
  eventName: string,
  handler: SSEHandler<T>
) {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    res.status(400).json({ message: "Token is required" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const eventHandler = () => {
    try {
      const data = handler(token);

      res.write(`data: ${JSON.stringify({ ok: true, data })}\n\n`);
    } catch (error) {
      console.error("Error in event handler:", error);
      res.write(
        `data: ${JSON.stringify({
          ok: false,
          message: "Internal server error",
        })}\n\n`
      );
    }
  };

  eventHandler();

  ServerProjectStore.on(token, eventName, eventHandler);

  res.on("close", () => {
    ServerProjectStore.removeListener(token, eventName, eventHandler);
  });
}
