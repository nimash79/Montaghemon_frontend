import { Link } from "react-router";
import CustomInput from "../../components/shared/CustomInput";
import CustomDropdown from "../../components/shared/CustomDropdown";
import { useEffect, useState } from "react";
import CustomCheckbox from "../../components/shared/CustomCheckbox";
import CustomButton from "../../components/shared/CustomButton";
import { getSingers } from "../../api/singers";
import { getCategories } from "../../api/categories";
import axios from "axios";
import CustomDropdownMultiple from "../../components/shared/CustomDropdownMultiple";
import AdminModal from "../../components/modals/AdminModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const AddTrackPage = () => {
  const [adminModal, setAdminModal] = useState(true);
  const [name, setName] = useState("");
  const [hls, setHls] = useState("");
  const [allSingers, setAllSingers] = useState([]);
  const [singers, setSingers] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [durationMs, setDurationMs] = useState("");
  const [mtimeMs, setMtimeMs] = useState("");
  const [size, setSize] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      let res = await getCategories();
      if (res.data.ok) {
        setAllCategories(res.data.categories.map((s) => ({ value: s._id, text: s.name })));
      }

      res = await getSingers();
      if (res.data.ok) {
        setAllSingers(res.data.singers.map((s) => ({ value: s._id, text: s.name })));
      }
    })();
  }, []);

  const submit = async () => {
    try {
      if (!name || !singers) {
        return setMessage("تمام فیلدهای ضروری را پر کنید.");
      }

      setLoading(true);
      setMessage("");

      const formData = new FormData();

      categories.forEach(c => {
        formData.append("categories[]", c.value);
      });
      formData.append("name", name);
      formData.append("hls", hls);
      singers.forEach(s => {
        formData.append("singers[]", s.value);
      });

      formData.append("durationMs", durationMs);
      formData.append("mtimeMs", mtimeMs);
      formData.append("size", size);
      formData.append("disabled", disabled);
      formData.append("thumbnail", thumbnail);


      const res = await axios.post(`${API_URL}/tracks/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": "Bearer YA_HOSSEIN_ABA_ABDELLAH",
        },
      });


      if (res.data.ok) {
        setMessage("نماهنگ با موفقیت اضافه شد ✅");
        // ریست فرم
        setName("");
        setHls("");
        setSingers([]);
        setDurationMs("");
        setMtimeMs("");
        setSize("");
        setThumbnail(null);
        setDisabled(false);
      } else {
        setMessage(res.data.error || "خطا در ایجاد نماهنگ");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMessage(err.response?.data?.error || "خطای سرور در ارسال درخواست");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <AdminModal isOpen={adminModal} setIsOpen={setAdminModal} />
      {!adminModal && (
        <>
          <div className="form-title">اضافه کردن نماهنگ</div>

          <CustomInput
            placeholder="نام نماهنگ"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <CustomInput
            placeholder="نام hls"
            value={hls}
            onChange={e => setHls(e.target.value)}
          />

          <CustomDropdownMultiple
            values={categories}
            setValues={setCategories}
            placeholder="دسته بندی"
            options={allCategories}
          />

          <CustomDropdownMultiple
            values={singers}
            setValues={setSingers}
            placeholder="مداح یا خواننده"
            options={allSingers}
          />

          <CustomInput
            type="number"
            value={durationMs}
            onChange={e => setDurationMs(e.target.value)}
            placeholder="durationMs"
          />

          <CustomInput
            type="number"
            value={mtimeMs}
            onChange={e => setMtimeMs(e.target.value)}
            placeholder="mtimeMs"
          />

          <CustomInput
            type="number"
            value={size}
            onChange={e => setSize(e.target.value)}
            placeholder="size"
          />

          <div style={{ margin: "10px 0" }}>
            <label>کاور (thumbnail): </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span>غیرفعال؟</span>
            <CustomCheckbox checked={disabled} onChange={() => setDisabled((d) => !d)} />
          </div>

          <CustomButton text={loading ? "در حال ارسال..." : "ثبت"} onClick={submit} disabled={loading} />

          {message && (
            <p style={{ marginTop: "12px", color: message.includes("✅") ? "green" : "red" }}>
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AddTrackPage;