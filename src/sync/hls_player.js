import Hls from "hls.js";
import { PLAY_STATUS } from "./../lib/constants";
import { rerr, rlog } from "../lib/remoteLogger";

const DEBUG = true;
function log(...args) {
  if (DEBUG) rlog(args);
}
function warn(...args) {
  if (DEBUG) rlog(args)
}
function err(...args) {
  if (DEBUG) rerr(args);
}

export class SyncHlsPlayer {
  constructor({ clock }) {
    this.clock = clock;
    this.audio = null;
    this.hls = null;
    this.schedule = [];
    this.playStatus = PLAY_STATUS.NORMAL;
    this.thumbnail = "";
    this.playedByUser = false;
    this.forced = null;
    this.forceLoad = false;

    // Hybrid thresholds
    this.SOFT_MS = 100;
    this.HARD_MS = 300;
    this.RELOAD_MS = 1500;

    this.COOLDOWN_MS = 2000;
    this.lastResyncAt = 0;

    this.lastUrl = null;
  }

  setPlayedByUser(playedByUser) {
    this.playedByUser = playedByUser;
  }

  setForced(forced) {
    this.forced = forced;
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

    const a = this.audio;

    // برای اینکه چندبار attach دوباره باعث چند لاگ نشود:
    if (a.__debugBound) return;
    a.__debugBound = true;

    const events = [
      "loadstart",
      "loadedmetadata",
      "loadeddata",
      "canplay",
      "canplaythrough",
      "play",
      "playing",
      "pause",
      "waiting",
      "stalled",
      "seeking",
      "seeked",
      "timeupdate",
      "ended",
      "error",
      "emptied",
      "abort",
    ];

    events.forEach((ev) => {
      a.addEventListener(ev, () => {
        const e = a.error
          ? { code: a.error.code, message: a.error.message }
          : null;
        log(`audio:${ev}`, {
          currentTime: a.currentTime,
          readyState: a.readyState,
          networkState: a.networkState,
          paused: a.paused,
          src: a.currentSrc || a.src,
          error: e,
        });
      });
    });
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
    log("_load called", { url, canNative });
    // if (canNative) {
    //   this.audio.src = url;
    //   return;
    // }


    // Android/others: hls.js
    this._destroyHls();
    this.hls = new Hls({
      lowLatencyMode: false,
      backBufferLength: 30,
      maxBufferLength: 30,
      maxMaxBufferLength: 30,
      liveSyncDurationCount: 6,
      enableWorker: true,
    });
    this.hls.on(Hls.Events.MEDIA_ATTACHED, () => log("hls:MEDIA_ATTACHED"));
    this.hls.on(Hls.Events.MANIFEST_LOADING, (_, data) =>
      log("hls:MANIFEST_LOADING", data.url),
    );
    this.hls.on(Hls.Events.MANIFEST_LOADED, (_, data) =>
      log("hls:MANIFEST_LOADED", { levels: data.levels?.length }),
    );
    this.hls.on(Hls.Events.LEVEL_LOADED, (_, data) =>
      log("hls:LEVEL_LOADED", {
        details: { totalduration: data.details?.totalduration },
      }),
    );

    this.hls.on(Hls.Events.FRAG_LOADING, (_, data) =>
      log("hls:FRAG_LOADING", { sn: data.frag?.sn, url: data.frag?.url }),
    );
    this.hls.on(Hls.Events.FRAG_LOADED, (_, data) =>
      log("hls:FRAG_LOADED", { sn: data.frag?.sn }),
    );
    this.hls.on(Hls.Events.FRAG_BUFFERED, (_, data) =>
      log("hls:FRAG_BUFFERED", { sn: data.frag?.sn }),
    );

    this.hls.on(Hls.Events.ERROR, (_, data) => {
      // data: {type, details, fatal, ...}
      err("hls:ERROR", {
        fatal: data.fatal,
        type: data.type,
        details: data.details,
        response: data.response
          ? {
              code: data.response.code,
              text: data.response.text,
              url: data.response.url,
            }
          : null,
      });

      // این هم خیلی کمک می‌کند بفهمیم سریع disconnect/close یا 404 داریم
      if (data.fatal) {
        err("hls:fatal -> trying recover", data.details);
        try {
          // بسته به نوع خطا:
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            this.hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            this.hls.recoverMediaError();
          } else {
            this._destroyHls();
          }
        } catch (e) {
          err("recover failed", e);
        }
      }
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

    log("start() called", {
      nowServerMs: this.clock.nowServerMs(),
      lastUrl: this.lastUrl,
    });

    try {
      if (this.playedByUser) await this.audio.play();
      log("audio.play() OK");
    } catch (e) {
      err("audio.play() FAILED", e);
    }

    try {
      this.hls?.startLoad?.();
      log("hls.startLoad called");
    } catch (e) {
      err("hls.startLoad failed", e);
    }
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
    // this.audio.pause();
    this.audio.currentTime = Math.max(0, targetSec);
    // this.audio.play().catch(() => {});
    this._resyncMark();
  }

  _reloadAndSeek(url, targetSec) {
    if (!this.audio) return;
    // reload سبک: destroy/attach مجدد (روی بعضی driftهای عجیب بهتر جواب می‌دهد)
    this._load(url);
    this.audio.currentTime = Math.max(0, targetSec);
    if (this.playedByUser) this.audio.play().catch(() => {});
    this._resyncMark();
  }

  async forceSwitchTo({ hlsUrl }) {
    if (!this.audio) return;

    // 1) stop فعلی
    try {
      this.audio.pause();
    } catch {}
    // خیلی مهم: event loop فرصت بده
    await new Promise((r) => setTimeout(r, 0));

    // 2) اگر hls.js دارید کامل نابودش کن
    if (this.hls) {
      try {
        this.hls.destroy();
      } catch {}
      this.hls = null;
    }

    // 3) قطع قطعی منبع قبلی
    this.audio.removeAttribute("src");
    this.audio.load();

    // 4) لود منبع جدید
    this.lastUrl = hlsUrl;
    this._load(hlsUrl);

    // 5) صبر تا متادیتا/مانیفست آماده شود
    await this.waitOnce(this.audio, "loadedmetadata", 3000);

    // 6) حالا seek کن
    this.audio.currentTime = 0;

    // 7) play
    if (this.playedByUser) await this.audio.play().catch(() => {});
  }

  waitOnce(el, event, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        cleanup();
        reject(new Error(`timeout waiting for ${event}`));
      }, timeoutMs);

