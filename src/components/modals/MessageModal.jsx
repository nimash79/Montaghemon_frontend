import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../shared/CustomButton";
import CustomTextArea from "../shared/CustomTextArea";

const MessageModal = ({ isOpen, setMessageModal, roomMessage, onSubmit }) => {
  const [message, setMessage] = useState("");
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
              containerStyle={{ marginBottom: 32 }}
              onChange={(e) => setMessage(e.target.value)}
            />
            <CustomButton
              text={"ارسال"}
              style={{ marginBottom: 32 }}
              onClick={() => onSubmit(message)}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MessageModal;
