export class ClockSync {
    constructor(ws) {
      this.ws = ws;
      this.offsetMs = 0; // server ~= client + offset
      this.samples = [];
    }
  
    nowServerMs() {
      return Date.now() + this.offsetMs;
    }
  
    start(intervalMs = 1000) {
      this.t = setInterval(() => this.ping(), intervalMs);
      this.ping();
    }
  
    stop() {
      clearInterval(this.t);
    }
  
    ping() {
      if (!this.ws || this.ws.readyState !== 1) return;
      this.ws.send(JSON.stringify({ type: "time_ping", clientSendMs: Date.now() }));
    }
  
    onPong(msg) {
      const t0 = msg.clientSendMs;
      const t3 = Date.now();
      const rtt = t3 - t0;
  
      const serverMid = (msg.serverRecvMs + msg.serverSendMs) / 2;
      const clientMid = (t0 + t3) / 2;
      const offset = serverMid - clientMid;
  
      this.samples.push({ offset, rtt });
      if (this.samples.length > 30) this.samples.shift();
  
      const best = [...this.samples].sort((a, b) => a.rtt - b.rtt).slice(0, 7);
      this.offsetMs = best.reduce((s, x) => s + x.offset, 0) / best.length;
    }
  }