// --- START OF FILE src/pages/FeedbackPage.js (新增地區欄位並移除題號) ---
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../App.css'; // 確保引入您的 CSS 檔案

// --- 表單選項資料 ---
const identityOptions = ["醫學大學學生", "醫師", "醫事人員", "教職人員","社會工作者","其他"];
const positionGradeOptions = [
    "大學部一、二年級", "大學部三、四年級", "大學部五、六年級", "研究所", "博士班",
    "就業年資5年以內", "就業年資6~10年", "就業年資11~15年", "就業年資16~20年",
    "就業年資21~25年", "就業年資26~30年", "就業年資31年以上"
];
const professionalFieldOptions = ["醫學", "牙醫", "護理學", "呼吸治療", "物理治療", "職能治療", "語言治療", "公衛", "臨床心理", "藥學","社會工作者","醫學教育", "學生", "其他"];
const genderOptions = ["男", "女"];
const ageRangeOptions = ["20歲以下", "21-25歲", "26-30歲", "31-35歲", "36-40歲", "41-45歲", "46-50歲", "51-55歲", "56-60歲", "61-65歲", "66-70歲", "71歲以上"];
const regionOptions = ["北部", "中部", "南部", "東部", "國外"]; // 新增地區選項
const yesNoOptions = ["有", "沒有"];
const yesNoUnsureOptions = ["是", "否", "不確定"];
const applicationScenarioOptions = ["臨床病人篩檢", "學生實習／技能訓練", "長照／社區場域初篩", "居家照護輔助", "遠距健康照護", "醫院預約前初篩", "學術研究", "個人健康追蹤","駕照換發體檢輔助","企業員工健康促進", "其他"];

// --- 李克特量表問題 (已移除題號) ---
const likertQuestions = {
    easeOfUse: [ { id: "q_s1_q1", text: "用來執行認知篩檢流程時，這個網站使用起來很容易。" }, { id: "q_s1_q2", text: "我很容易學會如何使用這個網站來完成各項評估流程。" }, { id: "q_s1_q3", text: "在不同評估階段（如 MMSE、畫鐘、總結）之間切換時，導覽是連貫一致的。" }, { id: "q_s1_q4", text: "這個網站的介面讓我能完成所有必要操作，例如輸入基本資料、認知評估與檢視總結結果。" }, { id: "q_s1_q5", text: "當我在評估流程中出現操作錯誤時，我能輕鬆地修正並繼續進行。" }, ],
    interfaceAndSatisfaction: [ { id: "q_s2_q6", text: "我喜歡這個認知評估網站的介面設計。" }, { id: "q_s2_q7", text: "網頁中的資訊與步驟安排得當，讓我能輕鬆完成篩檢流程。" }, { id: "q_s2_q8", text: "網站能提供足夠資訊，讓我了解當前的評估進度。" }, { id: "q_s2_q9", text: "在臨床或教學情境中，我使用這個網站會感到自在。" }, { id: "q_s2_q10", text: "使用這個網站完成篩檢流程所需時間是合理的。" }, { id: "q_s2_q11", text: "若有類似認知評估需求，我會考慮使用這個網站。" }, { id: "q_s2_q12", text: "整體而言，我對這個認知評估網站感到滿意。" }, ],
    usefulness: [ { id: "q_s3_q13", text: "這個網站對於辨識使用者的認知狀況很有幫助。" }, { id: "q_s3_q14", text: "這個網站能提升使用認知篩檢工具的效率。" }, { id: "q_s3_q15", text: "這個網站幫助我在短時間內有效完成認知篩檢。" }, { id: "q_s3_q16", text: "這個網站具備我預期用於認知評估的必要功能。" }, { id: "q_s3_q17", text: "在穩定網路下，這個網站能順利運作，並協助我完成整個篩檢流程。" }, { id: "q_s3_q18", text: "這個網站提供一種可接受且標準化的方式進行認知功能篩檢。" }, ],
    informationQuality: [ { id: "q_s4_q19", text: "這個網站所提供的資訊與結果是準確且具有臨床可靠性的。" }, { id: "q_s4_q20", text: "網站能即時提供與認知狀況總結相關的回饋資訊。" }, { id: "q_s4_q21", text: "網頁中呈現的內容，容易理解且不會讓人感到混淆。" }, { id: "q_s4_q22", text: "網站提供的資訊為臨床判斷所需內容，具參考價值。" }, ],
};

