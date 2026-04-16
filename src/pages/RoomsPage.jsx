import { useEffect, useRef, useState } from "react";

import { getRooms } from "../api/rooms";
import UserIcon from "../components/icons/UserIcon";
import CustomInput from "../components/shared/CustomInput";
import { Link } from "react-router";
import ArrowLeftIcon from "./../components/icons/ArrowLeftIcon";

const RoomsPage = () => {
  const [allRooms, setAllRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await getRooms();
      if (res.data.ok) {
        console.log(res.data);
        setTotal(res.data.rooms.length);
        setAllRooms(res.data.rooms);
        setRooms(res.data.rooms);
      }
    })();
  }, []);

  const searchRooms = (value) => {
    setRooms(allRooms.filter((t) => t.name.includes(value)));
  };

  return (
    <div className="rooms-page">
      <div className="controller">
        <div>
          <UserIcon />
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
              <img src={room.logo} />
              <div className="room-text">
                <div className="room-name">{room.name}</div>
                <div className="room-trackName">
                  افراد آنلاین: {room.members}
                </div>
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
