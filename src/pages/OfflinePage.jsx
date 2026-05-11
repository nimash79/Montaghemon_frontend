import { useEffect, useRef, useState } from "react";

import { getTracks } from "../api/tracks";
import UserIcon from "../components/icons/UserIcon";
import PlayIcon from "../components/icons/MediaIcons/PlayIcon";
import CustomInput from "../components/shared/CustomInput";
import ProgressLine from "../components/media/ProgressLine";
import PauseIcon from "../components/icons/MediaIcons/PauseIcon";

const OfflinePage = () => {
  const [allTracks, setAllTracks] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeTrack, setActiveTrack] = useState();

  const [duration, setDuration] = useState();
  const [currentTime, setCurrentTime] = useState();
  const [paused, setPaused] = useState();

  const audioRef = useRef();

  useEffect(() => {
    (async () => {
      const res = await getTracks();
      if (res.data.ok) {
        setTotal(res.data.total);
        setAllTracks(res.data.tracks);
        setTracks(res.data.tracks);
      }
    })();
  }, []);

  const startTrack = (track) => {
    setActiveTrack(track);
    if (audioRef.current.src !== track.hlsUrl)
      audioRef.current.src = track.hlsUrl;
    audioRef.current.play();
  };

  const pauseTrack = () => {
    audioRef.current.pause();
  };

  const endTrack = () => {
    if (allTracks[activeTrack.id + 1])
      startTrack(allTracks[activeTrack.id + 1]);
    else startTrack(allTracks[0]);
  };

  const searchTracks = (value) => {
    setTracks(
      allTracks.filter(
        (t) => t.name.includes(value) || t.singer.includes(value),
      ),
    );
  };

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  return (
    <div className="player-page">
      <div className="fixed-top">
        <div className="search">
        <CustomInput
          placeholder="جستجو ..."
          onKeyUp={(event) => searchTracks(event.target.value)}
        />
      </div>
      </div>
      <div className="tracks">
        {tracks.map((track) => (
          <div className="track" key={track.id}>
            <img src={track.thumbnail} />
            <div className="track-titles">
              <div>{track.name}</div>
              <div className="track-singer">{track.singer}</div>
            </div>
            {track.id === activeTrack?.id && !paused ? (
              <PauseIcon width={50} height={50} onClick={pauseTrack} />
            ) : (
              <PlayIcon
                width={50}
                height={50}
                onClick={() => startTrack(track)}
              />
            )}
          </div>
        ))}
      </div>
      <audio
        ref={audioRef}
        style={{ display: "none" }}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
        onDurationChange={() => setDuration(audioRef.current.duration)}
        onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onEnded={endTrack}
      />
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
              onClick={() => startTrack(activeTrack)}
            />
          ) : (
            <PauseIcon width={50} height={50} onClick={pauseTrack} />
          )}
        </div>
        <div className="second">
          <div style={{ fontSize: 20, direction: "ltr" }}>
            {duration ? formatTime(duration) : "00:00"}
          </div>
          <ProgressLine playedSec={currentTime} durationSec={duration} />
          <div style={{ fontSize: 20, direction: "ltr", width: "4ch" }}>
            {currentTime ? formatTime(currentTime) : "00:00"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