const FeedbackPage = ({ email }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const initialFormData = { 
        identity: "", identity_other: "", position_grade: "", 
        professional_field: {}, professional_field_other: "", 
        gender: "", age_range: "", region: "", 
        exp_dementia: "", exp_mmse: "", exp_cdt: "", 
        related_work: "", application_scenarios: {}, 
        application_scenarios_other: "", open_feedback: "", 
        ...Object.values(likertQuestions).flat().reduce((acc, q) => ({ ...acc, [q.id]: null }), {}) 
    };
    const [formData, setFormData] = useState(initialFormData);

    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleRadioChange = (name, value) => { setFormData(prev => ({ ...prev, [name]: value })); };
    const handleCheckboxChange = (groupName, option) => { setFormData(prev => ({ ...prev, [groupName]: { ...prev[groupName], [option]: !prev[groupName][option] } })); };
    const handleLikertChange = (questionId, value) => { setFormData(prev => ({ ...prev, [questionId]: parseInt(value, 10) })); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const { identity, position_grade, professional_field, gender, age_range, region, exp_dementia, exp_mmse, exp_cdt, related_work, application_scenarios } = formData;

        if (!identity || !position_grade || !gender || !age_range || !region || !exp_dementia || !exp_mmse || !exp_cdt || !related_work) {
            setError('請完成所有「個人基本資料」的必填問題。');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const professionalFieldSelected = Object.values(professional_field).some(v => v);
        if (!professionalFieldSelected) {
            setError('請至少選擇一個「專業領域」。');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const applicationScenariosSelected = Object.values(application_scenarios).some(v => v);
        if (!applicationScenariosSelected) {
            setError('請至少選擇一個「希望應用的情境」。');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        for (const section in likertQuestions) {
            for (const question of likertQuestions[section]) {
                if (formData[question.id] === null) {
                    setError('請完成所有「系統評估問卷」的評分題目。');
                    const el = document.querySelector(`input[name="${question.id}"]`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    return;
                }
            }
        }
        setIsLoading(true);
        const questionnaireForDebug = { 
        ...formData, 
        professional_field: Object.keys(formData.professional_field).filter(key => formData.professional_field[key]), 
        application_scenarios: Object.keys(formData.application_scenarios).filter(key => formData.application_scenarios[key]), 
    };
    console.log("即将发送到后端的数据 (questionnaire object):", questionnaireForDebug);
        const questionnaire = { ...formData, professional_field: Object.keys(formData.professional_field).filter(key => formData.professional_field[key]), application_scenarios: Object.keys(formData.application_scenarios).filter(key => formData.application_scenarios[key]), };
        const sessionId = localStorage.getItem("current_session_id");
        const userEmail = email || localStorage.getItem("userEmail");
        const submissionData = { email: userEmail || null, session_id: sessionId ? parseInt(sessionId, 10) : null, questionnaire: questionnaire };
        try {
            const backendBaseUrl = "http://163.15.172.187:8000";
            await axios.post(`${backendBaseUrl}/api/submit_feedback`, submissionData);
            setIsSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error("回饋提交失敗:", err);
            setError(`提交失敗，請稍後再試。錯誤: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return ( <div className="feedback-container"> <div className="thank-you-box"> <h2>感謝您的填寫！</h2> <p>您的寶貴意見是我們改進的最大動力。</p> <button className="feedback-button" onClick={() => navigate('/')}>返回首頁</button> </div> </div> );
    }

    const renderRadioGroup = (name, options) => ( <div className="option-group"> {options.map(opt => ( <label key={opt} className="feedback-label"> <input type="radio" name={name} value={opt} checked={formData[name] === opt} onChange={() => handleRadioChange(name, opt)} /> {opt} </label> ))} </div> );
    const renderCheckboxGroup = (name, options) => ( <div className="option-group"> {options.map(opt => ( <label key={opt} className="feedback-label"> <input type="checkbox" checked={!!formData[name][opt]} onChange={() => handleCheckboxChange(name, opt)} /> {opt} </label> ))} </div> );
    const renderLikertQuestion = (q, index) => ( <div key={q.id} className="likert-question"> <p className="likert-text">{index + 1}. {q.text} <span style={{color: 'red'}}>*</span></p> <div className="likert-scale"> {[1, 2, 3, 4, 5, 6, 7].map(val => ( <label key={val} className="likert-label"> <input type="radio" name={q.id} value={val} checked={formData[q.id] === val} onChange={(e) => handleLikertChange(q.id, e.target.value)} required /> {val} </label> ))} </div> <div className="likert-scale-text"> <span>1=非常不同意</span> <span>4=中立</span> <span>7=非常同意</span> </div> </div> );

    return (
        <div className="feedback-container">
            <form onSubmit={handleSubmit}>
                <h1>系統評估問卷</h1>
                <p className="intro-text"> 以下為針對本系統使用者背景之調查，資料僅作統計分析，絕不對外揭露個資。感謝您的參與！ </p>
                <div className="donation-message"> 💖 為鼓勵您完整填答，每完成一份有效問卷，我們將捐贈30元予公益社福機構，您的參與將轉化為實質的社會貢獻！ </div>
                {error && <p className="error-message">{error}</p>}

                <fieldset className="feedback-fieldset">
                    <legend className="feedback-legend">個人基本資料</legend>
                    <div className="question-box"><label className="question-title">您的身份別是？ (單選)</label>{renderRadioGroup("identity", identityOptions)}{formData.identity === "其他" && (<input type="text" name="identity_other" value={formData.identity_other} onChange={handleInputChange} placeholder="請說明您的身份別" className="text-input" />)}</div>
                    <div className="question-box"><label htmlFor="position_grade" className="question-title">您的年級／年資：</label><select id="position_grade" name="position_grade" value={formData.position_grade} onChange={handleInputChange} className="feedback-select"><option value="">請選擇...</option>{positionGradeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div className="question-box"><label className="question-title">您的專業領域是？ (可複選)</label>{renderCheckboxGroup("professional_field", professionalFieldOptions)}{formData.professional_field["其他"] && (<input type="text" name="professional_field_other" value={formData.professional_field_other} onChange={handleInputChange} placeholder="請說明您的專業領域" className="text-input" />)}</div>
                    <div className="question-box"><label className="question-title">您的生理性別：</label>{renderRadioGroup("gender", genderOptions)}</div>
                    <div className="question-box"><label htmlFor="age_range" className="question-title">您的年齡：</label><select id="age_range" name="age_range" value={formData.age_range} onChange={handleInputChange} className="feedback-select"><option value="">請選擇年齡區間...</option>{ageRangeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div className="question-box"><label className="question-title">您所在的地區：</label>{renderRadioGroup("region", regionOptions)}</div>
                    <div className="question-box"><label className="question-title">您是否有臨床接觸或照護失智症／認知障礙患者的經驗？</label>{renderRadioGroup("exp_dementia", yesNoOptions)}</div>
                    <div className="question-box"><label className="question-title">您是否曾學習或使用 MMSE 或其他認知功能評估量表？</label>{renderRadioGroup("exp_mmse", yesNoOptions)}</div>
                    <div className="question-box"><label className="question-title">您是否曾學習或使用畫鐘測驗？</label>{renderRadioGroup("exp_cdt", yesNoOptions)}</div>
                    <div className="question-box"><label className="question-title">您目前是否從事或即將從事與認知功能評估相關之工作或教學活動？</label>{renderRadioGroup("related_work", yesNoUnsureOptions)}</div>
                    <div className="question-box"><label className="question-title">您希望此網站能應用於哪些情境？ (可複選)</label>{renderCheckboxGroup("application_scenarios", applicationScenarioOptions)}{formData.application_scenarios["其他"] && (<input type="text" name="application_scenarios_other" value={formData.application_scenarios_other} onChange={handleInputChange} placeholder="請說明其他應用情境" className="text-input" />)}</div>
                    <div className="question-box"><label htmlFor="open_feedback" className="question-title">使用過這個系統後，請提供改善建議或其他意見? (非必填)</label><textarea id="open_feedback" name="open_feedback" value={formData.open_feedback} onChange={handleInputChange} className="feedback-textarea" rows="5" placeholder="任何建議對我們都非常重要..."></textarea></div>
                </fieldset>

                <fieldset className="feedback-fieldset">
                    <legend className="feedback-legend">系統評估問卷</legend>
                    <h3 className="sub-legend"></h3>{likertQuestions.easeOfUse.map((q, i) => renderLikertQuestion(q, i))}
                    <h3 className="sub-legend"></h3>{likertQuestions.interfaceAndSatisfaction.map((q, i) => renderLikertQuestion(q, i + likertQuestions.easeOfUse.length))}
                    <h3 className="sub-legend"></h3>{likertQuestions.usefulness.map((q, i) => renderLikertQuestion(q, i + likertQuestions.easeOfUse.length + likertQuestions.interfaceAndSatisfaction.length))}
                    <h3 className="sub-legend"></h3>{likertQuestions.informationQuality.map((q, i) => renderLikertQuestion(q, i + likertQuestions.easeOfUse.length + likertQuestions.interfaceAndSatisfaction.length + likertQuestions.usefulness.length))}
                </fieldset>
                
                {error && <p className="error-message">{error}</p>}
                
                <div className="submit-container"><button type="submit" className="feedback-button" disabled={isLoading}>{isLoading ? "提交中..." : "送出問卷"}</button></div>
            </form>
        </div>
    );
};

export default FeedbackPage;
// --- END OF FILE src/pages/FeedbackPage.js (新增地區欄位並移除題號) ---
