import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import { installRemoteLogger } from "./lib/remoteLogger";
import { WsProvider } from "./ws/WsProvider";
import PlayerPage from "./pages/PlayerPage";
import OfflinePage from "./pages/OfflinePage";
import RoomsPage from "./pages/RoomsPage";
import RoomPage from "./pages/RoomPage";
import { ToastContainer } from "react-toastify";
import AddTrackPage from "./pages/admin/AddTrackPage";
import AddSingerPage from "./pages/admin/AddSingerPage";
import AddRoomPage from "./pages/admin/AddRoomPage";
import TracksPage from "./pages/admin/TracksPage";
import EditTrackPage from "./pages/admin/EditTrackPage";
import AdminLayout from "./layouts/AdminLayout";

// installRemoteLogger({ endpoint: "https://montaghemon.site/api/client-log" });

export default function App() {
  return (
    <BrowserRouter>
      <WsProvider>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Main Pages */}
            <Route path="/" Component={HomePage} />
            <Route path="/offline" Component={OfflinePage} />
            <Route path="/player/:roomId" Component={PlayerPage} />
            <Route path="/room/:roomId" Component={RoomPage} />
            <Route path="/rooms" Component={RoomsPage} />
            {/* End Main Pages */}
            {/* Admin Pages */}
            <Route element={<AdminLayout />}>
              <Route path="/add-track" Component={AddTrackPage} />
              <Route path="/add-singer" Component={AddSingerPage} />
              <Route path="/add-room" Component={AddRoomPage} />
              <Route path="/tracks" Component={TracksPage} />
              <Route path="/edit-track/:id" Component={EditTrackPage} />
            </Route>
            {/* End Admin Pages */}
          </Route>
        </Routes>
      </WsProvider>
      <ToastContainer />
    </BrowserRouter>
  );
}
