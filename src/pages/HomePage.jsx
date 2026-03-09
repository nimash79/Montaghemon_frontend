import { useEffect, useRef, useState, useMemo } from "react";

import { ClockSync } from "../sync/clock";
import { SyncHlsPlayer } from "../sync/hls_player";
import StatusBar from "../components/shared/StatusBar";
import PlayIcon from "../components/icons/MediaIcons/PlayIcon";
import PauseIcon from "../components/icons/MediaIcons/PauseIcon";
import { PLAY_STATUS } from "../lib/constants";

const WS_HOST = window.location.host.includes("localhost") ? import.meta.env.VITE_WS_HOST : window.location.host;
const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${WS_HOST}/ws`;
import ProgressLine from "../components/media/ProgressLine";

const HomePage = () => {
  const audioRef = useRef(null);
  const wsRef = useRef(null);
  const clockRef = useRef(null);

  const [status, setStatus] = useState("disconnected");
  const [offset, setOffset] = useState(0);
  const [info, setInfo] = useState({
    trackId: "-",
    trackName: "-",
    driftMs: 0,
    quality: "-",
    label: "-",
    action: "-",
  });

  const player = useMemo(
    () => new SyncHlsPlayer({ clock: { nowServerMs: () => Date.now() } }),
    [],
  );

  useEffect(() => {
    console.log(WS_URL);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      const clock = new ClockSync(ws);
      clockRef.current = clock;
      player.clock = clock;
      clock.start(1000);
    };
    ws.onclose = () => setStatus("disconnected");

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);

      if (msg.type === "time_pong") {
        clockRef.current?.onPong(msg);
        setOffset(clockRef.current?.offsetMs ?? 0);
      }

      if (msg.type === "hello" || msg.type === "schedule") {
        player.setSchedule(msg.schedule || []);
        if (msg.forced) player.setForced(msg.forced);
      }
      if (msg.type === "force") player.setForced(msg.forced);
    };

    return () => {
      try {
        ws.close();
      } catch {}
      clockRef.current?.stop();
      player.detach();
    };
  }, []);

  useEffect(() => {
    player.attach(audioRef.current);
    const t = setInterval(() => {
      const r = player.tick();
      if (r?.ok)
        setInfo({
          trackId: r.trackId,
          trackName: r.trackName,
          driftMs: r.driftMs,
          quality: r.quality,
          label: r.label,
          action: r.action,
        });
    }, 250);
    return () => clearInterval(t);
  }, [player]);

  async function onStart() {
    wsRef.current?.send(JSON.stringify({ type: "need_schedule" }));
    await player.start();
  }

  function onStop() {
    player.stop();
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }
  return (
    <>
      <StatusBar label={info?.label || "NONE"} quality={info?.quality} />
      <div className="home-page">
        {/* <div>WS: {status}</div>
      <div>Clock offset (ms): {offset.toFixed(2)}</div> */}

        <div className="player">
          <div className="first">
            <img src={player?.thumbnail} alt={info.trackName} />
            <span>{info.trackName}</span>
          </div>
          <div className="second">
            <div style={{ fontSize: 20, direction: "ltr" }}>
              {audioRef?.current?.duration
                ? formatTime(audioRef.current.duration)
                : "00:00"}
            </div>
            <ProgressLine
              playedSec={audioRef?.current?.currentTime}
              durationSec={audioRef?.current?.duration}
            />
            <div style={{ fontSize: 20, direction: "ltr" }}>
              {audioRef?.current?.currentTime
                ? formatTime(audioRef.current.currentTime)
                : "00:00"}
            </div>
          </div>
          <div className="third">
            {player?.playStatus !== PLAY_STATUS.PLAYING ? (
              <PlayIcon onClick={onStart} />
            ) : (
              <PauseIcon onClick={onStop} />
            )}
          </div>
        </div>

        {/* <div>Track: {info.trackId}</div>
      <div>Drift (ms): {Number(info.driftMs).toFixed(1)}</div>
      <div>Action: {info.action}</div> */}

        <audio
          ref={audioRef}
          controls
          style={{ width: "100%", marginTop: 12, display: "none" }}
        />
        {/* <p style={{ color: "#666" }}>
        برای همگامی بهتر: در شروع چند ثانیه صبر کنید تا بافر شکل بگیرد.
      </p> */}
      </div>
    </>
  );
};

export default HomePage;
