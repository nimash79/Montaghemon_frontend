import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import { addFavorite, getTracks, removeFavorite } from "../api/tracks";
import UserIcon from "../components/icons/UserIcon";
import PlayIcon from "../components/icons/MediaIcons/PlayIcon";
import CustomInput from "../components/shared/CustomInput";
import ProgressLine from "../components/media/ProgressLine";
import PauseIcon from "../components/icons/MediaIcons/PauseIcon";
import { useWs } from "../ws/WsProvider";
import { ClockSync } from "../sync/clock";
import PasswordModal from "../components/modals/PasswordModal";
import MusicIcon from "../components/icons/MusicIcon";
import MessageModal from "../components/modals/MessageModal";
import { notif_error, notif_success } from "../lib/toast";
import CustomButton from "../components/shared/CustomButton";
import PlusIcon from "./../components/icons/PlusIcon";
import CheckIcon from "../components/icons/CheckIcon";
import LoadingModal from "./../components/modals/LoadingModal";
import CustomSlider from "../components/shared/CustomSlider";
import VolumeDownIcon from "../components/icons/VolumeDownIcon";
import VolumeUpIcon from "./../components/icons/VolumeUpIcon";
import { getCategories } from "../api/categories";
import { Device } from "mediasoup-client";

import "swiper/css";
import "swiper/css/navigation";
import RepeatIcon from "../components/icons/MediaIcons/RepeatIcon";
import MicrophoneMuteIcon from "../components/icons/MicrohphoneMuteIcon";
import MicrophoneIcon from "./../components/icons/MicrophoneIcon";

