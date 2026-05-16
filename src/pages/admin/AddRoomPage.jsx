import { useEffect, useState } from "react";
import { Link } from "react-router";
import CustomInput from "../../components/shared/CustomInput";
import CustomButton from "../../components/shared/CustomButton";
import axios from "axios";
import AdminModal from "../../components/modals/AdminModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const AddRoomPage = () => {
  const [adminModal, setAdminModal] = useState(true);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [logo, setLogo] = useState();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      if (!name) {
        return setMessage("تمام فیلدهای ضروری را پر کنید.");
      }

      setLoading(true);
      setMessage("");

      const formData = new FormData();

      formData.append("name", name);
      formData.append("city", city);
      formData.append("password", password);
      formData.append("logo", logo);


      const res = await axios.post(`${API_URL}/rooms/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": "Bearer YA_HOSSEIN_ABA_ABDELLAH",
        },
      });


      if (res.data.ok) {
        setMessage("کاروان با موفقیت اضافه شد ✅");
        setResult(`id: ${res.data.roomId}       password: ${password}`)
        // ریست فرم
        setName("");
        setCity("");
        setPassword("");
        setLogo(null);
      } else {
        setMessage(res.data.error || "خطا در ایجاد کاروان");
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
          <div className="form-title">اضافه کردن کاروان</div>

          <CustomInput
            placeholder="نام کاروان"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <CustomInput
            placeholder="استان، شهر"
            value={city}
            onChange={e => setCity(e.target.value)}
          />

          <CustomInput
            placeholder="رمز عبور"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />



          <div style={{ margin: "10px 0" }}>
            <label>عکس کاروان: </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files[0])}
            />
          </div>

          <CustomButton text={loading ? "در حال ارسال..." : "ثبت"} onClick={submit} disabled={loading} />

          {message && (
            <p style={{ marginTop: "12px", color: message.includes("✅") ? "green" : "red" }}>
              {message}
            </p>
          )}
          {result && (
            <p style={{ marginTop: "12px", color: "white" }}>
              {result}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AddRoomPage;