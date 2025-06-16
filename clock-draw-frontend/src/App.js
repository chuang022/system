// --- START OF FILE App.js (HOMEPAGE MODIFIED) ---
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import './App.css'; // 確保引入您的 CSS 檔案

// 匯入您的頁面組件
import MMSEPage from "./pages/MMSEPage";
import DrawingPage from "./pages/DrawingPage_with_advice";
import FeedbackPage from "./pages/FeedbackPage";
import MMSE_ResultsDisplay from './pages/MMSE_ResultsDisplay';

// --- ResultsPage Component (無變動) ---
const ResultsPage = ({ email }) => {
  const [mmseScore, setMmseScore] = useState(undefined);
  const [cdtScore, setCdtScore] = useState(undefined);
  const [cdtResultText, setCdtResultText] = useState(null);
  const [cdtConfidence, setCdtConfidence] = useState(null);
  const [cdtAdvice, setCdtAdvice] = useState(null);
  const [mmseDate, setMmseDate] = useState(null);
  const [cdtDate, setCdtDate] = useState(null);
  const [mmseDetails, setMmseDetails] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = () => {
      const userEmailKeyPart = email || 'guest';
      const storedMmseResult = localStorage.getItem(`mmse_result_${userEmailKeyPart}`);
      if (storedMmseResult) {
        try {
          const mmseData = JSON.parse(storedMmseResult);
          setMmseScore(mmseData.score ?? null); setMmseDate(mmseData.date); setMmseDetails(mmseData.details || []); 
        } catch (e) { console.error("解析MMSE結果時出錯:", e); setMmseScore(null); setMmseDetails([]); }
      } else { setMmseScore(null); setMmseDetails([]); }
      const storedCdtResult = localStorage.getItem(`cdt_result_${userEmailKeyPart}`);
      if (storedCdtResult) {
        try {
          const cdtData = JSON.parse(storedCdtResult);
          setCdtScore(cdtData.score ?? null); setCdtDate(cdtData.date);
          setCdtResultText(cdtData.resultText); setCdtConfidence(cdtData.confidence); setCdtAdvice(cdtData.advice);
        } catch (e) { console.error("解析CDT結果時出錯:", e); setCdtScore(null); }
      } else { setCdtScore(null); }
    };
    fetchResults();
  }, [email]);

  useEffect(() => {
    if (mmseScore === undefined || cdtScore === undefined) return;
    const userEmailKeyPart = email || 'guest';
    const mmseDataExists = localStorage.getItem(`mmse_result_${userEmailKeyPart}`) !== null;
    const cdtDataExists = localStorage.getItem(`cdt_result_${userEmailKeyPart}`) !== null;
    if (!mmseDataExists) { navigate("/mmse", { replace: true }); return; }
    if (mmseDataExists && !cdtDataExists) { navigate("/drawing", { replace: true }); return; }
  }, [mmseScore, cdtScore, email, navigate]);

  const formatDate = (dateString) => { if (!dateString) return "未知日期"; try { const date = new Date(dateString); if (isNaN(date.getTime())) return "日期格式無效"; return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`; } catch (e) { return "日期格式錯誤"; } };
  const getMmseInterpretation = (score) => {
    if (score === null || score === undefined) return "（結果載入中或尚未完成）";
    if (score >= 25) return "目前的認知表現良好，建議保持健康生活習慣。";
    if (score >= 21 && score <= 24) return "目前的認知表現可能存在一些小挑戰，建議多加留意並考慮諮詢專業人士的意見。";
    if (score >= 10 && score <= 20) return "目前的認知表現顯示可能需要進一步的關注，強烈建議尋求專業人士的評估與協助。";
    if (score <= 9) return "目前的認知表現顯示需要立即的專業評估與支持，請盡快聯繫醫療專業人士。";
    return "評估分數無法識別"; 
  };
  const getCdtInterpretation = (score) => { if (score === null || score === undefined) return "（結果載入中或尚未完成）"; if (score === 5) return "時鐘繪製能力表現正常。"; else return "時鐘繪製能力可能需要留意，建議諮詢專業意見。"; };
  const generateOverallAssessment = () => {
    const mmseDone = mmseScore !== null && mmseScore !== undefined; const cdtDone = cdtScore !== null && cdtScore !== undefined;
    if (!mmseDone || !cdtDone) return "請完成 MMSE 及 CDT 測驗以獲取綜合評估。";
    const mmseStatus = getMmseInterpretation(mmseScore); const cdtStatus = getCdtInterpretation(cdtScore);
    if (mmseScore >= 25 && cdtScore === 5) return `綜合評估：MMSE 和 CDT 測驗結果均顯示目前的認知表現良好。建議您繼續保持健康的生活方式，並定期關注自己的身心狀態。`;
    else if (mmseScore <= 20 || cdtScore !== 5) return `綜合評估：根據測驗結果，MMSE 提示「${mmseStatus.split('，')[0]}」，CDT 提示「${cdtStatus.split('。')[0]}」。我們強烈建議您尋求專業醫師或相關醫療人員的進一步評估與諮詢，以便獲得更全面的了解與適當的建議。`;
    else return `綜合評估：根據測驗結果，MMSE 提示「${mmseStatus.split('，')[0]}」，而 CDT 測驗表現正常。建議您多加留意日常的認知狀況，並可考慮與專業人士討論這些結果，以獲取個人化的建議。`;
  };

  if (mmseScore === undefined || cdtScore === undefined) return <div style={{ padding: 40, textAlign: "center" }}>正在加載測驗結果...</div>;

  return (
    <div style={{ padding: "20px 40px", maxWidth: "800px", margin: "auto", fontFamily: "'Noto Sans TC', Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#2c3e50" }}>測驗結果報告</h1>
      <div style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "8px", padding: "20px", marginBottom: "30px" }}>
        <h2 style={{ borderBottom: "1px solid #dee2e6", paddingBottom: "10px", marginBottom: "20px", color: "#343a40" }}> MMSE 測驗結果 </h2>
        {mmseScore !== null ? ( <> <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", flexWrap: "wrap" }}> <span style={{ fontWeight: "bold", marginRight: "10px" }}>測驗日期：</span> <span>{formatDate(mmseDate)}</span> </div> <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}> <span style={{ fontWeight: "bold" }}>得分：</span> <span>{mmseScore} / 30</span> </div> <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", flexDirection: "column" }}> <span style={{ fontWeight: "bold", marginBottom: "5px" }}>初步評估：</span> <span style={{ lineHeight: "1.5" }}>{getMmseInterpretation(mmseScore)}</span> </div> {Array.isArray(mmseDetails) && mmseDetails.length > 0 && ( <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", borderLeft: "5px solid #ffeeba", borderRadius: "4px" }}> <h4 style={{ marginTop: 0, marginBottom: "10px", color: "#856404" }}>MMSE 錯誤項目提醒：</h4> <ul style={{ paddingLeft: "20px", margin: 0, listStyleType: '"⚠️ " ' }}>{mmseDetails.map((detail, index) => ( <li key={index} style={{ marginBottom: "8px", color: "#856404", lineHeight: "1.5" }}>{detail}</li> ))}</ul> <p style={{fontSize: "12px", color: "#856404", marginTop: "10px", fontStyle: "italic"}}>以上列出您在本次MMSE測驗中回答與標準答案不符的項目，僅供參考。</p> </div> )} </> ) : ( <p>MMSE 測驗結果尚未產生或載入失敗。</p> )}
      </div>
      <div style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "8px", padding: "20px", marginBottom: "30px" }}>
        <h2 style={{ borderBottom: "1px solid #dee2e6", paddingBottom: "10px", marginBottom: "20px", color: "#343a40" }}> CDT 畫鐘測驗結果 </h2>
        {cdtScore !== null ? ( <> <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", flexWrap: "wrap" }}> <span style={{ fontWeight: "bold", marginRight: "10px" }}>測驗日期：</span> <span>{formatDate(cdtDate)}</span> </div> <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}> <span style={{ fontWeight: "bold" }}>得分：</span> <span>{cdtScore} / 5</span> </div> {cdtResultText && ( <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}> <span style={{ fontWeight: "bold" }}>模型判讀：</span> <span>{cdtResultText}</span> </div> )} {cdtConfidence !== null && ( <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}> <span style={{ fontWeight: "bold" }}>信心指數：</span> <span>{typeof cdtConfidence === 'number' ? cdtConfidence.toFixed(2) : cdtConfidence}%</span> </div> )} <div style={{ display: "flex", justifyContent: "space-between", marginBottom: cdtAdvice ? "15px" : "0", flexDirection: "column" }}> <span style={{ fontWeight: "bold", marginBottom: "5px" }}>初步評估：</span> <span style={{ lineHeight: "1.5" }}>{getCdtInterpretation(cdtScore)}</span> </div> {cdtAdvice && ( <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#e9ecef", borderRadius: "4px", borderLeft: "4px solid #6c757d" }}> <span style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>模型建議：</span> <span style={{ lineHeight: "1.5" }}>{cdtAdvice}</span> </div> )} </> ) : ( <p>CDT 測驗結果尚未產生或分析失敗。</p> )}
      </div>
      <div style={{ backgroundColor: "#e9f7ef", border: "1px solid #c3e6cb", borderRadius: "8px", padding: "20px" }}>
        <h2 style={{ borderBottom: "1px solid #c3e6cb", paddingBottom: "10px", marginBottom: "20px", color: "#155724" }}> 綜合評估 </h2> <p style={{ lineHeight: "1.6" }}>{generateOverallAssessment()}</p> <p style={{ marginTop: "20px", fontSize: "14px", fontStyle: "italic", color: "#6c757d" }}> 註：以上評估僅供參考，不能替代專業醫師的診斷。如有認知功能疑慮，請務必諮詢專業醫療人員。 </p>
      </div>
      <div style={{ textAlign: "center", marginTop: "40px", marginBottom: "20px" }}> <button onClick={() => navigate("/feedback")} style={{ padding: "12px 25px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", fontSize: "16px", cursor: "pointer", transition: "background-color 0.2s ease" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'} > 完成測驗，前往填寫回饋問卷 ➡️ </button> </div>
    </div>
  );
};


// --- START: HomePage Component (已修改) ---
function HomePage({ email, setEmail, setHasStarted }) {
  const [localEmail, setLocalEmail] = useState(email || "");
  const navigate = useNavigate();
  useEffect(() => { setLocalEmail(email || ""); }, [email]);

  const handleStart = () => {
    setEmail(localEmail);
    if (localEmail) localStorage.setItem("userEmail", localEmail);
    else localStorage.removeItem("userEmail");
    const userEmailKeyPart = localEmail || 'guest';
    localStorage.removeItem(`mmse_result_${userEmailKeyPart}`);
    localStorage.removeItem(`cdt_result_${userEmailKeyPart}`);
    localStorage.removeItem('current_session_id');
    if (typeof setHasStarted === 'function') setHasStarted(true);
    navigate("/mmse");
  };

  return (
    <div className="home-container">
      <h1 className="home-title">🧠 自動化認知功能評估系統</h1>
      
      <div className="flow-section">
        <h2 className="flow-title">研究參與流程</h2>
        <p className="home-intro">
          本研究包含三大部分，為確保評估品質，請您依序完成：
        </p>
        <div className="flow-steps">
          <div className="flow-step">1. <strong>MMSE 測驗</strong></div>
          <div className="flow-step-arrow">➡️</div>
          <div className="flow-step">2. <strong>CDT 畫鐘測驗</strong></div>
          <div className="flow-step-arrow">➡️</div>
          <div className="flow-step">3. <strong>使用者回饋問卷</strong></div>
        </div>
        <div className="sound-reminder">
          🔊 <strong>重要提醒：</strong>測驗中包含<strong style={{color: '#c0392b'}}>聲音題</strong>，請務必開啟您裝置的聲音並調整至合適音量。
        </div>
      </div>

      <div className="email-section">
        <label htmlFor="emailInput" className="email-label">
          📩 請留下您的 Email 以便後續寄送研究摘要 <strong>(此為選填)</strong>：
        </label>
        <input
          id="emailInput"
          type="email"
          placeholder="輸入 Email 或留空"
          value={localEmail}
          onChange={(e) => setLocalEmail(e.target.value)}
          className="email-input"
        />
      </div>

      <button onClick={handleStart} className="start-button">
        我已了解流程，開始測驗 ➡️
      </button>
    </div>
  );
}
// --- END: HomePage Component ---


// --- TopNavbar Component (無變動) ---
const TopNavbar = ({ email, setEmail }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = [
    { path: "/", label: "🏠 回首頁" }, 
    { path: "/mmse", label: "📝 MMSE" }, 
    { path: "/drawing", label: "🕒 CDT" }, 
    { path: "/results", label: "📈 總結果" }, 
    { path: "/feedback", label: "🗣️ 填寫問卷" }
  ];
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 950, width: "100%",      
      backgroundColor: "#ffffff", padding: "15px 20px", boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", flexWrap: 'nowrap', gap: '10px',        
      fontFamily: "'Noto Sans TC', Arial, sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>
         <span style={{ fontSize: "26px", marginRight: "10px", lineHeight: 1 }}>🧠</span>
         <h3 style={{ margin: "0", color: "#333", fontSize: "20px", whiteSpace: 'nowrap' }}>認知功能測驗</h3>
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto', flexGrow: 1, minWidth: 0 }}>
        {navItems.map(item => (
          <button 
            key={item.path} onClick={() => navigate(item.path)}
            style={{ 
                padding: "8px 15px", fontSize: "15px", borderRadius: "6px", 
                backgroundColor: location.pathname === item.path ? "#007bff" : "transparent", 
                color: location.pathname === item.path ? "#ffffff" : "#007bff", 
                border: `1px solid #007bff`, cursor: "pointer", transition: "all 0.2s ease",
                whiteSpace: 'nowrap', flexShrink: 0 
            }}
            onMouseOver={(e) => { if (location.pathname !== item.path) { e.currentTarget.style.backgroundColor = '#e9ecef'; e.currentTarget.style.color = '#0056b3';} }}
            onMouseOut={(e) => { if (location.pathname !== item.path) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#007bff';} }}
            >{item.label}</button>
        ))}
      </div>
      <div style={{ width: '220px', flexShrink: 0, pointerEvents: 'none' }}></div>
    </div>
  );
};

