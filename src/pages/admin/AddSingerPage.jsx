import { useEffect, useState } from "react";
import { Link } from "react-router";
import CustomInput from "../../components/shared/CustomInput";
import CustomButton from "../../components/shared/CustomButton";
import axios from "axios";
import AdminModal from "../../components/modals/AdminModal";
import CustomTextArea from "../../components/shared/CustomTextArea";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const AddSingerPage = () => {
  const [adminModal, setAdminModal] = useState(true);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      if (!name) {
        return setMessage("تمام فیلدهای ضروری را پر کنید.");
      }

      setLoading(true);
      setMessage("");

      const formData = new FormData();

      formData.append("description", description);
      formData.append("name", name);
      formData.append("image", image);


      const res = await axios.post(`${API_URL}/singers/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": "Bearer YA_HOSSEIN_ABA_ABDELLAH",
        },
      });


      if (res.data.ok) {
        setMessage("خواننده با موفقیت اضافه شد ✅");
        // ریست فرم
        setName("");
        setDescription("");
        setImage(null);
      } else {
        setMessage(res.data.error || "خطا در ایجاد خواننده");
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
          <div className="form-title">اضافه کردن خواننده</div>

          <CustomInput
            placeholder="نام خواننده"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <CustomTextArea placeholder="توضیحات" value={description} onChange={e => setDescription(e.target.value)} />

          <div style={{ margin: "10px 0" }}>
            <label>عکس خواننده: </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
            />
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

export default AddSingerPage;