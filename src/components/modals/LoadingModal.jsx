import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";

const LoadingModal = ({ isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="loading-container">
            <ClipLoader color="#6171c8" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingModal;