import i18n from "i18next";
import { initReactI18next } from "react-i18next";
// import en from "./en";
// import fa from "./fa";

// const resources = {
//   en,
//   fa,
// };

i18n
  .use(initReactI18next)
  .init({
    // resources,
    lng: "fa",
    supportedLngs: ["fa", "en"],
    load: "languageOnly",
    detection: {
      order: ["navigator", "htmlTag", "querystring", "path", "subdomain"],
      caches: [], // <-- disables localStorage & cookie caching
    },
  });

export default i18n;
