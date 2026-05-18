import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../shared/CustomButton";
import CustomTextArea from "../shared/CustomTextArea";
import BackIcon from "../icons/BackIcon";
import { Link } from "react-router";

const MainGuideModal = ({ isOpen, setIsOpen }) => {
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
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            className="password-modal"
            style={{ flex: 1, maxHeight: "100vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <BackIcon onClick={() => setIsOpen(false)} style={{ position: "absolute", top: 32, right: 16, cursor: "pointer" }} />
            <p className="title" style={{ borderBottom: "2px solid var(--primary)", paddingBottom: 8 }}>راهنمای استفاده از منتقمون ⚡️</p>
            <div className="guide-description" style={{ maxHeight: "calc(100vh - (32px + 32px + 41px))", overflow: "auto" }}>
              <p>در راهپیمایی‌های خودرویی معمولاً یک مشکل هست:</p>
              <p>
                صدای ماشین صوت فقط به چند ده متر اول می‌رسد و بقیهٔ مسیر یا چیزی
                نمی‌شنوند، یا هر ماشین صدای جداگانه‌ای پخش می‌کند و هماهنگی کاروان از
                بین می‌رود.
              </p>
              <p>برای حل این مشکل، سامانهٔ منتقمون طراحی شده.</p>
              <p>
                کافی است وارد سایت شوید تا صدا به‌صورت خودکار، همزمان و یک‌دست از
                همهٔ خودروها و باندهای کاروان پخش شود.
              </p>
              <p>یعنی فرقی نمی‌کند اول کاروان باشید یا آخر آن؛</p>
              <p>همه دقیقاً یک صدا و یک زمان را می‌شنوند. ❤️‍🔥</p>
              <p>🔊 چطور استفاده کنیم؟</p>
              <p>1️⃣ گوشی را با AUX یا بلوتوث به سیستم پخش وصل کنید.</p>
              <p>2️⃣ در صفحهٔ اصلی روی «پخش» بزنید.</p>
              <p>از همان لحظه صدا با بقیهٔ کاروان همزمان پخش می‌شود. 💥</p>
              <p>🎧 بخش «ورود به هیئت»</p>
              <p>
                اگر هیئت یا کاروان شما در سامانه ثبت شده باشد، می‌توانید از بخش «ورود
                به هیئت» اسم هیئت خودتان را انتخاب کنید.
              </p>
              <p>در این حالت، مسئول هیئت می‌تواند:</p>
              <p>• مداحی را انتخاب کند</p>
              <p>• صدا را متوقف کند</p>
              <p>• صوت جدید پخش کند</p>
              <p>
                و هر کاری که انجام دهد، همزمان برای همهٔ اعضای هیئت اجرا می‌شود. ⚡
              </p>
              <p>
                ✨ اگر هیئت یا کاروان شما هنوز در سامانه نیست و دوست دارید اکانت مخصوص
                خودتان را داشته باشید تا:
              </p>
              <p>• پخش هماهنگ مخصوص هیئت داشته باشید</p>
              <p>• مداحی‌ها را از راه دور کنترل کنید</p>
              <p>• و همهٔ خودروها با یک کلیک هم‌صدا شوند</p>
              <p>کافی است در پیام‌رسان ایتا پیام بدهید:</p>
              <p style={{ direction: "ltr" }}>
                <Link to={"https://eitaa.com/montaghemonim"} target="_blank">
                  📩 @montaghemonim
                </Link>
              </p>
              <p>
                با افتخار در کنار هیئت شما هستیم و کمک می‌کنیم صدای هیئتتون رساتر،
                هماهنگ‌تر و اثرگذارتر شنیده بشه. ✨🙏
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MainGuideModal;
