import PauseIcon from "../icons/ServerPlayStatus/PauseIcon";
import PlayIcon from "../icons/ServerPlayStatus/PlayIcon";
import StopIcon from "../icons/ServerPlayStatus/StopIcon";

const ServerPlayStatus = ({ status }) => {
  if (!status) return null;

  let text = "";
  let type = "";
  let Icon = null;

  switch (status) {
    case "playing":
      text = "پخش‌کننده فعال است";
      type = "playing";
      Icon = PlayIcon;
      break;

    case "paused":
      text = "پخش‌کننده متوقف شده است";
      type = "paused";
      Icon = PauseIcon;
      break;

    case "end":
      text = "پخش به پایان رسیده است";
      type = "end";
      Icon = StopIcon;
      break;

    default:
      return null;
  }


  return (
    <div className={`server-play-status ${type}`}>
      <div className="icon">
        <Icon />
      </div>
      <span className="text">{text}</span>
    </div>
  );
};

export default ServerPlayStatus;