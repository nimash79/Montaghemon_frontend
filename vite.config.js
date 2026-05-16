import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: "stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   manifest: {
    //     name: "MONTAGHEMON",
    //     short_name: "MONTAGHEMON",
    //     start_url: "/",
    //     display: "standalone",
    //     background_color: "#0F172A",
    //     theme_color: "#0F172A",
    //     icons: [],
    //   },
    // }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(Date.now()),
  },
});
