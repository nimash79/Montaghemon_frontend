import WifiIcon from './../icons/WifiIcon';

const StatusBar = ({ quality, containerStyle }) => {
  const map = {
    good: { text: "عالی", color: "#16a34a" },
    ok: { text: "متوسط", color: "#f59e0b" },
    bad: { text: "ضعیف", color: "#f3554c" },
    NONE: { text: "نامعلوم", color: "grey" },
  };
  const s = map[quality] || map.NONE;

  return (
    <div className="status-bar" style={containerStyle}>
      <WifiIcon className="icon" />
      <div className="text">
        <span>وضعیت اتصال:</span>
        <span>{s.text}</span>
      </div>
      <div className="circle" style={{backgroundColor: s.color}}></div>
    </div>
  );
};

export default StatusBar;
