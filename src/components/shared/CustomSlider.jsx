import { useMemo, useRef, useState, useEffect } from "react";

export default function CustomSlider({
  value = 0,
  onChange,
  onChanging,
  height = 8,
}) {
  const ref = useRef(null);
  const lastValue = useRef(value);
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
    lastValue.current = value;
  }, [value]);

  const percent = useMemo(() => {
    const v = Number(internal);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(1, v)) * 100;
  }, [internal]);

  const calcValue = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  };

  const handleMouseDown = (e) => {
    const move = (ev) => {
      const v = calcValue(ev.clientX);
      lastValue.current = v;
      setInternal(v);
      onChanging?.(v);
    };

    const up = () => {
      onChange?.(lastValue.current);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    move(e);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const handleTouchStart = (e) => {
    const move = (ev) => {
      const v = calcValue(ev.touches[0].clientX);
      lastValue.current = v;
      setInternal(v);
      onChanging?.(v);
    };

    const end = () => {
      onChange?.(lastValue.current);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };

    move(e);

    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", end);
  };

  return (
    <div style={{ flex: 1, direction: "ltr", margin: "0 16px" }}>
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: "relative",
          height,
          borderRadius: height,
          background: "#3a3a45",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${percent}%`,
            background: "#7B61FF",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${percent}%`,
            transform: "translate(-50%, -50%)",
            width: 10,
            height: 10,
            borderRadius: 5,
            background: "#111c33",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
