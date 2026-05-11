import React from "react";
import ReactDOM from "react-dom/client";

import "./shared.css";
import "./style.css";
import "./localization/i18n.js";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);