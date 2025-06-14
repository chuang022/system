# --- START OF FILE main_with_advice.py (MODIFIED) ---
from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models, transforms
import io
import os
from datetime import datetime
import json
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from typing_extensions import Annotated

import mysql.connector
from mysql.connector import Error as MySQLError
import random # 用於模擬預測

# --- Database Configuration ---
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '0000', # 請確保這是您 MySQL root 的正確密碼
    'database': 'clock_test_system'
}

# --- Pydantic Models (保持不變) ---
class MMSESubmission(BaseModel):
    email: Optional[EmailStr] = None
    gender: str
    age_group: str = Field(..., alias="age")
    education: str
    med_depression: str
    med_sleep: str
    med_attention: str
    mmse_score: int
    mmse_details: Optional[List[str]] = None
    user_selected_country: Optional[str] = None
    user_selected_city: Optional[str] = None
    ip_detected_country: Optional[str] = None
    ip_detected_city: Optional[str] = None
    queried_ip_address: Optional[str] = None
    ip_location_raw_country: Optional[str] = None
    ip_location_raw_city: Optional[str] = None
    ip_location_error: Optional[str] = None
    naming_task_correct_ids: Optional[List[str]] = None

class FeedbackQuestionnaire(BaseModel):
    q_usability_intuitive: Annotated[int, Field(ge=1, le=5)]
    q_usability_easy_cdt: Annotated[int, Field(ge=1, le=5)]
    q_usability_guidance: Annotated[int, Field(ge=1, le=5)]
    q_satisfaction_design: Annotated[int, Field(ge=1, le=5)]
    q_satisfaction_reuse: Annotated[int, Field(ge=1, le=5)]
    q_satisfaction_recommend: Annotated[int, Field(ge=1, le=5)]
    q_effectiveness_self_cognition: Annotated[int, Field(ge=1, le=5)]
    q_effectiveness_helpful_elders: Annotated[int, Field(ge=1, le=5)]
    q_effectiveness_efficient: Annotated[int, Field(ge=1, le=5)]
    q_effectiveness_clear_results: Annotated[int, Field(ge=1, le=5)]
    open_feedback_improvement: Optional[str] = Field(None, max_length=2000)
    open_feedback_suggestions: Optional[str] = Field(None, max_length=2000)

class FeedbackSubmission(BaseModel):
    email: Optional[EmailStr] = None
    session_id: Optional[int] = None
    questionnaire: FeedbackQuestionnaire

# --- FastAPI Initialization & CORS (保持不變) ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://163.15.172.187:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# --- Database Connection Function (保持不變) ---
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            return conn
    except MySQLError as e:
        print(f"❌ 連接到 MySQL 時發生錯誤: {e}")
        raise HTTPException(status_code=503, detail=f"資料庫服務不可用: {e}")
    return None

# --- Model & Device Setup ---
# 如果您有真實模型，請取消註解並配置以下程式碼
# num_classes = 2
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# MODEL_PATH = "vgg16_transfer_best_model_addnewdata.pth"
# model_cdt = models.vgg16(weights=None) # 或者 models.vgg16(weights=models.VGG16_Weights.IMAGENET1K_V1)
# model_cdt.classifier[6] = nn.Linear(model_cdt.classifier[6].in_features, num_classes)
# if os.path.exists(MODEL_PATH):
#     try:
#         model_cdt.load_state_dict(torch.load(MODEL_PATH, map_location=device))
#         print(f"✅ CDT 模型權重 '{MODEL_PATH}' 載入成功。")
#     except Exception as e:
#         print(f"❌ 載入 CDT 模型權重 '{MODEL_PATH}' 失敗: {e}")
# else:
#     print(f"❌ 錯誤：找不到 CDT 模型權重檔案 '{MODEL_PATH}'。")
# model_cdt = model_cdt.to(device)
# model_cdt.eval()

# transform_cdt = transforms.Compose([
#     transforms.Resize(256),
#     transforms.CenterCrop(224),
#     transforms.ToTensor(),
#     transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
# ])

