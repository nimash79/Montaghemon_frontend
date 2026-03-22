import React, { useEffect, useMemo, useRef, useState } from "react";

const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${import.meta.env.VITE_WS_HOST}/ws`;
const HTTP_BASE = "http://192.168.1.102:8080";

export default function LivePage() {
  const qs = useMemo(() => new URLSearchParams(window.location.search), []);
  const role = (qs.get("role") || "viewer").toLowerCase(); // broadcaster|viewer

  const wsRef = useRef(null);
  const audioRef = useRef(null);

  // تخمین اختلاف زمان کلاینت با سرور: serverNow ~= Date.now() + serverOffsetMs
  const serverOffsetMsRef = useRef(0);

  const [tracks, setTracks] = useState([]);
  const [state, setState] = useState(null);
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);

  function log(s) {
    setLogs((x) => [
      ...x.slice(-30),
      `[${new Date().toLocaleTimeString()}] ${s}`,
    ]);
  }

  function estimateServerNowMs() {
    return Date.now() + serverOffsetMsRef.current;
  }

  function getPositionSecFromState(s, serverNowMs) {
    if (!s) return 0;
    if (s.mode === "playing")
      return Math.max(0, (serverNowMs - s.startTimeMs) / 1000);
    if (s.mode === "paused") return Math.max(0, s.pausePositionSec || 0);
    return 0;
  }

  async function loadTracks() {
    const r = await fetch(`${HTTP_BASE}/api/tracks`);
    const j = await r.json();
    console.log("j:", j);
    setTracks(j.tracks || []);
  }

  // همگام‌سازی audio element با state
  async function applyState(s, serverNowMs) {
    const audio = audioRef.current;
    if (!audio) return;

    if (!s || s.mode === "stopped" || !s.trackId) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    const trackUrl = `${HTTP_BASE}/tracks/${encodeURIComponent(s.trackId)}`;
    const desiredPos = getPositionSecFromState(s, serverNowMs);

    // اگر ترک عوض شده، src را عوض کن
    if (audio.src !== trackUrl) {
      audio.pause();
      audio.src = trackUrl;
      audio.load();

      // صبر کن metadata بیاد تا seek ممکن باشد
      await new Promise((resolve) => {
        const onLoaded = () => {
          audio.removeEventListener("loadedmetadata", onLoaded);
          resolve(true);
        };
        audio.addEventListener("loadedmetadata", onLoaded);
      });
    }

    // seek به موقعیت فعلی (viewer دیر رسید => مستقیم به همینجا می‌پرد)
    try {
      const drift = Math.abs((audio.currentTime || 0) - desiredPos);
      if (drift > 0.35) {
        audio.currentTime = desiredPos;
      }
    } catch {}

    if (s.mode === "paused") {
      audio.pause();
    }
  }

  useEffect(() => {
    loadTracks().catch(() => {});
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("ws-open");
      log("WS connected");
      ws.send(JSON.stringify({ type: "setRole", role }));
      // ping اولیه برای offset
      ws.send(JSON.stringify({ type: "ping", clientNowMs: Date.now() }));
      // state را هم بگیر
      ws.send(JSON.stringify({ type: "getState" }));
    };

    ws.onclose = () => {
      setStatus("ws-closed");
      log("WS closed");
    };

    ws.onmessage = async (evt) => {
      const msg = JSON.parse(evt.data);

      if (msg.type === "role") {
        log(`role = ${msg.role}`);
      }

      if (msg.type === "pong") {
        // تخمین offset با RTT/2
        const t0 = msg.clientNowMs;
        const t1 = Date.now();
        const rtt = t1 - t0;
        const serverNow = msg.serverNowMs;
        const newOffset = serverNow - (t0 + rtt / 2);

        // smoothing ساده
        serverOffsetMsRef.current =
          serverOffsetMsRef.current * 0.8 + newOffset * 0.2;
        return;
      }

      if (msg.type === "state") {
        setState(msg.state);
        const serverNowMs = msg.serverNowMs ?? estimateServerNowMs();
        await applyState(msg.state, serverNowMs);
        return;
      }

      if (msg.type === "error") {
        log("ERROR: " + msg.message);
      }
    };

    // هر 5 ثانیه یک ping برای نگه داشتن offset
    const t = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping", clientNowMs: Date.now() }));
      }
    }, 5000);

    // هر 3 ثانیه یک بار resync سبک (اختیاری، برای اینکه drift جمع نشود)
    const sync = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "getState" }));
      }
    }, 3000);

    return () => {
      clearInterval(t);
      clearInterval(sync);
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function wsSend(obj) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(obj));
  }

  // کنترل‌ها برای broadcaster
  const broadcasterUI = (
    <div style={{ marginTop: 12 }}>
      <h3>Tracks</h3>
      {tracks.length === 0 ? (
        <div>No tracks found in /public/tracks</div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tracks.map((t) => (
          <button
            key={t.id}
            onClick={() =>
              wsSend({ type: "play", trackId: t.id, startPosSec: 0 })
            }
          >
            Play: {t.id}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={() => wsSend({ type: "pause" })}>Pause</button>
        <button onClick={() => wsSend({ type: "resume" })}>Resume</button>
        <button onClick={() => wsSend({ type: "stop" })}>Stop</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Seek (sec): </label>
        <input
          type="number"
          min="0"
          step="1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = Number(e.currentTarget.value || 0);
              wsSend({ type: "seek", positionSec: v });
            }
          }}
          placeholder="Enter و سپس seek"
        />
      </div>
    </div>
  );

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h2>Radio Mode (tracks) — role: {role}</h2>
      <div>Status: {status}</div>

      <div style={{ marginTop: 12 }}>
        <audio ref={audioRef} controls />
      </div>

      {role === "broadcaster" ? broadcasterUI : null}

      <pre
        style={{
          marginTop: 16,
          background: "#111",
          color: "#0f0",
          padding: 12,
          height: 220,
          overflow: "auto",
        }}
      >
        {logs.join("\n")}
      </pre>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Broadcaster: <code>?role=broadcaster</code> — Viewer:{" "}
        <code>?role=viewer</code>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
        State: {state ? JSON.stringify(state) : "null"}
      </div>
    </div>
  );
}
