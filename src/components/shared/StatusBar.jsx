const StatusBar = ({ quality }) => {
  const map = {
    good: { text: "وضعیت اتصال: عالی", color: "#16a34a" },
    ok: { text: "وضعیت اتصال: متوسط…", color: "#f59e0b" },
    bad: { text: "وضعیت اتصال:‌ ضعیف", color: "#f3554c" },
    NONE: { text: "وضعیت اتصال:‌ نامعلوم", color: "grey" },
  };
  const s = map[quality] || map.NONE;

  return (
    <div className="status-bar" style={{ background: s.color }}>
      {s.text}
    </div>
  );
};

export default StatusBar;
