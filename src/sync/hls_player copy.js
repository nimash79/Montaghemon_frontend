import Hls from "hls.js";

export class SyncHlsPlayer {
  constructor({ clock }) {
    this.clock = clock;
    this.audio = null;
    this.hls = null;
    this.schedule = [];

    // سخت‌گیری همگامی:
    this.hardResyncMs = 80;     // اگر drift بیشتر از این شد، seek سخت
    this.softZoneMs = 25;       // برای نمایش/monitor
    this.minBufferToPlaySec = 3;
  }

  setSchedule(schedule) {
    this.schedule = schedule || [];
  }

  findSegment(nowServerMs) {
    return this.schedule.find(s => nowServerMs >= s.startMs && nowServerMs < s.endMs);
  }

  async attach(audioEl) {
    this.audio = audioEl;
  }

  detach() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.audio = null;
  }

  loadHls(url) {
    if (!this.audio) throw new Error("audio not attached");

    // iOS Safari: HLS native (برای اندروید غالباً hls.js)
    const canNative = this.audio.canPlayType("application/vnd.apple.mpegurl");
    if (canNative) {
      this.audio.src = url;
      return;
    }

    if (this.hls) this.hls.destroy();
    this.hls = new Hls({
      lowLatencyMode: false,
      backBufferLength: 30
    });
    this.hls.loadSource(url);
    this.hls.attachMedia(this.audio);
  }

  async start() {
    if (!this.audio) return;
    // autoplay policy: باید با gesture فراخوانی شود
    await this.audio.play();
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
  }

  tick() {
    if (!this.audio || !this.schedule.length) return { ok: false };

    const nowS = this.clock.nowServerMs();
    const seg = this.findSegment(nowS);
    if (!seg) return { ok: false };

    const targetSec = (nowS - seg.startMs) / 1000; // موقعیت صحیح داخل ترک
    const curSec = this.audio.currentTime || 0;
    const driftMs = (curSec - targetSec) * 1000;

    // اگر ترک عوض شده یا src متفاوت است => load
    const desiredSrc = seg.hlsUrl;
    const curSrc = this.audio.currentSrc || this.audio.src || "";
    const needLoad = !curSrc.includes(desiredSrc);

    if (needLoad) {
      this.loadHls(desiredSrc);
      // برای جلوگیری از جهش، seek اولیه
      this.audio.currentTime = Math.max(0, targetSec);
      return { ok: true, driftMs, trackId: seg.trackId, action: "load+seek" };
    }

    // Hard resync
    if (Math.abs(driftMs) > this.hardResyncMs) {
      this.audio.pause();
      this.audio.currentTime = Math.max(0, targetSec);
      // تلاش برای play (ممکن است اگر gesture نباشد fail شود)
      this.audio.play().catch(() => { });
      return { ok: true, driftMs, trackId: seg.trackId, action: "hard_seek" };
    }

    return {
      ok: true,
      driftMs,
      trackId: seg.trackId,
      action: Math.abs(driftMs) > this.softZoneMs ? "drift" : "ok"
    };
  }
}