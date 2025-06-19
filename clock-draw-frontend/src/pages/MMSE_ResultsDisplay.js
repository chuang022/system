// --- START OF FILE src/pages/MMSE_ResultsDisplay.js (CORRECTED) ---
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MMSE_ResultsDisplay = () => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const userEmail = localStorage.getItem("userEmail"); 
        const mmseStorageKey = userEmail ? `mmse_result_${userEmail}` : 'mmse_result_guest';
        console.log(`[MMSE_ResultsDisplay] Attempting to load from localStorage key: ${mmseStorageKey}`); // 增加日誌
        const storedResults = localStorage.getItem(mmseStorageKey);
        
        if (storedResults) {
            try {
                const parsedResults = JSON.parse(storedResults);
                console.log("[MMSE_ResultsDisplay] Parsed results from localStorage:", parsedResults); // 增加日誌
                setResults(parsedResults);
            } catch (error) {
                console.error("[MMSE_ResultsDisplay] Error parsing MMSE results from localStorage:", error);
                setResults({ error: "無法讀取測驗結果 (資料解析錯誤)。" }); // 設定一個包含錯誤的物件
            }
        } else {
            console.warn("[MMSE_ResultsDisplay] No MMSE results found in localStorage for key:", mmseStorageKey);
            setResults({ error: "找不到 MMSE 測驗結果。請先完成MMSE測驗。" }); // 設定一個包含錯誤的物件
        }
        setLoading(false);
    }, []);

const getPreliminaryAssessment = (score) => {
        if (score === null || score === undefined) return "（結果載入中或尚未完成）";
        if (score >= 25) return "目前的認知表現良好，建議保持健康生活習慣。";
        if (score >= 21 && score <= 24) return "目前的認知表現可能存在一些小挑戰，建議多加留意並考慮諮詢專業人士的意見。";
        if (score >= 10 && score <= 20) return "目前的認知表現顯示可能需要進一步的關注，強烈建議尋求專業人士的評估與協助。";
        if (score <= 9) return "目前的認知表現顯示需要立即的專業評估與支持，請盡快聯繫醫療專業人士。";
        return "評估分數無法識別";
    };

    if (loading) {
        return <div style={{ padding: "20px", textAlign: "center", fontSize: "18px" }}>MMSE 結果讀取中...</div>;
    }

    // *** 關鍵修改：在解構之前，確保 results 存在且不是錯誤物件 ***
    if (!results || results.error) {
        return (
            <div style={{ padding: "20px", textAlign: "center", fontSize: "18px", color: "red" }}>
                {results?.error || "無法載入 MMSE 測驗結果。"}
            </div>
        );
    }

    // 現在可以安全地解構，因為 results 一定是一個有效的物件
    const { score, date, details } = results; 
    
    const formattedDate = date 
        ? new Date(date).toLocaleString('zh-TW', { 
              year: 'numeric', month: '2-digit', day: '2-digit', 
              hour: '2-digit', minute: '2-digit', hour12: false 
          }).replace(/\//g, '/')
        : "N/A";
        
    const assessment = getPreliminaryAssessment(score);

    // --- 樣式定義 (保持不變，為簡潔省略) ---
    const containerStyle = { /* ... */ fontFamily: "'Noto Sans TC', Arial, sans-serif", maxWidth: "700px", margin: "40px auto", padding: "25px 35px", backgroundColor: "#f7f9fc", border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)"};
    const headerStyle = { /* ... */ fontSize: "22px", fontWeight: "bold", color: "#333333", borderBottom: "1px solid #eeeeee", paddingBottom: "15px", marginBottom: "20px", textAlign: "left"};
    const itemStyle = { /* ... */ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "17px", lineHeight: 1.6};
    const labelStyle = { /* ... */ fontWeight: "normal", color: "#555555", marginRight: "10px"};
    const valueStyle = { /* ... */ color: "#333333", textAlign: "right", fontWeight: "normal"};
    const detailsHeaderStyle = { /* ... */ marginTop: "30px", fontSize: "18px", fontWeight: "bold", color: "#444444", borderTop: "1px solid #eeeeee", paddingTop: "20px", marginBottom: "15px"};
    const detailsListStyle = { /* ... */ listStylePosition: "inside", paddingLeft: "0", fontSize: "16px", marginTop: 0,};
    const detailItemStyle = { /* ... */ backgroundColor: "#fff0f0", border: "1px solid #f9c6c6", borderRadius: "4px", padding: "10px 15px", marginBottom: "8px", color: "#c82333", lineHeight: 1.5};
    const noErrorsStyle = { /* ... */ ...detailItemStyle, backgroundColor: "#e6f7ff", borderColor: "#b3e0ff", color: "#005f88",};
    const buttonContainerStyle = { /* ... */ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eeeeee', textAlign: 'center' };
    const buttonStyle = { /* ... */ padding: "12px 25px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "6px", fontSize: "17px", cursor: "pointer", fontWeight: 500, transition: "background-color 0.2s ease"};
    // --- 樣式定義結束 ---

    return (
        <div style={containerStyle}>
            <h2 style={headerStyle}>MMSE 測驗結果</h2>
            
            <div style={itemStyle}>
                <span style={labelStyle}>測驗日期：</span>
                <span style={valueStyle}>{formattedDate}</span>
            </div>
            
            <div style={itemStyle}>
                <span style={labelStyle}>得分：</span>
                <span style={valueStyle}>{score !== null && score !== undefined ? `${score} / 30` : "N/A"}</span>
            </div>

            <div style={{...itemStyle, borderBottom: 'none', paddingBottom: 0, marginBottom: '20px'}}>
                <span style={labelStyle}>初步評估：</span>
                <span style={valueStyle}>{assessment}</span>
            </div>

            {/* 確保 details 是陣列才進行 map */}
            {Array.isArray(details) && details.length > 0 && (
                <>
                    <h3 style={detailsHeaderStyle}>錯誤詳情：</h3>
                    <ul style={detailsListStyle}>
                        {details.map((detail, index) => (
                            <li key={index} style={detailItemStyle}>
                                {detail}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            
            {(!Array.isArray(details) || details.length === 0) && score === 30 && (
                 <>
                    <h3 style={detailsHeaderStyle}>錯誤詳情：</h3>
                    <p style={noErrorsStyle}>恭喜！所有題目均回答正確。</p>
                </>
            )}

            {/* 處理 details 不是陣列或為空，且分數非滿分的情況 */}
            {(!Array.isArray(details) || details.length === 0) && score !== 30 && score !== null && score !== undefined && (
                 <>
                    <h3 style={detailsHeaderStyle}>錯誤詳情：</h3>
                    <p style={noErrorsStyle}>所有題目均回答正確，或未記錄具體的錯誤項目。</p>
                 </>
            )}

            <div style={buttonContainerStyle}>
                <button 
                    onClick={() => navigate('/drawing')}
                    style={buttonStyle}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                >
                    前往畫鐘測驗 ➡️
                </button>
            </div>
        </div>
    );
};

export default MMSE_ResultsDisplay;
// --- END OF FILE src/pages/MMSE_ResultsDisplay.js (CORRECTED) ---
