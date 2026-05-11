import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomInput from "../shared/CustomInput";
import CustomButton from "../shared/CustomButton";
import CustomTextArea from "../shared/CustomTextArea";
import BackIcon from "../icons/BackIcon";

const RoomGuideModal = ({ isOpen, setIsOpen }) => {
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
            <p className="title" style={{ borderBottom: "2px solid var(--primary)", paddingBottom: 8 }}>راهنمای پنل ادمین کاروان ⚡️</p>
            <div className="guide-description" style={{ maxHeight: "calc(100vh - (32px + 32px + 41px))", overflow: "auto" }}>
              <p>خوش آمدید 🌱
                <br />
                این پنل برای مدیریت راحت‌تر، سریع‌تر و هماهنگ‌تر کاروان شما طراحی شده تا بتوانید پخش صوت و هماهنگی اعضا را به‌صورت کامل کنترل کنید.</p>
              <div style={{ marginBottom: 24, border: "1px solid var(--neutral_40)" }} />
              <p>
                ✅ کنترل کامل پخش صوت
                شما می‌توانید صوت‌ها را پخش، توقف یا تعویض کنید و تمام اعضای کاروان، همان صوت را به‌صورت همزمان دریافت کنند.
              </p>
              <p>
                ✅ جستجوی سریع صوت‌ها
                از بخش جستجو می‌توانید خیلی سریع مداحی یا صوت مورد نظر خود را پیدا کنید.
                (با جستجوی نام صوت و نام مداح)
              </p>
              <p>
                ✅ پین کردن صوت‌ها
                صوت‌های پرکاربرد و مورد علاقه خود را پین کنید تا همیشه دسترسی سریع‌تری به آن‌ها داشته باشید و عملاً پلی‌لیست مخصوص کاروان خودتان را بسازید.
              </p>
              <p>
                ✅ ارسال اطلاعیه به اعضای کاروان
                می‌توانید اطلاعیه‌های مهم مثل:
                - شروع حرکت
                - توقف مسیر
                - تغییر مسیر
                - محل تجمع
                - پایان مراسم
                و سایر هماهنگی‌ها را برای اعضای کاروان ارسال کنید.

              </p>
              <p>
                ✅ مشاهده تعداد اعضای حاضر در کاروان
                در گوشه پنل، تعداد افرادی که وارد کاروان شما شده‌اند نمایش داده می‌شود تا وضعیت اتصال و حضور اعضا را مشاهده کنید.
              </p>

              <div style={{ marginBottom: 24, border: "1px solid var(--neutral_40)" }} />

              <p>⚠️ نکات مهم</p>
              <p>
                🔸 اگر سایت برای شما یا اعضای کاروان دچار مشکل شد،
                یا قابلیت‌های جدید اعمال نشد، حتماً صفحه را رفرش / آپدیت کنید.
              </p>
              <p>
                🔸 رمز عبور پنل ادمین را در اختیار افراد دیگر قرار ندهید تا از ایجاد مشکل یا تغییرات ناخواسته جلوگیری شود.
              </p>
              <p>
                🔸 از مرورگر کروم استفاده کنید.
              </p>
              <p>
                🔸 اگر صوت جدیدی نیاز داشتید، پیشنهادی برای بهتر شدن سامانه داشتید یا مشکلی مشاهده کردید، به آیدی پشتیبانی پیام بدهید:
                🆔 <a href="https://eitaa.com/montaghemonim" target="_blank">@montaghemonim</a>
              </p>
              <div style={{ marginBottom: 24, border: "1px solid var(--neutral_40)" }} />
              <p>
                📢 نکته خیلی مهم برای هماهنگی بهتر کاروان
              </p>
              <p>
                حتماً هر شب قبل از شروع مراسم یا حرکت، لینک سایت را برای اعضای کاروان ارسال کنید تا همه وارد سایت شوند
              </p>
              <p>
                هرچه افراد بیشتری وارد سامانه شوند:
                - صدا یکدست‌تر می‌شود
                - هماهنگی بهتر انجام می‌شود
                - کاروان منظم‌تر و حرفه‌ای‌تر جلوه می‌کند
              </p>
              <p>
                به مرور، استفاده از سامانه بین اعضای کاروان جا می‌افتد و کل کاروان با یک صدا و یک زمان هماهنگ خواهد شد ✨
              </p>
              <p>
                <a href="https://montaghemon.site" target="_blank">🌐 montaghemon.site</a>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RoomGuideModal;
