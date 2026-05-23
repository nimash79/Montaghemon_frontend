import { useEffect, useState } from "react";

import { getRooms } from "../api/rooms";
import UserIcon from "../components/icons/UserIcon";
import CustomInput from "../components/shared/CustomInput";
import { Link } from "react-router";
import ArrowLeftIcon from "./../components/icons/ArrowLeftIcon";
import MusicIcon from "../components/icons/MusicIcon";

const RoomsPage = () => {
  const [allRooms, setAllRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await getRooms();
      if (res.data.ok) {
        const sortedRooms = [...res.data.rooms].sort(
          (a, b) => b.members - a.members,
        );
        setTotal(sortedRooms.length);
        setAllRooms(sortedRooms);
        setRooms(sortedRooms);
      }
    })();
  }, []);

  const searchRooms = (value) => {
    setRooms(allRooms.filter((t) => t.name.includes(value) || t.city.includes(value)));
  };

  return (
    <div className="rooms-page">
      <div className="controller">
        <div>
          <MusicIcon />
          <span>{total}</span>
        </div>
      </div>
      <div className="search">
        <CustomInput
          placeholder="جستجو ..."
          onKeyUp={(event) => searchRooms(event.target.value)}
        />
      </div>
      <div className="rooms">
        {rooms.map((room) => (
          <Link to={`/room/${room.roomId}`} key={room.roomId}>
            <div className="room">
              <div className="room-thumbnail">
                <img src={room.logo} />
              </div>
              <div className="room-text">
                <div className="room-name">{room.name}</div>
                <div className="room-trackName">{room.city}</div>
              </div>
              <div className="room-members">
                <span>{room.members}</span>
                <UserIcon width={14} height={14} />
              </div>
              <ArrowLeftIcon />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RoomsPage;
