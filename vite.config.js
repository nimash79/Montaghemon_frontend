import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "MONTAGHEMON",
        short_name: "MONTAGHEMON",
        start_url: "/",
        display: "standalone",
        background_color: "#0F172A",
        theme_color: "#0F172A",
        icons: [],
      },
    }),
  ],
});