      function onEv() {
        cleanup();
        resolve();
      }
      function cleanup() {
        clearTimeout(t);
        el.removeEventListener(event, onEv);
      }

      el.addEventListener(event, onEv, { once: true });
    });
  }

  tick() {
    if (!this.audio || !this.schedule.length) return { ok: false };

    const nowS = this.clock.nowServerMs();
    if (this.forced && nowS >= this.forced.atServerMs) {
      const forced = this.forced;

      this.thumbnail = forced.thumbnail;

      if (!this.forceLoad) {
        console.log("FORCE SWITCH:", forced);
        this.forceSwitchTo({
          hlsUrl: forced.hlsUrl,
        }).catch((e) => console.error("forceSwitchTo failed:", e));
        this.forceLoad = true;
      }
      if (nowS >= forced.atServerMs + forced.durationMs) {
        this.forced = null;
        this.forceLoad = false;
      }
      return {
        ok: true,
        trackId: forced.trackId,
        trackName: forced.name,
        driftMs: 0,
        action: "forced",
      };
    }
    const seg = this.findSegment(nowS);
    if (!seg) return { ok: false };
    this.thumbnail = seg.thumbnail;

    if (this.playStatus === PLAY_STATUS.PAUSED)
      return {
        ok: true,
        trackId: seg.trackId,
        trackName: seg.trackName,
        trackSinger: seg.trackSinger,
        driftMs: 0,
        action: "paused",
        quality: "ok",
      };

    const url = seg.hlsUrl;
    const targetSec = (nowS - seg.startMs) / 1000;

    // اگر URL ترک عوض شده => load + seek
    if (this.lastUrl !== url) {
      this.lastUrl = url;
      this.thumbnail = seg.thumbnail;
      this._reloadAndSeek(url, targetSec);
      return {
        ok: true,
        trackId: seg.trackId,
        trackName: seg.trackName,
        trackSinger: seg.trackSinger,
        driftMs: 0,
        action: "load+seek",
      };
    }

    const curSec = this.audio.currentTime || 0;
    const driftMs = (curSec - targetSec) * 1000;
    const abs = Math.abs(driftMs);

    let quality = "good"; // good | ok | bad

    if (abs <= this.SOFT_MS) {
      quality = "good";
    } else if (abs <= this.HARD_MS) {
      quality = "ok";
    } else {
      quality = "bad";
    }

    // Hybrid: اول seek، اگر خیلی بد بود reload
    if (this._cooldownOk()) {
      if (abs > this.RELOAD_MS) {
        this._reloadAndSeek(url, targetSec);
        return {
          ok: true,
          trackId: seg.trackId,
          trackName: seg.trackName,
          trackSinger: seg.trackSinger,
          driftMs,
          action: "reload+seek",
          quality,
        };
      }

      if (abs > this.HARD_MS) {
        this._hardSeek(targetSec);
        return {
          ok: true,
          trackId: seg.trackId,
          trackName: seg.trackName,
          trackSinger: seg.trackSinger,
          driftMs,
          quality,
          action: "hard_seek",
        };
      }
    }

    return {
      ok: true,
      trackId: seg.trackId,
      trackName: seg.trackName,
      trackSinger: seg.trackSinger,
      driftMs,
      action: Math.abs(driftMs) > this.SOFT_MS ? "drift" : "ok",
      quality,
    };
  }
}
