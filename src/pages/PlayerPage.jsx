import { useEffect, useRef, useState } from "react";

import { addFavorite, getTracks, removeFavorite } from "../api/tracks";
import UserIcon from "../components/icons/UserIcon";
import PlayIcon from "../components/icons/MediaIcons/PlayIcon";
import CustomInput from "../components/shared/CustomInput";
import ProgressLine from "../components/media/ProgressLine";
import PauseIcon from "../components/icons/MediaIcons/PauseIcon";
import { useWs } from "../ws/WsProvider";
import { ClockSync } from "../sync/clock";
import { useParams } from "react-router";
import PasswordModal from "../components/modals/PasswordModal";
import MusicIcon from "../components/icons/MusicIcon";
import MessageModal from "../components/modals/MessageModal";
import { notif_error, notif_success } from "../lib/toast";
import CustomButton from "../components/shared/CustomButton";
import PlusIcon from "./../components/icons/PlusIcon";
import CheckIcon from "../components/icons/CheckIcon";
import LoadingModal from './../components/modals/LoadingModal';

const PlayerPage = () => {
  const [loadingModal, setLoadingModal] = useState(true);
  const [passwordModal, setPasswordModal] = useState(true);
  const [messageModal, setMessageModal] = useState(false);
  const [allTracks, setAllTracks] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeTrack, setActiveTrack] = useState();
  const [activeIndex, setActiveIndex] = useState();
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
        if (msg.track.name) setActiveTrack(msg.track);
        playRoom(msg);
        requestWakeLock();
        (async () => {
          const res = await getTracks();
          if (res.data.ok) {
            setTotal(res.data.total);
            console.log("res:", res.data);
            // include favorites and sort
            const favoriteSet = new Set(
              msg.room.favorites.map((id) => id.toString()),
            );

            let allTracksWithFavorite = res.data.tracks.map((track, index) => ({
              ...track,
              originalIndex: index,
              isFavorite: favoriteSet.has(track._id.toString()),
            }));
            allTracksWithFavorite = sortTracks(allTracksWithFavorite);

            setAllTracks(allTracksWithFavorite);
            setTracks(allTracksWithFavorite);
          }
          setLoadingModal(false);
        })();
      } else if (msg.type === "play_track") {
        playRoom(msg);
      } else if (msg.type === "pause_track") {
        setRoom(msg.room);
        audioRef.current.pause();
      } else if (msg.type === "resume_track") {
        playRoom(msg);
      } else if (msg.type === "get_message") {
        setRoom(msg.room);
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
      const desired = calcCurrent(room, clockRef.current) / 1000;
      const actual = audioRef.current.currentTime;
      const drift = Math.abs(actual - desired);
      if (drift > 0.3) audioRef.current.currentTime = desired;
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
      const current = calcCurrent(msg.room, clockRef.current) / 1000;
      console.log(current);
      audioRef.current.currentTime = current;
      audioRef.current.play();
    } else {
      audioRef.current.currentTime = msg.room.basePositionMs / 1000;
      audioRef.current.pause();
    }
  };

  const startTrack = (track, index) => {
    setActiveTrack(track);
    setActiveIndex(index);
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
      if (allTracks[activeIndex + 1])
        startTrack(allTracks[activeIndex + 1], activeIndex + 1);
      else startTrack(allTracks[0], 0);
    }, 500);
  };

  const searchTracks = (value) => {
    setTracks(
      allTracks.filter(
        (t) => t.name.includes(value) || t.singer.includes(value),
      ),
    );
  };

  const sendRoomMessage = (message) => {
    send({ type: "send_message", message });
    setMessageModal(false);
    notif_success("اطلاعیه برای اعضا ارسال شد.");
  };

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  const sortTracks = (list) => {
    return [...list].sort((a, b) => {
      if (b.isFavorite !== a.isFavorite) {
        return b.isFavorite - a.isFavorite;
      }
      return a.originalIndex - b.originalIndex;
    });
  };

  const toggleFavorite = async (trackId) => {
    try {
      const track = allTracks.find((t) => t._id === trackId);
      if (!track) return;

      const isFavorite = track.isFavorite;

      if (isFavorite) {
        await removeFavorite({ roomId: room._id, trackId });
      } else {
        await addFavorite({ roomId: room._id, trackId });
      }

      const update = (prev) =>
        sortTracks(
          prev.map((t) =>
            t._id === trackId ? { ...t, isFavorite: !isFavorite } : t,
          ),
        );

      setTracks((prev) => update(prev));
      setAllTracks((prev) => update(prev));
    } catch (error) {
      console.error("Toggle favorite error:", error);
    }
  };

  return (
    <div className="player-page">
      <PasswordModal
        isOpen={passwordModal}
        roomId={roomId}
        setPasswordModal={setPasswordModal}
      />
      <LoadingModal isOpen={loadingModal} />
      <MessageModal
        isOpen={messageModal}
        setMessageModal={setMessageModal}
        roomMessage={room?.message}
        onSubmit={sendRoomMessage}
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
          <div className="fixed-top">
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
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className="search" style={{ flex: 1, marginInlineEnd: 8 }}>
                <CustomInput
                  placeholder="جستجو ..."
                  onKeyUp={(event) => searchTracks(event.target.value)}
                />
              </div>
              <CustomButton
                text={"ارسال اطلاعیه"}
                style={{ width: "30%" }}
                onClick={() => setMessageModal(true)}
              />
            </div>
          </div>
          <div className="tracks">
            {tracks.map((track, index) => (
              <div className="track" key={track._id}>
                <img src={track.thumbnail} />
                <div className="track-titles">
                  <div>{track.name}</div>
                  <div className="track-singer">{track.singer}</div>
                </div>
                <div
                  className="track-favorite"
                  onClick={() => toggleFavorite(track._id)}
                >
                  {track.isFavorite ? (
                    <CheckIcon borderWidth={0} color={"#00b37e"} />
                  ) : (
                    <PlusIcon />
                  )}
                </div>
                {track._id === activeTrack?._id && !paused ? (
                  <PauseIcon width={50} height={50} onClick={pauseTrack} />
                ) : (
                  <PlayIcon
                    width={50}
                    height={50}
                    onClick={() => {
                      pauseTrack();
                      setTimeout(() => {
                        startTrack(track, index);
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
              <div className="track-titles">
                <div>{activeTrack?.name}</div>
                <div className="track-singer">{activeTrack?.singer}</div>
              </div>
              {paused ? (
                <PlayIcon
                  width={50}
                  height={50}
                  onClick={() => startTrack(activeTrack, activeIndex)}
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
