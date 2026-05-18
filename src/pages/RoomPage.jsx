import { useEffect, useMemo, useRef, useState } from "react";

import UserIcon from "../components/icons/UserIcon";
import PlayIcon from "../components/icons/MediaIcons/PlayIcon";
import ProgressLine from "../components/media/ProgressLine";
import PauseIcon from "../components/icons/MediaIcons/PauseIcon";
import { useWs } from "../ws/WsProvider";
import StatusBar from "../components/shared/StatusBar";
import { ClockSync } from "../sync/clock";
import { Link, useParams } from "react-router";
import ServerPlayStatus from "../components/shared/ServerPlayStatus";
import MusicIcon from "./../components/icons/MusicIcon";
import AlarmIcon from "../components/icons/AlarmIcon";

const RoomPage = () => {
  const [room, setRoom] = useState();
  const [duration, setDuration] = useState();
  const [currentTime, setCurrentTime] = useState();
  const [paused, setPaused] = useState(true);
  const [playedByUser, setPlayedByUser] = useState(false);
  const [playStatus, setPlayStatus] = useState();
  const [quality, setQuality] = useState("good");

  const { roomId } = useParams();

  const audioRef = useRef();
  const notificationRef = useRef();
  const qualityRef = useRef("good");
  const stableCounter = useRef(0);

  const { status, send, subscribe, ws } = useWs();
  const clockRef = useRef(null);
  const wakeLockRef = useRef(null);
  const [awake, setAwake] = useState(false);
  const [offset, setOffset] = useState(0);
  const [roomMembers, setRoomMembers] = useState(0);

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

  useEffect(() => {
    return () => {
      send({ type: "leave_room", roomId });
    };
  }, []);

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
    clock.start(1000);

    send({ type: "join_room", roomId });

    return () => {
      clockRef.current?.stop();
    };
  }, [ws]);

  useEffect(() => {
    const unsub = subscribe((msg) => {
      if (msg.type === "time_pong") {
        clockRef.current?.onPong(msg);
        setOffset(clockRef.current?.offsetMs ?? 0);
      } else if (msg.type === "room_members") {
        setRoomMembers(msg.count);
      } else if (msg.type === "join_room") {
        playRoom(msg);
        requestWakeLock();
      } else if (msg.type === "play_track") {
        playRoom(msg);
      } else if (msg.type === "pause_track") {
        setRoom(msg.room);
        setPlayStatus("paused");
        audioRef.current.pause();
      } else if (msg.type === "resume_track") {
        playRoom(msg);
      } else if (msg.type === "get_message") {
        notificationRef.current.play();
        setRoom(msg.room);
      } else if (msg.type === "get_volume") {
        if (audioRef.current) {
          audioRef.current.volume = msg.volume;
        }
      }
    });
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    if (!audioRef.current || !room) return;

    const interval = setInterval(() => {
      if (!room.isPlaying || !audioRef.current.src) {
        clearInterval(interval);
        return;
      }

      const desired = calcCurrent(room, clockRef.current) / 1000;
      const actual = audioRef.current.currentTime;
      const drift = Math.abs(actual - desired);

      if (drift > 0.3) audioRef.current.currentTime = desired;

      let newQuality;
      if (drift <= 0.3) newQuality = "good";
      else if (drift <= 0.5) newQuality = "ok";
      else newQuality = "bad";

      const oldQuality = qualityRef.current;
      if (newQuality === "bad") {
        qualityRef.current = "bad";
        setQuality("bad");
        stableCounter.current = 0;
        return;
      }
      if (newQuality !== oldQuality) {
        stableCounter.current += 1;
        if (stableCounter.current >= 6) {
          qualityRef.current = newQuality;
          setQuality(newQuality);
          stableCounter.current = 0;
        }
      } else {
        stableCounter.current = 0;
      }
    }, 250);

    return () => clearInterval(interval);
  }, [room?.isPlaying]);

  const calcCurrent = (room, clock) => {
    if (!room) return 0;

    if (!room.isPlaying) {
      return room.basePositionMs;
    }

    const serverNow = clock.nowServerMs();

    return room.basePositionMs + (serverNow - room.startAtServerMs);
  };

  const playRoom = (msg) => {
    setRoom(msg.room);

    audioRef.current.src = msg.room.hlsUrl;
    if (msg.room.isPlaying) {
      setPlayStatus("playing");
      const current = calcCurrent(msg.room, clockRef.current) / 1000;
      audioRef.current.currentTime = current;
      setPlayedByUser((p) => {
        if (p) audioRef.current.play();
        return p;
      });
    } else {
      setPlayStatus("paused");
      audioRef.current.currentTime = msg.room.basePositionMs / 1000;
      audioRef.current.pause();
    }
  };

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  return (
    <>
      <StatusBar
        quality={
          room?.isPlaying && !audioRef.current?.paused ? quality : "NONE"
        }
      />
      <audio ref={notificationRef} src="/notification.mp3" />
      <div className="room-page">
        <div className="controller">
          <div>
            <MusicIcon />
            <span>{room?.name}</span>
          </div>
          <div>
            <span>{roomMembers}</span>
            <UserIcon />
          </div>
        </div>
        <div className="room-message">
          <div className="room-message-title">اطلاعیه مسئول کاروان</div>
          <div className="room-message-body">
            <div className="room-message-icon">
              <AlarmIcon color="#CBC2FB" />
            </div>
            <div className="room-message-text">
              {room?.message || "..."}
              <br />
              {room?.link && (
                <Link to={room.link} target="_blank">
                  {room.link}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="player">
          <div className="first">
            <img src={room?.thumbnail} alt={room?.trackName} />
            <div>{room?.trackName}</div>
            <span>{room?.trackSinger}</span>
          </div>
          <div className="second">
            <div style={{ fontSize: 20, direction: "ltr" }}>
              {duration ? formatTime(duration) : "0:00"}
            </div>
            <ProgressLine playedSec={currentTime} durationSec={duration} />
            <div style={{ fontSize: 20, direction: "ltr", width: "4ch" }}>
              {currentTime ? formatTime(currentTime) : "0:00"}
            </div>
          </div>
          <div
            className={`third ${!playedByUser && playStatus === "playing" ? "play-button-hint" : ""}`}
          >
            {!playedByUser ? (
              <PlayIcon
                onClick={() => {
                  setPlayedByUser(true);
                  if (room?.isPlaying) audioRef.current.play();
                }}
              />
            ) : (
              <PauseIcon
                onClick={() => {
                  setPlayedByUser(false);
                  audioRef.current.pause();
                }}
              />
            )}
          </div>
          {!playedByUser && playStatus === "playing" ? (
            <div
              className="fourth"
              style={{ textAlign: "center", fontSize: 12 }}
            >
              برای شنیدن پخش روی دکمه بالا کلیک کنید.
            </div>
          ) : null}
          <ServerPlayStatus status={playStatus} />
        </div>

        <audio
          ref={audioRef}
          style={{ display: "none" }}
          onLoadedMetadata={() => {
            setDuration(audioRef.current.duration);
            if (
              audioRef.current.duration > 0 &&
              audioRef.current.currentTime >= audioRef.current.duration - 0.3
            )
              setPlayStatus("end");
            setCurrentTime(
              Math.min(audioRef.current.currentTime, audioRef.current.duration),
            );
          }}
          onDurationChange={() => setDuration(audioRef.current.duration)}
          onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onEnded={() => setPlayStatus("end")}
        />
      </div>
    </>
  );
};

export default RoomPage;
