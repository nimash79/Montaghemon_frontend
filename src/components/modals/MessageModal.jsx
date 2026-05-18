import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../shared/CustomButton";
import CustomTextArea from "../shared/CustomTextArea";

const MessageModal = ({ isOpen, setMessageModal, roomMessage, roomLink, onSubmit }) => {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
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
            <p className="title">اطلاعیه</p>
            <CustomTextArea
              defaultValue={roomMessage}
              placeholder={"اطلاعیه خود را بنویسید ..."}
              onChange={(e) => setMessage(e.target.value)}
            />
            <CustomInput
              placeholder={"لینک را وارد کنید ..."}
              defaultValue={roomLink}
              containerStyle={{ marginBottom: 8 }}
              onChange={(e) => setLink(e.target.value)}
            />
            <div style={{display: "flex", justifyContent: "space-between"}}>
              <CustomButton
              text={"پاک کردن"}
              style={{ marginBottom: 32, width: "45%", backgroundColor: "#ff3b3b" }}
              onClick={() => onSubmit("", link)}
            />
            <CustomButton
              text={"ارسال"}
              style={{ marginBottom: 32, width: "45%" }}
              onClick={() => onSubmit(message, link || roomLink)}
            />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MessageModal;
