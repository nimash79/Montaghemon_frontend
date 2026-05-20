import { Link, useParams } from "react-router";
import CustomInput from "../../components/shared/CustomInput";
import CustomDropdown from "../../components/shared/CustomDropdown";
import { useEffect, useState } from "react";
import CustomCheckbox from "../../components/shared/CustomCheckbox";
import CustomButton from "../../components/shared/CustomButton";
import { getSingers } from "../../api/singers";
import { getCategories } from "../../api/categories";
import axios from "axios";
import CustomDropdownMultiple from "../../components/shared/CustomDropdownMultiple";
import { getTrack } from "../../api/tracks";
import LoadingModal from "../../components/modals/LoadingModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const EditTrackPage = () => {
  const [loadingModal, setLoadingModal] = useState(false);
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

  const { id } = useParams();

  useEffect(() => {
    (async () => {
      let res = await getCategories({});
      if (res.data.ok) {
        setAllCategories(
          res.data.categories.map((c) => ({ value: c._id, text: c.name })),
        );
      }

      res = await getSingers();
      if (res.data.ok) {
        setAllSingers(
          res.data.singers.map((s) => ({ value: s._id, text: s.name })),
        );
      }
      res = await getTrack(id);
      if (res.data.ok) {
        setName(res.data.track.name);
        setHls(res.data.track.hlsRel.split("/")[2]);

        setCategories(
          res.data.track.categories.map((c) => ({
            value: c._id,
            text: c.name,
          })),
        );
        setSingers(
          res.data.track.singers.map((s) => ({ value: s._id, text: s.name })),
        );
        setDurationMs(res.data.track.durationMs);
        setMtimeMs(res.data.track.mtimeMs);
        setSize(res.data.track.size);
        setDisabled(res.data.track.disabled);
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

      formData.append("id", id);
      categories.forEach((c) => {
        formData.append("categories[]", c.value);
      });
      formData.append("name", name);
      formData.append("hls", hls);
      singers.forEach((s) => {
        formData.append("singers[]", s.value);
      });

      formData.append("durationMs", durationMs);
      formData.append("mtimeMs", mtimeMs);
      formData.append("size", size);
      formData.append("disabled", disabled);
      formData.append("thumbnail", thumbnail);

      const res = await axios.post(`${API_URL}/tracks/edit`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer YA_HOSSEIN_ABA_ABDELLAH",
        },
      });

      if (res.data.ok) {
        setMessage("نماهنگ با موفقیت ویرایش شد ✅");
      } else {
        setMessage(res.data.error || "خطا در ویرایش نماهنگ");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMessage(err.response?.data?.error || "خطای سرور در ارسال درخواست");
    } finally {
      setLoading(false);
    }
  };

  if (loadingModal) return <LoadingModal isOpen={loadingModal} />;

  return (
    <div className="form-page">
      <div className="form-title">ویرایش نماهنگ</div>

      <CustomInput
        placeholder="نام نماهنگ"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <CustomInput
        placeholder="نام hls"
        value={hls}
        onChange={(e) => setHls(e.target.value)}
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
        onChange={(e) => setDurationMs(e.target.value)}
        placeholder="durationMs"
      />

      <CustomInput
        type="number"
        value={mtimeMs}
        onChange={(e) => setMtimeMs(e.target.value)}
        placeholder="mtimeMs"
      />

      <CustomInput
        type="number"
        value={size}
        onChange={(e) => setSize(e.target.value)}
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
        <CustomCheckbox
          checked={disabled}
          onChange={() => setDisabled((d) => !d)}
        />
      </div>

      <CustomButton
        text={loading ? "در حال ارسال..." : "ثبت"}
        onClick={submit}
        disabled={loading}
      />

      {message && (
        <p
          style={{
            marginTop: "12px",
            color: message.includes("✅") ? "green" : "red",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default EditTrackPage;
