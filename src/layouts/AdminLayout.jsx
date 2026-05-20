import { Outlet, useNavigate } from "react-router";
import BackIcon from "./../components/icons/BackIcon";
import FaqIcon from "../components/icons/FaqIcon";
import { useState } from "react";
import AdminModal from "../components/modals/AdminModal";

const AdminLayout = () => {
  const [adminModal, setAdminModal] = useState(true);
  if (adminModal)
    return <AdminModal isOpen={adminModal} setIsOpen={setAdminModal} />;
  return (
    <>
      <AdminModal isOpen={adminModal} setIsOpen={setAdminModal} />
      <Outlet />
    </>
  );
};

export default AdminLayout;
