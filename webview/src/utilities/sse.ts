import { SERVER_BASE_URL } from "@music-analyzer/shared";
import { useEffect, useState } from "react";
import { useServer } from "../layers/ServerProvider";

export function useSSE<T = any>(path: string) {
  const { token } = useServer();

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("No token found");
      setData(null);
      return;
    }

    const eventSource = new EventSource(
      `${SERVER_BASE_URL}/${path}?token=${encodeURIComponent(token)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.ok) {
          setData(data.data);
          setError(null);
        } else {
          setError(data.message);
          setData(null);
        }
        setPending(false);
      } catch (e) {
        console.error("failed to parse sse data:", e);
        setError("parse error");
      }
    };

    eventSource.onerror = (event) => {
      console.error("sse error:", event);
      setError("connection error");
      setData(null);
      setPending(false);
    };

    return () => eventSource.close();
  }, [token, path]);

  return { data, error, pending };
}
