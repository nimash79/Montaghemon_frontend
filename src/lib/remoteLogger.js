const queue = [];

export function rlog(msg, data) {
  queue.push({ t: Date.now(), level: "log", msg, data });
}
export function rerr(msg, data) {
  queue.push({ t: Date.now(), level: "error", msg, data });
}

export function installRemoteLogger({ endpoint }) {
  window.addEventListener("error", (e) => {
    queue.push({ t: Date.now(), level: "error", msg: `window.error: ${e.message}` });
  });
  window.addEventListener("unhandledrejection", (e) => {
    queue.push({ t: Date.now(), level: "error", msg: `unhandled: ${String(e.reason)}` });
  });

  setInterval(async () => {
    if (!queue.length) return;
    const batch = queue.splice(0, 50);
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ts: Date.now(),
          logs: batch
        })
      });
    } catch {
      // اگر اینترنت بد بود، لاگ‌ها دوباره جمع می‌شوند
      queue.unshift(...batch);
    }
  }, 3000);
}