import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const WS_URL =
  `${window.location.protocol === "https:" ? "wss" : "ws"}://${import.meta.env.VITE_WS_HOST}/ws`;

const WsContext = createContext(null);

export function WsProvider({ children }) {
  const wsRef = useRef(null);
  const listenersRef = useRef(new Set()); // (msg) => void
  const [status, setStatus] = useState("disconnected");
  const [offset, setOffset] = useState(0);

  const send = useCallback((obj) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(obj));
    return true;
  }, []);

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  useEffect(() => {
    let closedByCleanup = false;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setStatus("connected");
      ws.onclose = () => {
        setStatus("disconnected");
        // اگر Provider هنوز وجود دارد، reconnect
        if (!closedByCleanup) {
          setTimeout(connect, 1000);
        }
      };
      ws.onerror = () => {
        // onclose معمولاً بعدش می‌آید
      };
      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        listenersRef.current.forEach((fn) => fn(msg));
      };
    }

    connect();

    return () => {
      closedByCleanup = true;
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({ status, send, subscribe, ws: wsRef.current }),
    [status, send, subscribe, wsRef.current]
  );

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
}

export function useWs() {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWs must be used within <WsProvider />");
  return ctx;
}