CDT_IMAGES_DIR = "cdt_images"
os.makedirs(CDT_IMAGES_DIR, exist_ok=True)

# --- API Endpoints ---

@app.get("/api/get_location_from_ip")
async def get_location_from_ip(request: Request):
    client_ip = request.client.host
    # 實際部署時建議使用 requests 向 ip-api.com 或其他服務發送請求
    # import requests
    # try:
    #     response = requests.get(f"http://ip-api.com/json/{client_ip}?fields=status,message,country,city,query")
    #     data = response.json()
    #     ...
    # except Exception as e:
    #     ...
    print(f"🌍 Mocking IP location for {client_ip}")
    return {"country": "台灣", "city": "高雄市", "query_ip": client_ip, "raw_country": "Taiwan", "raw_city": "Kaohsiung"}


@app.post("/api/submit_mmse_session")
async def submit_mmse_session(submission: MMSESubmission):
    # 此函數保持不變
    db_conn = None; cursor = None
    try:
        db_conn = get_db_connection()
        if not db_conn: raise HTTPException(status_code=503, detail="資料庫連接失敗")
        cursor = db_conn.cursor()
        session_start_time = datetime.now()
        mmse_date_taken = datetime.now()
        mmse_details_json = json.dumps(submission.mmse_details, ensure_ascii=False) if submission.mmse_details is not None else None
        naming_ids_json = json.dumps(submission.naming_task_correct_ids) if submission.naming_task_correct_ids is not None else None
        session_sql = """
            INSERT INTO test_records (
                user_email, gender, age_group, education,
                med_depression, med_sleep, med_attention, session_start_time,
                user_selected_country, user_selected_city, 
                ip_detected_country, ip_detected_city, queried_ip_address,
                ip_location_raw_country, ip_location_raw_city, ip_location_error,
                naming_task_correct_ids 
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        session_values = (
            submission.email, submission.gender, submission.age_group, submission.education,
            submission.med_depression, submission.med_sleep, submission.med_attention,
            session_start_time,
            submission.user_selected_country, submission.user_selected_city,
            submission.ip_detected_country, submission.ip_detected_city, submission.queried_ip_address,
            submission.ip_location_raw_country, submission.ip_location_raw_city, submission.ip_location_error,
            naming_ids_json
        )
        cursor.execute(session_sql, session_values)
        session_id_from_db = cursor.lastrowid
        if not session_id_from_db: raise HTTPException(status_code=500, detail="無法創建會話 ID (test_records)")
        mmse_sql = """
            INSERT INTO mmse_results (session_id, score, details, date_taken) 
            VALUES (%s, %s, %s, %s)
        """
        mmse_values = (session_id_from_db, submission.mmse_score, mmse_details_json, mmse_date_taken)
        cursor.execute(mmse_sql, mmse_values)
        db_conn.commit()
        return {"message": "MMSE 和基本資料儲存成功", "session_id": session_id_from_db}
    except MySQLError as err:
        if db_conn: db_conn.rollback()
        raise HTTPException(status_code=500, detail=f"資料庫錯誤: {err.msg}")
    except Exception as e:
        if db_conn: db_conn.rollback()
        raise HTTPException(status_code=500, detail=f"處理 MMSE 提交時發生內部錯誤: {str(e)}")
    finally:
        if cursor: cursor.close()
        if db_conn and db_conn.is_connected(): db_conn.close()

# --- START OF MODIFICATION ---
@app.post("/predict/")
async def predict_image(request: Request, session_id: int, file: UploadFile = File(...)):
    """
    接收上傳的畫鐘圖片，進行預測，儲存結果，並返回 JSON 格式的分析。
    session_id 作為查詢參數傳遞，例如: /predict/?session_id=123
    """
    if not session_id:
        raise HTTPException(status_code=400, detail="請求中缺少 session_id")

    try:
        contents = await file.read()
        
        # --- MOCK PREDICTION LOGIC (for testing without a real model) ---
        # 移除或註解此區塊當您要使用真實模型時
        is_normal = random.choice([True, False])
        if is_normal:
            label = "normal"
            confidence_percent = random.uniform(85.0, 99.9)
            advice = "模擬結果：時鐘繪製測驗結果顯示正常，您的視覺空間和執行功能表現良好。"
        else:
            label = "abnormal"
            confidence_percent = random.uniform(70.0, 95.0)
            advice = "模擬結果：時鐘繪製測驗結果顯示可能存在異常。建議諮詢專業醫師進行進一步評估。"
        # --- END OF MOCK PREDICTION ---
        
        # --- REAL MODEL PREDICTION LOGIC (uncomment to use) ---
        # image = Image.open(io.BytesIO(contents)).convert("RGB")
        # image_tensor = transform_cdt(image).unsqueeze(0).to(device)
        #
        # with torch.no_grad():
        #     outputs = model_cdt(image_tensor)
        #     probabilities = torch.nn.functional.softmax(outputs, dim=1)
        #     confidence, predicted = torch.max(probabilities, 1)
        #
        # predicted_class_index = predicted.item()
        # confidence_percent = confidence.item() * 100
        # class_names = ["abnormal", "normal"]  # Ensure index 0=abnormal, 1=normal
        # label = class_names[predicted_class_index]
        #
        # if label == "normal":
        #     advice = "時鐘繪製測驗結果顯示正常，您的視覺空間和執行功能表現良好。"
        # else:
        #     advice = "時鐘繪製測驗結果顯示可能存在異常。建議諮詢專業醫師進行進一步評估。"
        # --- END OF REAL MODEL LOGIC ---

    except Exception as e:
        print(f"❌ 圖片處理或模型預測失敗: {e}")
        raise HTTPException(status_code=400, detail=f"圖片處理或模型預測失敗: {e}")

    db_conn = None
    cursor = None
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = f"cdt_{session_id}_{timestamp}.png"
        image_path = os.path.join(CDT_IMAGES_DIR, image_filename)
        with open(image_path, "wb") as f:
            f.write(contents)

        db_conn = get_db_connection()
        cursor = db_conn.cursor()
        
        sql = """
            INSERT INTO cdt_results (session_id, result_label, confidence, advice, image_filename, date_taken)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                result_label = VALUES(result_label),
                confidence = VALUES(confidence),
                advice = VALUES(advice),
                image_filename = VALUES(image_filename),
                date_taken = VALUES(date_taken);
        """
        values = (session_id, label, round(confidence_percent, 2), advice, image_filename, datetime.now())
        cursor.execute(sql, values)
        db_conn.commit()
        print(f"✅ CDT 結果已儲存/更新至資料庫，Session ID: {session_id}")
    
    except MySQLError as err:
        print(f"❌ 資料庫操作錯誤 (predict_image): {err}")
        if db_conn: db_conn.rollback()
        raise HTTPException(status_code=500, detail=f"資料庫儲存 CDT 結果時出錯: {err.msg}")
    finally:
        if cursor: cursor.close()
        if db_conn and db_conn.is_connected(): db_conn.close()

    return {
        "result": label,
        "confidence": round(confidence_percent, 2),
        "advice": advice
    }
# --- END OF MODIFICATION ---

@app.post("/api/submit_feedback")
async def submit_feedback(submission: FeedbackSubmission):
    # 此函數保持不變
    db_conn = None; cursor = None
    try:
        db_conn = get_db_connection()
        if not db_conn: raise HTTPException(status_code=503, detail="資料庫連接失敗")
        cursor = db_conn.cursor()
        q = submission.questionnaire
        sql = """
            INSERT INTO user_feedback (
                session_id, user_email,
                q_usability_intuitive, q_usability_easy_cdt, q_usability_guidance,
                q_satisfaction_design, q_satisfaction_reuse, q_satisfaction_recommend,
                q_effectiveness_self_cognition, q_effectiveness_helpful_elders,
                q_effectiveness_efficient, q_effectiveness_clear_results,
                open_feedback_improvement, open_feedback_suggestions, submission_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            submission.session_id, submission.email,
            q.q_usability_intuitive, q.q_usability_easy_cdt, q.q_usability_guidance,
            q.q_satisfaction_design, q.q_satisfaction_reuse, q.q_satisfaction_recommend,
            q.q_effectiveness_self_cognition, q.q_effectiveness_helpful_elders,
            q.q_effectiveness_efficient, q.q_effectiveness_clear_results,
            q.open_feedback_improvement, q.open_feedback_suggestions, datetime.now()
        )
        cursor.execute(sql, values)
        db_conn.commit()
        feedback_id = cursor.lastrowid
        return {"message": "回饋提交成功", "feedback_id": feedback_id}
    except MySQLError as err:
        if db_conn: db_conn.rollback()
        raise HTTPException(status_code=500, detail=f"資料庫錯誤: {err.msg}")
    finally:
        if cursor: cursor.close()
        if db_conn and db_conn.is_connected(): db_conn.close()

