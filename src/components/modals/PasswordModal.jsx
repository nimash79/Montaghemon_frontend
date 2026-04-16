import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../shared/CustomButton";
import { notif_error, notif_success } from "../../lib/toast";
import { passRoom } from "../../api/rooms";

const PasswordModal = ({ isOpen, roomId, setPasswordModal }) => {
  const [password, setPassword] = useState("");
  const submit = async () => {
    try {
      const res = await passRoom({ roomId, password });
      if (res.data.ok) {
        setPasswordModal(false);
        notif_success("خوش آمدید.");
      } else notif_error("رمز عبور صحیح نمی باشد.");
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        console.log(status);

        if (status === 403) {
          notif_error("رمز عبور صحیح نمی باشد.");
        } else if (status === 404) {
          notif_error("اتاق پیدا نشد.");
        } else if (status === 500) {
          notif_error("خطای داخلی سرور.");
        } else {
          notif_error("خطای ناشناخته.");
        }
      } else if (err.request) {
        notif_error("ارتباط با سرور برقرار نشد.");
      } else {
        notif_error("مشکلی رخ داده است.");
      }
    }
  };
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

export default PasswordModal;
