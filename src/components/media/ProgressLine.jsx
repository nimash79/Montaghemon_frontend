import { useMemo } from "react";

/**
 * props:
 *  - playedSec: number  (زمان پخش‌شده)
 *  - durationSec: number (کل مدت)
 *  - height?: number
 */
export default function ProgressLine({ playedSec, durationSec, height = 8 }) {
  const ratio = useMemo(() => {
    const d = Number(durationSec);
    const p = Number(playedSec);
    if (!Number.isFinite(d) || d <= 0) return 0;
    if (!Number.isFinite(p) || p < 0) return 0;
    return Math.max(0, Math.min(1, p / d));
  }, [playedSec, durationSec]);

  const percent = ratio * 100;

  return (
    <div style={{ flex: 1, direction: "ltr", margin: "0 16px" }}>
      <div
        style={{
          position: "relative",
          height,
          borderRadius: height,
          background: "#3a3a45",
          overflow: "hidden",
        }}
      >
        {/* بخش پرشده */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${percent}%`,
            background: "#7B61FF",
          }}
        />

        {/* دایره متحرک */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${percent}%`,
            transform: "translate(-50%, -50%)",
            width: 8,
            height: 8,
            borderRadius: 4,
            background: "#111c33",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
