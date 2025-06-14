import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const QuestionnairePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    education: "",
    ad8: Array(8).fill(""),
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAd8Change = (index, value) => {
    const newAd8 = [...formData.ad8];
    newAd8[index] = value;
    setFormData({ ...formData, ad8: newAd8 });
  };

  const handleSubmit = async () => {
    const { gender, age, education, ad8 } = formData;
  
    console.log("🧪 提交資料", formData); // ← 看是否正確更新
  
    // ✅ 基本欄位檢查
    if (!gender || !age || !education) {
      alert("⚠️ 請填寫性別、年齡與教育程度");
      return;
    }
  
    // ✅ AD8 問卷完整性檢查
    if (ad8.some(ans => ans !== "是" && ans !== "否")) {
      alert("⚠️ 請完整填寫 AD8 問卷（每題皆需作答）");
      return;
    }
  
    try {
      const response = await axios.post("http://163.15.172.187:8000/save-form", formData);
      if (response.data?.message === "儲存成功") {
        navigate("/drawing", { state: { formData } });
      } else {
        alert("❌ 儲存失敗，請稍後再試");
      }
    } catch (error) {
      alert("❌ 表單送出失敗，請確認後端是否已啟動");
      console.error(error);
    }
  };
  

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px", fontFamily: "Arial" }}>
      <h2>📝 請填寫問卷</h2>

      <label>1. 生理性別：</label><br />
      <label>
        <input
          type="radio"
          name="gender"
          value="男"
          checked={formData.gender === "男"}
          onChange={() => handleChange("gender", "男")}
        /> 男
      </label>
      <label>
        <input
          type="radio"
          name="gender"
          value="女"
          checked={formData.gender === "女"}
          onChange={() => handleChange("gender", "女")}
        /> 女
      </label><br /><br />

      <label>2. 年齡區間：</label><br />
      <label>
        <input
          type="radio"
          name="age"
          value="50-60"
          checked={formData.age === "50-60"}
          onChange={() => handleChange("age", "50-60")}
        /> 50-60
      </label>
      <label>
        <input
          type="radio"
          name="age"
          value="61-70"
          checked={formData.age === "61-70"}
          onChange={() => handleChange("age", "61-70")}
        /> 61-70
      </label><br /><br />

      <label>3. 教育程度：</label><br />
      {["國小", "國中", "高中", "大學"].map((edu) => (
        <label key={edu}>
          <input
            type="radio"
            name="education"
            value={edu}
            checked={formData.education === edu}
            onChange={() => handleChange("education", edu)}
          /> {edu}
        </label>
      ))}
      <br /><br />

      <h3>📋 AD8 問卷：</h3>
      {[
        "判斷力變差了嗎？",
        "對活動或興趣的興趣減少？",
        "重複問樣的問題？",
        "對日期、時間搞不清楚？",
        "學習新資訊困難？",
        "忘記告知他人重要的事？",
        "搞不清楚事情發生的順序？",
        "處理財務或收支困難？",
      ].map((question, idx) => (
        <div key={idx}>
          <label>{idx + 1}. {question}</label><br />
          <label>
            <input
              type="radio"
              name={`ad8-${idx}`}
              value="是"
              checked={formData.ad8[idx] === "是"}
              onChange={() => handleAd8Change(idx, "是")}
            /> 是
          </label>
          <label>
            <input
              type="radio"
              name={`ad8-${idx}`}
              value="否"
              checked={formData.ad8[idx] === "否"}
              onChange={() => handleAd8Change(idx, "否")}
            /> 否
          </label>
        </div>
      ))}

      <br />
      <button onClick={handleSubmit} style={{ padding: "10px 20px" }}>下一步 ➡️</button>
    </div>
  );
};

export default QuestionnairePage;