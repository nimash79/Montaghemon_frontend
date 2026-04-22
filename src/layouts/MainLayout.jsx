import { Outlet, useNavigate } from "react-router";
import BackIcon from "./../components/icons/BackIcon";

const MainLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <div className="main-layout">
        <div className="header">
          {window.location.pathname === "/" ? (
            <div></div>
          ) : (
            <div className="icon" onClick={() => navigate(-1)}>
              <BackIcon />
            </div>
          )}
          <div className="header-title">منتقمون</div>
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
