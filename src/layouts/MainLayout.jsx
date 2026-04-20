import { Outlet, useNavigate } from "react-router";
import BackIcon from './../components/icons/BackIcon';

const MainLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <div className="main-layout">
        <div className="header">
          <div className="icon" onClick={() => navigate(-1)}>
            <BackIcon />
          </div>
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
