import { useEffect, useRef, useState, useMemo } from "react";

import { ClockSync } from "../sync/clock";
import { SyncHlsPlayer } from "../sync/hls_player";
import StatusBar from "../components/shared/StatusBar";
import PlayIcon from "../components/icons/MediaIcons/PlayIcon";
import PauseIcon from "../components/icons/MediaIcons/PauseIcon";
import { PLAY_STATUS } from "../lib/constants";

const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${import.meta.env.VITE_WS_HOST}/ws`;
import ProgressLine from "../components/media/ProgressLine";
import UserIcon from "../components/icons/UserIcon";
import { Link } from "react-router";
import GuideIcon from "./../components/icons/GuideIcon";
import FaqIcon from "./../components/icons/FaqIcon";
import AboutUsIcon from "./../components/icons/AboutUsIcon";
import CustomButton from "./../components/shared/CustomButton";
import { useWs } from "../ws/WsProvider";

const HomePage = () => {
  const { status, send, subscribe, ws } = useWs();
  const audioRef = useRef(null);
  const clockRef = useRef(null);
  const wakeLockRef = useRef(null);
  const [awake, setAwake] = useState(false);

  const [offset, setOffset] = useState(0);
  const [info, setInfo] = useState({
    trackId: "-",
    trackName: "-",
    trackSinger: "-",
    driftMs: 0,
    quality: "-",
    action: "-",
  });
  const [onlineCount, setOnlineCount] = useState(0);

  const player = useMemo(
  () =>
    new SyncHlsPlayer({
      clock: {
        nowServerMs: () => Date.now() + (clockRef.current?.offsetMs || 0),
      },
    }),
  [],
);


  const requestWakeLock = async () => {
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setAwake(true);

      wakeLockRef.current.addEventListener("release", () => {
        setAwake(false);
      });
    } catch (err) {
      console.error(err);
      setAwake(false);
    }
  };

  const releaseWakeLock = async () => {
    try {
      await wakeLockRef.current?.release();
      wakeLockRef.current = null;
      setAwake(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && awake) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [awake]);

  useEffect(() => {
    if (status === "disconnected") return;
    const clock = new ClockSync(ws);
    clockRef.current = clock;
    player.clock = clock;
    clock.start(1000);
    send({ type: "need_schedule" });

    return () => {
      clockRef.current?.stop();
      player.detach();
    };
  }, [ws]);

  useEffect(() => {
    const unsub = subscribe((msg) => {
      if (msg.type === "time_pong") {
        clockRef.current?.onPong(msg);
        setOffset(clockRef.current?.offsetMs ?? 0);
      }

      if (msg.type === "online_count") {
        setOnlineCount(msg.count + 204);
        return;
      }

      if (msg.type === "hello" || msg.type === "schedule") {
        player.setSchedule(msg.schedule || []);
        if (msg.forced) player.setForced(msg.forced);
      }
      if (msg.type === "force") player.setForced(msg.forced);
    });
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    player.attach(audioRef.current);
    const t = setInterval(() => {
      const r = player.tick();
      if (r?.ok)
        setInfo({
          trackId: r.trackId,
          trackName: r.trackName,
          trackSinger: r.trackSinger,
          driftMs: r.driftMs,
          quality: r.quality,
          action: r.action,
        });
    }, 250);
    return () => clearInterval(t);
  }, [player]);

  async function onStart() {
    player.setPlayedByUser(true);
    send({ type: "need_schedule" });
    await player.start();
    requestWakeLock();
  }

  function onStop() {
    player.setPlayedByUser(false);
    player.stop();
    releaseWakeLock();
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }
  return (
    <>
      <StatusBar quality={info?.quality} />
      <div className="home-header">
        <Link to={"/rooms"} className="rooms-button">
          وارد هیئت خود شوید
        </Link>
        <Link to={"/guide"} className="guide">
          <FaqIcon color="#c7d2fe" />
          <span>راهنما</span>
        </Link>
      </div>
      <div className="home-page">
        <div className="player">
          <div className="first">
            <img src={player?.thumbnail} alt={info.trackName} />
            <div>{info.trackName}</div>
            <span>{info.trackSinger}</span>
          </div>
          <div className="second">
            <div style={{ fontSize: 20, direction: "ltr" }}>
              {audioRef?.current?.duration
                ? formatTime(audioRef.current.duration)
                : "0:00"}
            </div>
            <ProgressLine
              playedSec={audioRef?.current?.currentTime}
              durationSec={audioRef?.current?.duration}
            />
            <div style={{ fontSize: 20, direction: "ltr", width: "4ch" }}>
              {audioRef?.current?.currentTime
                ? formatTime(audioRef.current.currentTime)
                : "0:00"}
            </div>
          </div>
          <div className={`third ${player?.playedByUser ? "": "play-button-hint"}`}>
            {player?.playedByUser ? (
              <PauseIcon onClick={onStop} />
            ) : (
              <PlayIcon onClick={onStart} />
            )}
          </div>
        </div>

        <audio ref={audioRef} controls style={{ display: "none" }} />
      </div>
    </>
  );
};

export default HomePage;
