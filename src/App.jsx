import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { useTranslation } from 'react-i18next';

import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import { installRemoteLogger } from "./lib/remoteLogger";

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
      <Routes>
        <Route element={<MainLayout />}>
          {/* Main Pages */}
          <Route path="/" Component={HomePage} />
          {/* End Main Pages */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
