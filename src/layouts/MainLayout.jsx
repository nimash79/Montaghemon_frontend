import { Outlet, useNavigate } from "react-router";
import BackIcon from "./../components/icons/BackIcon";
import FaqIcon from "../components/icons/FaqIcon";
import { useState } from "react";
import RoomGuideModal from "../components/modals/RoomGuideModal";

const noNeedPages = [
  "/",
  "/add-track",
  "/add-room",
]

const MainLayout = () => {
  const navigate = useNavigate();
  const [roomGuideModal, setRoomGuideModal] = useState(false);

  const renderButton = () => {
    if (noNeedPages.includes(window.location.pathname)) return (<div></div>)
    else if (window.location.pathname.startsWith("/player"))
      return (
        <div className="guide" onClick={() => setRoomGuideModal(true)}>
          <FaqIcon color="#c7d2fe" />
          <span>راهنما</span>
        </div>
        );
    else return (
      <div className="icon" onClick={() => navigate(-1)}>
        <BackIcon />
      </div>
    )
  }
  return (
    <div className="app-container">
      <div className="main-layout">
        <div className="header">
          {renderButton()}
          <div className="header-title">منتقمون</div>
          <div></div>
        </div>
        <RoomGuideModal isOpen={roomGuideModal} setIsOpen={setRoomGuideModal} />
        <div className="body">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
