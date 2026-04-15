import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { useTranslation } from "react-i18next";

import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import { installRemoteLogger } from "./lib/remoteLogger";
import { WsProvider } from "./ws/WsProvider";
import LivePage from "./pages/LivePage";
import PlayerPage from "./pages/PlayerPage";
import OfflinePage from "./pages/OfflinePage";

// installRemoteLogger({ endpoint: "https://montaghemon.site/api/client-log" });

export default function App() {
  const RTL_LANGS = new Set(["ar", "fa", "he", "ur"]);
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.resolvedLanguage || i18n.language;
    const base = lang.split("-")[0];

    document.documentElement.lang = lang;

    const isRtl = RTL_LANGS.has(base);
    document.documentElement.dir = isRtl ? "rtl" : "ltr";

    document.documentElement.classList.remove("lang-en", "lang-fa");
    document.documentElement.classList.add(`lang-${base}`);
  }, [i18n.resolvedLanguage, i18n.language]);

  return (
    <BrowserRouter>
      <WsProvider>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Main Pages */}
            <Route path="/" Component={HomePage} />
            <Route path="/player" Component={PlayerPage} />
            <Route path="/live" Component={LivePage} />
            <Route path="/offline" Component={OfflinePage} />
            {/* End Main Pages */}
          </Route>
        </Routes>
      </WsProvider>
    </BrowserRouter>
  );
}
