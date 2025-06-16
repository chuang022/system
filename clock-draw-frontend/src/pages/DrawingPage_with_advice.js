// --- START OF FILE DrawingPage_with_advice.js (FULL & CORRECTED) ---
import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DrawingPage = ({ email }) => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 }); // 用來記錄上一個點的位置
  const [isLoading, setIsLoading] = useState(false);
  const userEmail = email || localStorage.getItem("userEmail") || 'guest';

  const backendBaseUrl = "http://163.15.172.187:8000";

  // --- START: 繪圖核心函數 ---

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
// 獲取事件的 clientX, clientY，無論是滑鼠還是觸控
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();

    // 計算滑鼠/觸控點相對於 canvas 元素的偏移量
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    // 關鍵修正：考慮 CSS 縮放導致的尺寸差異
    // canvas.width 是畫布的繪圖表面寬度 (e.g., 600)
    // rect.width 是 canvas 元素在頁面上實際渲染的寬度 (e.g., 300px)
    // 我們需要將偏移量按比例縮放回原始的畫布座標系統
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: offsetX * scaleX,
      y: offsetY * scaleY,
    };
};

  const startDrawing = (e) => {
    e.preventDefault(); // 防止在觸控設備上滾動頁面
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    isDrawing.current = true;
    const pos = getCoords(e);
    lastPosition.current = pos;

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    const pos = getCoords(e);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastPosition.current = pos;
  };

  const stopDrawing = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.closePath();
    }
    
    isDrawing.current = false;
  };

  // --- END: 繪圖核心函數 ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("[DrawingPage useEffect] Canvas ref is not available on mount!");
      return;
    }
    
    const ctx = canvas.getContext("2d");
    // 設定畫筆樣式
    ctx.strokeStyle = "#000000"; // 黑色畫筆
    ctx.lineWidth = 3;           // 畫筆粗細
    ctx.lineCap = "round";       // 線條末端為圓形
    ctx.lineJoin = "round";      // 線條連接處為圓形

    // 綁定事件監聽器
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing); // 滑鼠離開畫布也停止繪圖

    // 支援觸控設備
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchcancel", stopDrawing);

    // 清理函數：在元件卸載時移除事件監聽器，防止記憶體洩漏
    return () => {
      if (canvas) {
        canvas.removeEventListener("mousedown", startDrawing);
        canvas.removeEventListener("mousemove", draw);
        canvas.removeEventListener("mouseup", stopDrawing);
        canvas.removeEventListener("mouseleave", stopDrawing);
        canvas.removeEventListener("touchstart", startDrawing);
        canvas.removeEventListener("touchmove", draw);
        canvas.removeEventListener("touchend", stopDrawing);
        canvas.removeEventListener("touchcancel", stopDrawing);
      }
    };
  }, []); // 空依賴項陣列確保此 effect 只在元件掛載時執行一次

  const mapResultToScore = (resultString) => {
    let score = null;
    switch (String(resultString).trim().toLowerCase()) {
      case "normal": score = 5; break;
      case "abnormal": score = 1; break;
    }
    if (score === null && String(resultString).trim() !== "" && String(resultString).trim().toLowerCase() !== "未知") {
      console.warn(`[DrawingPage mapResultToScore] Unrecognized result '${resultString}'. Treating as abnormal (score 1).`);
      score = 1;
    }
    return score;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    console.log("[DrawingPage clearCanvas] Clearing canvas.");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const sendToBackend = async () => {
    console.log("[DrawingPage sendToBackend] Function called.");
    const canvas = canvasRef.current;
    if (!canvas) { 
      console.error("[DrawingPage sendToBackend] Canvas ref is null! Aborting."); 
      return; 
    }
    
    setIsLoading(true);
    
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width; 
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
        setIsLoading(false);
        return;
    }
    tempCtx.fillStyle = "#ffffff"; // 設定背景為白色
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    tempCanvas.toBlob(async (blob) => {
      if (!blob) { 
        alert("無法處理畫布圖像，請重試。"); 
        setIsLoading(false); 
        return; 
      }
      
      const formDataObj = new FormData();
      formDataObj.append("file", blob, "drawing.png");
      
      const sessionIdFromStorage = localStorage.getItem("current_session_id");
      if (!sessionIdFromStorage) {
          alert("發生內部錯誤，無法提交 CDT 結果 (缺少會話 ID)。請重新開始測驗。");
          setIsLoading(false);
          return;
      }
      
      try {
        const predictApiEndpoint = `${backendBaseUrl}/predict/?session_id=${sessionIdFromStorage}`;
        const response = await axios.post(predictApiEndpoint, formDataObj);
        
        const resultString = response.data?.result || "未知";
        const score = mapResultToScore(resultString);

        if (score === null) {
            alert(`後端返回的 CDT 結果無法識別 ('${resultString}')，請聯繫管理員。`);
            setIsLoading(false); 
            return; 
        }

        const resultData = { 
            score: score, 
            resultText: resultString, 
            confidence: response.data?.confidence ?? null, 
            advice: response.data?.advice || "", 
            date: new Date().toISOString() 
        };

        const cdtStorageKey = email ? `cdt_result_${userEmail}` : 'cdt_result_guest';
        localStorage.setItem(cdtStorageKey, JSON.stringify(resultData)); 
        
        navigate("/results");

      } catch (error) {
        let errorMsg = "傳送辨識時發生錯誤。";
        if (error.response) { 
            errorMsg += `\n後端錯誤: ${error.response.status} - ${JSON.stringify(error.response.data || error.message)}`; 
        } else if (error.request) { 
            errorMsg += `\n無法連接到後端伺服器。`; 
        } else { 
            errorMsg += `\n錯誤訊息: ${error.message}`; 
        }
        alert(errorMsg);
      } finally {
        setIsLoading(false);
      }
    }, "image/png");
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif", padding: "20px" }}>
        <h2 style={{ marginBottom: "10px", color: "#333" }}>🕒 CDT 畫鐘測驗</h2>
        <p style={{ marginBottom: "20px", fontSize: "18px" }}> 請在下方畫布繪製一個時鐘，並將時間設定為 <strong>上午 11 點 10 分</strong>。 </p>
<div style={{ 
    maxWidth: '600px',
    margin: '-10px auto 20px auto',
    padding: '12px 20px',
    backgroundColor: '#f0f4f8', // 改為更中性的淡藍灰色
    borderLeft: '4px solid #4a90e2', // 穩重的藍色邊框
    borderRadius: '4px',
    color: '#333', // 主要文字顏色
    fontSize: '15px',
    lineHeight: '1.7',
    textAlign: 'left' // 讓列表文字靠左對齊
}}>
    <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>✏️ 操作提示：</strong>
    <ul style={{ paddingLeft: '20px', margin: 0 }}>
        <li><strong>電腦 / 筆電：</strong>可以使用「滑鼠」進行繪製。</li>
        <li><strong>觸控螢幕 / 平板 / 手機：</strong>請直接用「手指」或「觸控筆」進行繪製。</li>
    </ul>
</div>
        <canvas
            ref={canvasRef}
            width={600}
            height={600}
            style={{
            border: "2px solid #6c757d",
            backgroundColor: "#ffffff",
            touchAction: "none", // 關鍵：防止觸控事件的預設行為（如滾動）
            cursor: "crosshair",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            maxWidth: "100%",
            height: "auto",
            display: "block",
            margin: "0 auto 20px auto"
            }}
        />
         <div style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}>
            <button // 1. 返回首頁 (原為第3個)
                onClick={() => navigate("/")}
                disabled={isLoading}
                style={{ padding: "12px 25px", fontSize: "16px", backgroundColor: isLoading ? "#ccc" : "#dc3545", color: "white", border: "none", borderRadius: "5px", cursor: isLoading ? "not-allowed" : "pointer" }}
            >
                返回首頁 🏠
            </button>
            <button // 2. 清除重畫 (保持在中間)
                onClick={clearCanvas}
                disabled={isLoading}
                style={{ padding: "12px 25px", fontSize: "16px", backgroundColor: isLoading ? "#ccc" : "#ffc107", color: isLoading? "#666" : "#333", border: "none", borderRadius: "5px", cursor: isLoading ? "not-allowed" : "pointer" }}
            >
                清除重畫 ↺
            </button>
            <button // 3. 完成繪圖，查看結果 (原為第1個)
                onClick={sendToBackend}
                disabled={isLoading}
                style={{ padding: "12px 25px", fontSize: "16px", backgroundColor: isLoading ? "#ccc" : "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: isLoading ? "not-allowed" : "pointer" }}
            >
                {isLoading ? "處理中..." : "完成繪圖，查看結果 ➡️"}
            </button>
        </div>
    </div>
  );
};

export default DrawingPage;
// --- END OF FILE DrawingPage_with_advice.js (FULL & CORRECTED) ---