const PlayerPage = () => {
  const [loadingModal, setLoadingModal] = useState(true);
  const [passwordModal, setPasswordModal] = useState(true);
  const [messageModal, setMessageModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState();
  const [activeCategory, setActiveCategory] = useState();
  const [search, setSearch] = useState("");
  const [allTracks, setAllTracks] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeTrack, setActiveTrack] = useState();
  const [room, setRoom] = useState();
  const [repeat, setRepeat] = useState(false);

  const [duration, setDuration] = useState();
  const [currentTime, setCurrentTime] = useState();
  const [paused, setPaused] = useState(true);
  const [volume, setVolume] = useState(1);

  const { roomId } = useParams();

  const audioRef = useRef();

  const { status, send, subscribe, ws } = useWs();
  const clockRef = useRef(null);
  const wakeLockRef = useRef(null);
  const [awake, setAwake] = useState(false);
  const [offset, setOffset] = useState(0);
  const [roomMembers, setRoomMembers] = useState(0);

  // --- MIC (mediasoup) ---
  const micDeviceRef = useRef(null);
  const micSendTransportRef = useRef(null);
  const micProducerRef = useRef(null);
  const micStreamRef = useRef(null);

  const [micOn, setMicOn] = useState(false);
  const [micBusy, setMicBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getCategories({ all: false, disabled: false });
      setCategories(res.data.categories);
      setActiveCategory(localStorage.getItem("activeCategory"));
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
        if (msg.track.name) setActiveTrack(msg.track);
        playRoom(msg);
        requestWakeLock();
        (async () => {
          const res = await getTracks();
          if (res.data.ok) {
            setTotal(res.data.total);
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
      } else if (msg.type === "get_volume") {
        if (audioRef.current) {
          audioRef.current.volume = msg.volume;
        }
      } else if (msg.type === "ms_router_rtp_capabilities") {
        // فقط وقتی واقعاً قصد startMic داریم
        if (!micStreamRef.current) return;

        (async () => {
          try {
            const device = new Device();
            await device.load({ routerRtpCapabilities: msg.rtpCapabilities });
            micDeviceRef.current = device;

            send({ type: "ms_create_send_transport", roomId });
          } catch (e) {
            console.error(e);
            notif_error("خطا در آماده‌سازی میکروفون (Device).");
          }
        })();
      } else if (msg.type === "ms_send_transport_created") {
        (async () => {
          try {
            if (!micDeviceRef.current) return;

            const transport = micDeviceRef.current.createSendTransport(
              msg.params,
            );
            micSendTransportRef.current = transport;

            transport.on("connect", ({ dtlsParameters }, callback, errback) => {
              send({
                type: "ms_connect_transport",
                roomId,
                direction: "send",
                dtlsParameters,
              });
              callback();
            });

            transport.on(
              "produce",
              ({ kind, rtpParameters }, callback, errback) => {
                send({ type: "ms_produce_mic", roomId, kind, rtpParameters });

                // انتظار برای ack
                const unsub2 = subscribe((m2) => {
                  if (m2.type === "ms_mic_produced") {
                    callback({ id: m2.producerId });
                    unsub2();
                  } else if (
                    m2.type === "ms_error" &&
                    m2.action === "produce_mic"
                  ) {
                    errback(new Error(m2.error));
                    unsub2();
                  }
                });
              },
            );

            const track = micStreamRef.current?.getAudioTracks()?.[0];
            if (!track) {
              notif_error("ترک میکروفون پیدا نشد.");
              return;
            }

            const producer = await transport.produce({ track });
            micProducerRef.current = producer;

            setMicOn(true);
            notif_success("میکروفون فعال شد.");
          } catch (e) {
            console.error(e);
            notif_error("فعال‌سازی میکروفون ناموفق بود.");
          }
        })();
      } else if (msg.type === "ms_error") {
        // اختیاری: لاگ/نمایش خطاهای mediasoup
        // console.warn("mediasoup error:", msg.action, msg.error);
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
      audioRef.current.currentTime = current;
      audioRef.current.play();
    } else {
      audioRef.current.currentTime = msg.room.basePositionMs / 1000;
      audioRef.current.pause();
    }
  };

  const startTrack = (track, cat) => {
    setActiveTrack(track);
    setActiveCategory(cat);
    localStorage.setItem("activeCategory", cat);
    if (audioRef.current.src !== track.hlsUrl)
      send({ type: "start_track", roomId, track });
    else send({ type: "resume_track", roomId });
  };

  const pauseTrack = () => {
    send({ type: "pause_track", roomId });
  };

  const endTrack = () => {
    let nextTrack;
    let playlist;
    if (repeat) nextTrack = activeTrack;
    else {
      if (!activeCategory) playlist = allTracks.filter((t) => t.isFavorite);
      else
        playlist = allTracks.filter((t) =>
          t.categories.includes(activeCategory),
        );
      const activeIndex = playlist.findIndex((t) => t._id === activeTrack._id);
      if (playlist[activeIndex + 1]) nextTrack = playlist[activeIndex + 1];
      else nextTrack = playlist[0];
    }
    setActiveTrack(nextTrack);
    pauseTrack();
    setTimeout(() => {
      audioRef.current.src = "";
      startTrack(nextTrack, activeCategory);
    }, 500);
  };

  const searchTracks = (value) => {
    setTracks(
      allTracks.filter(
        (t) => t.name.includes(value) || t.singer.includes(value),
      ),
    );
  };

  const sendRoomMessage = (message, link) => {
    function isValidUrl(string) {
      try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch (_) {
        return false;
      }
    }
    if (link.length && !isValidUrl(link)) {
      notif_error("لینک وارد شده معتبر نمی باشد.");
      return;
    }

    send({ type: "send_message", message, link });
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

  useEffect(() => {
    let filtered = allTracks;

    if (category) {
      filtered = filtered.filter((t) => t.categories?.includes(category));
    } else {
      filtered = filtered.filter((t) => t.isFavorite);
    }

    if (search) {
      filtered = filtered.filter((t) =>
        t.name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    setTracks(filtered);
  }, [category, search, allTracks]);

  const startMic = async () => {
    if (micOn || micBusy) return;
    setMicBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      micStreamRef.current = stream;

      // شروع flow سیگنالینگ
      send({ type: "ms_get_router_rtp_capabilities", roomId });
    } catch (e) {
      console.error(e);
      notif_error("دسترسی به میکروفون ممکن نیست.");
    } finally {
      setMicBusy(false);
    }
  };

  const stopMic = () => {
    try {
      micProducerRef.current?.close();
    } catch {}
    micProducerRef.current = null;

    try {
      micSendTransportRef.current?.close?.();
    } catch {}
    micSendTransportRef.current = null;

    if (micStreamRef.current) {
      for (const t of micStreamRef.current.getTracks()) t.stop();
    }
    micStreamRef.current = null;

    micDeviceRef.current = null;

    setMicOn(false);
    send({ type: "ms_close_mic", roomId });
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
        roomLink={room?.link}
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
                  onKeyUp={(event) => setSearch(event.target.value)}
                />
              </div>
              <CustomButton
                text={"ارسال اطلاعیه"}
                style={{ width: "30%" }}
                onClick={() => setMessageModal(true)}
              />

              <div
                style={{
                  width: 2,
                  borderRadius: 8,
                  height: 38,
                  backgroundColor: "#7B61FF",
                  marginInlineStart: 8,
                  marginInlineEnd: 8,
                }}
              ></div>

              <div
                style={{
                  marginInlineStart: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onClick={() => (micOn ? stopMic() : startMic())}
              >
                {micOn ? <MicrophoneIcon color={"#7B61FF"} /> : <MicrophoneMuteIcon />}
                <div
                    style={{
                      opacity: micOn ? 1 : 0,
                      marginTop: 4,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#FF3B30",
                      boxShadow: "0 0 0 2px white",
                    }}
                  ></div>
              </div>
            </div>
          </div>
          <div className="tracks">
            <div className="slider-container">
              <Swiper
                modules={[Navigation]}
                spaceBetween={15}
                slidesPerView={"auto"}
                centeredSlides={true}
                loop={true}
              >
                <SwiperSlide style={{ width: 255 }}>
                  <div className="category" onClick={() => setCategory(null)}>
                    <img
                      src={"/favorites.png"}
                      alt={"علاقه مندی ها"}
                      className={!category ? "active" : ""}
                    />
                    <h3 className={!category ? "active" : ""}>علاقه مندی ها</h3>
                  </div>
                </SwiperSlide>
                {[...categories]
                  .sort((a, b) => {
                    if (a.name === "مقاومت و جهاد اسلامی") return -1;
                    if (b.name === "مقاومت و جهاد اسلامی") return 1;
                    return 0;
                  })
                  .map((cat) => (
                    <SwiperSlide key={cat._id} style={{ width: 255 }}>
                      <div
                        className="category"
                        onClick={() => setCategory(cat._id)}
                      >
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className={cat._id === category ? "active" : ""}
                        />
                        <h3 className={cat._id === category ? "active" : ""}>
                          {cat.name}
                        </h3>
                      </div>
                    </SwiperSlide>
                  ))}
              </Swiper>
            </div>
            <div className="separator"></div>
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
                        startTrack(track, category);
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
              <RepeatIcon
                style={{ marginInlineEnd: 8, cursor: "pointer" }}
                onClick={() => setRepeat((r) => !r)}
                color={repeat ? "#7B61FF" : "#ADADAD"}
              />
              {paused ? (
                <PlayIcon
                  width={50}
                  height={50}
                  onClick={() => startTrack(activeTrack, activeCategory)}
                />
              ) : (
                <PauseIcon width={50} height={50} onClick={pauseTrack} />
              )}
            </div>
            <div className="second" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 20, direction: "ltr", width: "4ch" }}>
                {duration ? formatTime(duration) : "0:00"}
              </div>
              <ProgressLine playedSec={currentTime} durationSec={duration} />
              <div style={{ fontSize: 20, direction: "ltr", width: "4ch" }}>
                {currentTime ? formatTime(currentTime) : "0:00"}
              </div>
            </div>
            <div className="third" style={{ marginTop: 12 }}>
              <VolumeUpIcon style={{ width: 32.25 }} color="#7B61FF" />
              <CustomSlider
                value={volume}
                onChange={(v) => {
                  setVolume(v);
                  send({ type: "set_volume", roomId, volume: v });
                }}
              />
              <VolumeDownIcon style={{ width: 32.25 }} color="#7B61FF" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerPage;
