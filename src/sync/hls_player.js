import Hls from "hls.js";
import { PLAY_STATUS } from './../lib/constants';

export class SyncHlsPlayer {
  constructor({ clock }) {
    this.clock = clock;
    this.audio = null;
    this.hls = null;
    this.schedule = [];
    this.playStatus = PLAY_STATUS.NORMAL;
    this.thumbnail = "";

    // Hybrid thresholds
    this.SOFT_MS = 70;
    this.HARD_MS = 120;
    this.RELOAD_MS = 250;

    this.COOLDOWN_MS = 2000;
    this.lastResyncAt = 0;

    this.lastUrl = null;
  }

  setSchedule(schedule) {
    this.schedule = schedule || [];
  }

  findSegment(nowServerMs) {
    return this.schedule.find(
      (s) => nowServerMs >= s.startMs && nowServerMs < s.endMs,
    );
  }

  attach(audioEl) {
    this.audio = audioEl;
  }

  detach() {
    this._destroyHls();
    this.audio = null;
  }

  _destroyHls() {
    if (this.hls) {
      try {
        this.hls.destroy();
      } catch {}
      this.hls = null;
    }
  }

  _load(url) {
    if (!this.audio) throw new Error("audio not attached");

    // iOS native HLS
    const canNative = this.audio.canPlayType("application/vnd.apple.mpegurl");
    if (canNative) {
      this.audio.src = url;
      return;
    }

    // Android/others: hls.js
    this._destroyHls();
    this.hls = new Hls({
      lowLatencyMode: false,
      backBufferLength: 30,

      // کمک به پایداری روی موبایل
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      liveSyncDurationCount: 6,
      enableWorker: true,
    });

    this.hls.loadSource(url);
    this.hls.attachMedia(this.audio);
  }

  // async start() {
  //   if (!this.audio) return;
  //   await this.audio.play();
  // }

  async start() {
    if (!this.audio) return;

    this.playStatus = PLAY_STATUS.PLAYING;

    // بهتر: قبل از play یک بار با timeline هم‌تراز شو
    const nowS = this.clock.nowServerMs();
    const seg = this.findSegment(nowS);
    if (seg) {
      const targetSec = (nowS - seg.startMs) / 1000;

      // اگر هنوز چیزی load نشده، load کن
      if (this.lastUrl !== seg.hlsUrl) {
        this.lastUrl = seg.hlsUrl;
        this._load(seg.hlsUrl);
        this.thumbnail = seg.thumbnail;
      }

      // یک seek سبک برای اینکه از جای درست شروع کند
      this.audio.currentTime = Math.max(0, targetSec);
    }

    await this.audio.play();
    this.hls?.startLoad?.();
  }

  stop() {
    if (!this.audio) return;
    this.playStatus = PLAY_STATUS.PAUSED;
    this.audio.pause();
    this.hls?.stopLoad?.();
  }

  _cooldownOk() {
    return Date.now() - this.lastResyncAt >= this.COOLDOWN_MS;
  }

  _resyncMark() {
    this.lastResyncAt = Date.now();
  }

  _hardSeek(targetSec) {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = Math.max(0, targetSec);
    this.audio.play().catch(() => {});
    this._resyncMark();
  }

  _reloadAndSeek(url, targetSec) {
    if (!this.audio) return;
    // reload سبک: destroy/attach مجدد (روی بعضی driftهای عجیب بهتر جواب می‌دهد)
    this._load(url);
    this.audio.currentTime = Math.max(0, targetSec);
    this.audio.play().catch(() => {});
    this._resyncMark();
  }

  tick() {
    if (!this.audio || !this.schedule.length) return { ok: false };

    const nowS = this.clock.nowServerMs();
    const seg = this.findSegment(nowS);
    if (!seg) return { ok: false };

    const url = seg.hlsUrl;
    const targetSec = (nowS - seg.startMs) / 1000;

    if (this.playStatus === PLAY_STATUS.PAUSED)
      return {
        ok: true,
        trackId: seg.trackId,
        trackName: seg.trackName,
        driftMs: 0,
        action: "paused",
        quality: "ok",
        label: "PAUSED",
      };

    // اگر URL ترک عوض شده => load + seek
    if (this.lastUrl !== url) {
      this.lastUrl = url;
      this._load(url);
      this.thumbnail = seg.thumbnail;
      this.audio.currentTime = Math.max(0, targetSec);
      return {
        ok: true,
        trackId: seg.trackId,
        trackName: seg.trackName,
        driftMs: 0,
        action: "load+seek",
      };
    }

    const curSec = this.audio.currentTime || 0;
    const driftMs = (curSec - targetSec) * 1000;

    // Hybrid: اول seek، اگر خیلی بد بود reload
    if (this._cooldownOk()) {
      if (Math.abs(driftMs) > this.RELOAD_MS) {
        this._reloadAndSeek(url, targetSec);
        return {
          ok: true,
          trackId: seg.trackId,
          trackName: seg.trackName,
          driftMs,
          action: "reload+seek",
          play_status: this.playStatus,
        };
      }

      if (Math.abs(driftMs) > this.HARD_MS) {
        this._hardSeek(targetSec);
        return { ok: true, trackId: seg.trackId, trackName: seg.trackName, driftMs, action: "hard_seek" };
      }
    }

    const abs = Math.abs(driftMs);

    let quality = "good"; // good | ok | bad
    let label = "SYNCED"; // SYNCED | STABILIZING | RESYNCING

    if (abs <= this.SOFT_MS) {
      quality = "good";
      label = "SYNCED";
    } else if (abs <= this.HARD_MS) {
      quality = "ok";
      label = "STABILIZING";
    } else {
      quality = "bad";
      label = "RESYNCING";
    }

    return {
      ok: true,
      trackId: seg.trackId,
      trackName: seg.trackName,
      driftMs,
      action: Math.abs(driftMs) > this.SOFT_MS ? "drift" : "ok",
      quality,
      label,
    };
  }
}
