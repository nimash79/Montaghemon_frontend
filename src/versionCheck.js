export function startVersionCheck() {
  setInterval(async () => {
    try {
      const res = await fetch("/version.json", {
        cache: "no-store"
      });

      const data = await res.json();

      if (data.version !== window.APP_VERSION) {
        window.location.reload();
      }
    } catch (e) {
      console.error("version check failed", e);
    }
  }, 60000);
}