import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../shared/CustomButton";
import CustomTextArea from "../shared/CustomTextArea";
import { notif_success, notif_error } from "../../lib/toast";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const AdminModal = ({ isOpen, setIsOpen }) => {
  const [password, setPassword] = useState("");

  const submit = () => {
    if (password === ADMIN_PASSWORD)
      setIsOpen(false);
    else
      notif_error("رمز عبور صحیح نمی باشد.");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMessageModal(false)}
          />

          {/* Modal */}
          <motion.div
            className="password-modal"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <p className="title">رمز عبور</p>
            <CustomInput
              placeholder={"رمز عبور را وارد کنید ..."}
              containerStyle={{ marginBottom: 32 }}
              onChange={(e) => setPassword(e.target.value)}
            />
            <CustomButton
              text={"تایید"}
              style={{ marginBottom: 32 }}
              onClick={submit}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdminModal;
