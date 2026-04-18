import { useEffect, useRef, useState } from "react";

import { getTracks } from "../api/tracks";
import UserIcon from "../components/icons/UserIcon";
import PlayIcon from "../components/icons/MediaIcons/PlayIcon";
import CustomInput from "../components/shared/CustomInput";
import ProgressLine from "../components/media/ProgressLine";
import PauseIcon from "../components/icons/MediaIcons/PauseIcon";
import { useWs } from "../ws/WsProvider";
import { ClockSync } from "../sync/clock";
import { useParams } from "react-router";
import PasswordModal from "../components/modals/PasswordModal";

const PlayerPage = () => {
  const [passwordModal, setPasswordModal] = useState(true);
  const [allTracks, setAllTracks] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeTrack, setActiveTrack] = useState();
  const [room, setRoom] = useState();

  const [duration, setDuration] = useState();
  const [currentTime, setCurrentTime] = useState();
  const [paused, setPaused] = useState(true);

  const { roomId } = useParams();

  const audioRef = useRef();

  const { status, send, subscribe, ws } = useWs();
  const clockRef = useRef(null);
  const wakeLockRef = useRef(null);
  const [awake, setAwake] = useState(false);
  const [offset, setOffset] = useState(0);
  const [roomMembers, setRoomMembers] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await getTracks();
      if (res.data.ok) {
        setTotal(res.data.total);
        setAllTracks(res.data.tracks);
        setTracks(res.data.tracks);
      }
    })();
    return () => {
      send({ type: "leave_room", roomId });
    };
  }, []);

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
        return;
      } else if (msg.type === "join_room") {
        console.log("msg:", msg);
        if (msg.track.name) setActiveTrack(msg.track);
        playRoom(msg);
        requestWakeLock();
      } else if (msg.type === "play_track") {
        playRoom(msg);
      } else if (msg.type === "pause_track") {
        setRoom(msg.room);
        audioRef.current.pause();
      } else if (msg.type === "resume_track") {
        playRoom(msg);
      }
    });
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    if (!audioRef.current || !room) return;
    const interval = setInterval(() => {
      if (!room.isPlaying) {
        clearInterval(interval);
        return;
      }
      const serverNow = clockRef.current.nowServerMs();
      const desired =
        room.basePositionSeconds + (serverNow - room.startAtServerMs) / 1000;
      const actual = audioRef.current.currentTime;
      const drift = actual - desired;
      if (Math.abs(drift) > 0.2) {
        audioRef.current.currentTime = desired;
      }
    }, 500);
    return () => clearInterval(interval);
  }, [room?.isPlaying]);

  const playRoom = (msg) => {
    setRoom(msg.room);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = "";

    const { startAtServerMs, positionSeconds } = msg;
    const offset = clockRef.current.offsetMs;
    const localStart = startAtServerMs - offset;
    audioRef.current.src = msg.room.hlsUrl;
    if (msg.room.isPlaying) {
      const now = Date.now();
      const elapsed = (now - localStart) / 1000;
      const current = positionSeconds + Math.max(elapsed, 0);
      audioRef.current.currentTime = current;
      audioRef.current.play();
    } else {
      audioRef.current.currentTime = positionSeconds;
      audioRef.current.pause();
    }
  };

  const startTrack = (track) => {
    setActiveTrack(track);
    if (audioRef.current.src !== track.hlsUrl)
      send({ type: "start_track", roomId, track });
    else send({ type: "resume_track", roomId });
  };

  const pauseTrack = () => {
    send({ type: "pause_track", roomId });
  };

  const endTrack = () => {
    pauseTrack();
    setTimeout(() => {
      if (allTracks[activeTrack.id + 1])
        startTrack(allTracks[activeTrack.id + 1]);
      else startTrack(allTracks[0]);
    }, 500);
  };

  const searchTracks = (value) => {
    setTracks(allTracks.filter((t) => t.name.includes(value)));
  };

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  return (
    <div className="player-page">
      <PasswordModal
        isOpen={passwordModal}
        roomId={roomId}
        setPasswordModal={setPasswordModal}
      />
      <audio
        ref={audioRef}
        style={{ display: "none" }}
        onLoadedMetadata={() => {
          setDuration(audioRef.current.duration);
          setCurrentTime(
            Math.min(audioRef.current.currentTime, audioRef.current.duration),
          );
        }}
        onDurationChange={() => setDuration(audioRef.current.duration)}
        onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onEnded={endTrack}
      />
      {!passwordModal && (
        <>
          <div className="controller">
            <div>
              <UserIcon />
              <span>{room?.name}</span>
            </div>
            <div>
              <span>{roomMembers}</span>
              <UserIcon />
            </div>
          </div>
          <div className="search">
            <CustomInput
              placeholder="جستجو ..."
              onKeyUp={(event) => searchTracks(event.target.value)}
            />
          </div>
          <div className="tracks">
            {tracks.map((track) => (
              <div className="track" key={track.id}>
                <img src={track.thumbnail} />
                <span>{track.name}</span>
                {track.id === activeTrack?.id && !paused ? (
                  <PauseIcon width={50} height={50} onClick={pauseTrack} />
                ) : (
                  <PlayIcon
                    width={50}
                    height={50}
                    onClick={() => {
                      pauseTrack();
                      setTimeout(() => {
                        startTrack(track);
                      }, 250);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className={`player-status ${activeTrack ? "show" : ""}`}>
            <div className="first">
              <img src={activeTrack?.thumbnail} />
              <span>{activeTrack?.name}</span>
              {paused ? (
                <PlayIcon
                  width={50}
                  height={50}
                  onClick={() => startTrack(activeTrack)}
                />
              ) : (
                <PauseIcon width={50} height={50} onClick={pauseTrack} />
              )}
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
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerPage;
