import WifiIcon from './../icons/WifiIcon';

const PlayStatusBar = ({ status }) => {
  const map = {
    playing: { text: "درحال پخش", color: "#16a34a" },
    paused: { text: "توقف", color: "#f59e0b" },
    end: { text: "اتمام پخش", color: "#f3554c" },
    NONE: { text: "نامعلوم", color: "grey" },
  };
  const s = map[status] || map.NONE;

  return (
    <div className="status-bar">
      <WifiIcon className="icon" />
      <div className="text">
        <span>وضعیت پخش:</span>
        <span>{s.text}</span>
      </div>
      <div className="circle" style={{backgroundColor: s.color}}></div>
    </div>
  );
};

export default PlayStatusBar;
