import { useEffect, useRef, useState } from "react";

import { getTracks } from "../../api/tracks";
import UserIcon from "../../components/icons/UserIcon";
import CustomInput from "../../components/shared/CustomInput";
import { Link } from "react-router";

const TracksPage = () => {
  const [allTracks, setAllTracks] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [total, setTotal] = useState(0);

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

  const searchTracks = (value) => {
    setTracks(
      allTracks.filter(
        (t) => t.name.includes(value) || t.singer.includes(value),
      ),
    );
  };

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
        {tracks.map((track, index) => (
          <Link to={`/edit-track/${track._id}`} className="track" key={track._id}>
            <img src={track.thumbnail} />
            <div className="track-titles">
              <div>{track.name}</div>
              <div className="track-singer">{track.singer}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TracksPage;