// --- ContentWrapper Component (無變動) ---
const ContentWrapper = ({ children }) => {
  const navbarHeight = "75px";
  return (
    <div style={{ 
      paddingTop: navbarHeight, paddingLeft: "20px", paddingRight: "20px", paddingBottom: "20px", 
      minHeight: `calc(100vh - ${navbarHeight})`
    }}>
      {children}
    </div>
  );
};

// --- AppContent Component (無變動) ---
function AppContent() {
  const [email, setEmail] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  useEffect(() => { const savedEmail = localStorage.getItem("userEmail"); if (savedEmail) setEmail(savedEmail); }, []);
  return (
    <>
      <TopNavbar email={email} setEmail={setEmail} />
      <ContentWrapper>
        <Routes>
          <Route path="/" element={ <HomePage email={email} setEmail={setEmail} setHasStarted={setHasStarted} /> } />
          <Route path="/mmse" element={<MMSEPage email={email} />} />
          <Route path="/mmse-results" element={<MMSE_ResultsDisplay />} />
          <Route path="/drawing" element={<DrawingPage email={email} />} />
          <Route path="/results" element={<ResultsPage email={email} />} />
          <Route path="/feedback" element={<FeedbackPage email={email} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ContentWrapper>
    </>
  );
}

// --- 主要的 App 組件 (無變動) ---
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
// --- END OF FILE App.js (HOMEPAGE MODIFIED) ---