def create_tables_if_not_exist():
    # 此函數保持不變
    db_conn = None; cursor = None
    try:
        db_conn = get_db_connection()
        if not db_conn: return
        cursor = db_conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS test_records (
                session_id INT AUTO_INCREMENT PRIMARY KEY, user_email VARCHAR(255) NULL,
                gender VARCHAR(10) NULL, age_group VARCHAR(50) NULL, education VARCHAR(100) NULL,
                med_depression VARCHAR(5) NULL, med_sleep VARCHAR(5) NULL, med_attention VARCHAR(5) NULL,
                session_start_time DATETIME DEFAULT CURRENT_TIMESTAMP, user_selected_country VARCHAR(100) NULL,
                user_selected_city VARCHAR(100) NULL, ip_detected_country VARCHAR(100) NULL,
                ip_detected_city VARCHAR(100) NULL, queried_ip_address VARCHAR(50) NULL,
                ip_location_raw_country VARCHAR(100) NULL, ip_location_raw_city VARCHAR(100) NULL,
                ip_location_error TEXT NULL, naming_task_correct_ids JSON NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mmse_results (
                result_id INT AUTO_INCREMENT PRIMARY KEY, session_id INT NOT NULL, score INT NULL,
                details TEXT NULL, date_taken DATETIME NULL,
                FOREIGN KEY (session_id) REFERENCES test_records(session_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cdt_results (
                result_id INT AUTO_INCREMENT PRIMARY KEY, session_id INT NOT NULL,
                result_label VARCHAR(50) NULL, confidence FLOAT NULL, advice TEXT NULL,
                image_filename VARCHAR(255) NULL, date_taken DATETIME NULL,
                FOREIGN KEY (session_id) REFERENCES test_records(session_id) ON DELETE CASCADE,
                UNIQUE KEY (session_id) -- 每個 session 只能有一筆 CDT 結果
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_feedback (
                feedback_id INT AUTO_INCREMENT PRIMARY KEY, session_id INT NULL, user_email VARCHAR(255) NULL,
                q_usability_intuitive TINYINT NULL, q_usability_easy_cdt TINYINT NULL, q_usability_guidance TINYINT NULL,
                q_satisfaction_design TINYINT NULL, q_satisfaction_reuse TINYINT NULL, q_satisfaction_recommend TINYINT NULL,
                q_effectiveness_self_cognition TINYINT NULL, q_effectiveness_helpful_elders TINYINT NULL,
                q_effectiveness_efficient TINYINT NULL, q_effectiveness_clear_results TINYINT NULL,
                open_feedback_improvement TEXT NULL, open_feedback_suggestions TEXT NULL,
                submission_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES test_records(session_id) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""")
        db_conn.commit()
    except MySQLError as err:
        if db_conn: db_conn.rollback()
    finally:
        if cursor: cursor.close()
        if db_conn and db_conn.is_connected(): db_conn.close()

@app.on_event("startup")
async def startup_event():
    create_tables_if_not_exist()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_with_advice:app", host="0.0.0.0", port=8000, reload=True)
# --- END OF FILE main_with_advice.py (MODIFIED) ---