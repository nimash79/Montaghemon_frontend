import { Outlet } from "react-router";

const MainLayout = () => {
  return (
    <div className="app-container">
      {/* <img src="/background.jpg" className="background" /> */}
      <div className="main-layout">
        <div className="header">
          <div></div>
          <p className="header-title">منتقمون</p>
          <div></div>
        </div>
        <div className="body">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
