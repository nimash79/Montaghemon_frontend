import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../shared/CustomButton";
import CustomTextArea from "../shared/CustomTextArea";
import TrashIcon from "./../icons/TrashIcon";

const MessageModal = ({
  isOpen,
  setMessageModal,
  roomMessage,
  roomLink,
  onSubmit,
}) => {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    setMessage(roomMessage);
    setLink(roomLink);
  }, [roomMessage, roomLink])
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
            <div style={{ display: "flex", marginBottom: 8, position: "relative", alignItems: "center" }}>
              <CustomTextArea
                value={message}
                placeholder={"اطلاعیه خود را بنویسید ..."}
                style={{flex: 1}}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ff3b3b",
                  marginInlineStart: 8,
                  borderRadius: 8,
                  paddingRight: 4,
                  paddingLeft: 4,
                  position: "absolute",
                  left: 8,
                  top: 4,
                  height: 30,
                  cursor: "pointer",
                }}
                onClick={() => setMessage("")}
              >
                <TrashIcon />
              </div>
            </div>
            <div style={{ display: "flex", marginBottom: 8, position: "relative" }}>
              <CustomInput
                placeholder={"لینک را وارد کنید ..."}
                value={link}
                containerStyle={{ flex: 1 }}
                onChange={(e) => setLink(e.target.value)}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ff3b3b",
                  borderRadius: 8,
                  paddingRight: 4,
                  paddingLeft: 4,
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: 8,
                  cursor: "pointer",
                }}
                onClick={() => setLink("")}
              >
                <TrashIcon />
              </div>
            </div>

            <CustomButton
              text={"ارسال"}
              style={{ marginBottom: 32 }}
              onClick={() => onSubmit(message, link)}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MessageModal;
