// --- START OF FILE MMSEPage.js (COMPLETE & FULLY CORRECTED) ---
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

function shuffleArray(arr) {
    if (!Array.isArray(arr)) {
        console.warn("[shuffleArray] 輸入不是陣列，返回空陣列。", arr);
        return [];
    }
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
const ACTION_ROWS_DATA = [
    [ { text: "拿起紙張", imgSrc: "/images/actions/pickup_paper.jpg" }, { text: "轉頭", imgSrc: "/images/actions/turn_head.jpg" }, { text: "閱讀文件", imgSrc: "/images/actions/read_document.jpg" }, ],
    [ { text: "丟棄紙張", imgSrc: "/images/actions/throw_away.jpg" }, { text: "翻頁", imgSrc: "/images/actions/turn_page.jpg" }, { text: "對折紙張", imgSrc: "/images/actions/fold_paper.jpg" }, ],
    [ { text: "放在桌上", imgSrc: "/images/actions/place_on_table.jpg" }, { text: "放在膝上", imgSrc: "/images/actions/place_on_lap.jpg" }, { text: "撕開紙張", imgSrc: "/images/actions/tear_paper.jpg" }, ]
];
const ALL_NAMING_ITEMS = [
    { id: 'watch', name: '手錶', imgSrc: '/images/pen1.jpg' }, { id: 'pen', name: '筆', imgSrc: '/images/pen2.jpg' },
    { id: 'speaker', name: '音響', imgSrc: '/images/pen3.jpg' }, { id: 'car', name: '汽車', imgSrc: '/images/pen4.jpg' },
    { id: 'backpack', name: '背包', imgSrc: '/images/pen5.jpg' }, { id: 'monitor', name: '螢幕', imgSrc: '/images/pen6.jpg' },
];
const ALL_WORDS = [
    { id: 1, name: "蘋果", audioSrc: "/audio/audio1.mp3", imgSrc: "/images/img1.jpg" }, { id: 2, name: "椅子", audioSrc: "/audio/audio2.mp3", imgSrc: "/images/img2.jpg" },
    { id: 3, name: "桌子", audioSrc: "/audio/audio3.mp3", imgSrc: "/images/img3.jpg" }, { id: 4, name: "杯子", audioSrc: "/audio/audio4.mp3", imgSrc: "/images/img4.jpg" },
    { id: 5, name: "書",   audioSrc: "/audio/audio5.mp3", imgSrc: "/images/img5.jpg" }, { id: 6, name: "帽子", audioSrc: "/audio/audio6.mp3", imgSrc: "/images/img6.jpg" },
];
const COMMAND_ACTION_OPTIONS_DATA = [
    { text: "坐下", imgSrc: "/images/actions_q10/sit_down.jpg" }, { text: "睡覺", imgSrc: "/images/actions_q10/sleeping.jpg" }, { text: "跑步", imgSrc: "/images/actions_q10/running.jpg" }
];
const taiwaneseCitiesAndCounties = [
    "台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "基隆市", "新竹市", "嘉義市",
    "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣", "嘉義縣", "屏東縣", "宜蘭縣", "花蓮縣", "台東縣",
    "澎湖縣", "金門縣", "連江縣"
];

const MMSEPage = ({ email }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        gender: "", age: "", education: "",
        med_depression: "", med_sleep: "", med_attention: "",
        mmse: {
            year: "", month: "", date: "", weekday: "", season: "",
            country: "", city: "", mode: "",
            sub1: "", sub2: "", sub3: "", sub4: "", sub5: "",
            naming_selections: {}, sentence_order: "",
            action_row0: "", action_row1: "", action_row2: "",
            fill_sentence: "", follow_command_action: "", follow_command_choice: "",
            overlap_choice: "",
        },
    });

    const formDataRef = useRef(formData);
    useEffect(() => { formDataRef.current = formData; }, [formData]);

    const backendBaseUrl = "http://163.15.172.187:8000";

    const [actionRows, setActionRows] = useState(ACTION_ROWS_DATA); 
    const [commandDone, setCommandDone] = useState(false);
    const [wordsToRecall, setWordsToRecall] = useState([]);
    const [recallOptions, setRecallOptions] = useState([]);
    const commandActionOptions = COMMAND_ACTION_OPTIONS_DATA; 
    const [namingTargets, setNamingTargets] = useState([]); 
    const [displayedNamingItems, setDisplayedNamingItems] = useState([]); 

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 12;
    const [isLocating, setIsLocating] = useState(true);
    const [ipLocationData, setIpLocationData] = useState({
        ipCountry: null, ipCity: null, queryIp: null, error: null,
        rawCountry: null, rawCity: null,
    });
    
    useEffect(() => {
        const safeAllWords = Array.isArray(ALL_WORDS) ? ALL_WORDS : [];
        const shuffledWords = shuffleArray([...safeAllWords]);
        setWordsToRecall(shuffledWords.slice(0, 3));
        setRecallOptions(shuffleArray([...safeAllWords]));

        const allNamingItemsCopy = [...ALL_NAMING_ITEMS];
        setNamingTargets(shuffleArray(allNamingItemsCopy).slice(0, 2)); 
        setDisplayedNamingItems(allNamingItemsCopy); 
    }, []);

    const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    
    const handleMMSEChange = (q, value) => {
      setFormData(prev => {
          const newMMSEState = { ...prev.mmse, [q]: value };
          if (q === "country" && value !== "台灣") {
              newMMSEState.city = "";
          }
          return { ...prev, mmse: newMMSEState };
      });
    };

    useEffect(() => {
        if (currentStep === 3 && !ipLocationData.queryIp && !ipLocationData.error) {
            const fetchLocation = async () => {
                setIsLocating(true);
                try {
                    const response = await axios.get(`${backendBaseUrl}/api/get_location_from_ip`);
                    const { country, city, query_ip, error: apiError, raw_country, raw_city } = response.data;
                    setIpLocationData({
                        ipCountry: country || null, ipCity: city || null, queryIp: query_ip || "unknown",
                        error: apiError || null, rawCountry: raw_country || null, rawCity: raw_city || null,
                    });
                } catch (error) {
                    const errorMessage = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message;
                    setIpLocationData(prev => ({ ...prev, error: `獲取位置失敗: ${errorMessage}`, queryIp: "error_occurred" }));
                } finally {
                    setIsLocating(false);
                }
            };
            fetchLocation();
        } else if (currentStep === 3 && (ipLocationData.queryIp || ipLocationData.error)) {
             if (isLocating) setIsLocating(false);
        } else if (currentStep !== 3 && isLocating) {
            setIsLocating(false);
        }
    }, [currentStep, backendBaseUrl, ipLocationData.queryIp, ipLocationData.error]);
    
    const handleNextStep = () => {
        const currentMMSEData = formDataRef.current.mmse;
        if (currentStep === 1 && (!formDataRef.current.gender || !formDataRef.current.age || !formDataRef.current.education || !formDataRef.current.med_depression || !formDataRef.current.med_sleep || !formDataRef.current.med_attention)) {
            alert("請完整填寫基本資料及藥物服用情況！"); return;
        }
        if (currentStep === 3) {
            if (!currentMMSEData.country) {
                alert("請選擇您所在的國家。"); return;
            }
            if (currentMMSEData.country === "台灣" && ipLocationData.ipCountry === "台灣" && !currentMMSEData.city) {
                 alert("請選擇您所在的城市/縣市。"); return;
            }
            if (!currentMMSEData.mode) {
                alert("請選擇測驗方式。"); return;
            }
        }
        if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
        else handleSubmit();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrevStep = () => {
      if (currentStep > 1) setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const gradeMMSE = (answers, currentWordsToRecallFromState, namingTargetsFromState, ipData) => {
        const currentIpCountry = ipData.ipCountry;
        const currentIpCity = ipData.ipCity;
        const now = new Date();
        let total = 0;
        const details = [];
        const correctBase = {
            year: String(now.getFullYear()), month: String(now.getMonth() + 1), date: String(now.getDate()),
            weekday: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][now.getDay()],
            season: (() => { const m = now.getMonth() + 1; if (m >= 3 && m <= 5) return "春天"; if (m >= 6 && m <= 8) return "夏天"; if (m >= 9 && m <= 11) return "秋天"; return "冬天"; })(),
            subtraction: ["93", "86", "79", "72", "65"], sentence_order: "一隻老狗在陽光下散步",
            fill_sentence: "吃了早餐", follow_command_choice: "跑步", overlap_choice: "選項4",
        };
        ["year", "month", "date", "weekday", "season"].forEach(k => {
            if (String(answers[k] || "").trim() === correctBase[k]) total++;
            else details.push(`① 時間定向 - ${k} 錯誤 (選: ${answers[k] || 'N/A'}, 正: ${correctBase[k]})`);
        });
        let locCorrectCount = 0; const locErrs = []; let countryOk=false, cityOk=false, modeOk=false;
        if (answers.country && String(answers.country).trim()) {
            if (currentIpCountry) {
                if (String(answers.country).trim() === String(currentIpCountry).trim()) countryOk=true;
                else locErrs.push(`國家選擇與IP偵測不符 (您選: ${answers.country}, IP偵測: ${currentIpCountry})`);
            } else { countryOk=true; }
        } else locErrs.push("國家未選擇");
        if (currentIpCountry === "台灣") {
            if (answers.city && String(answers.city).trim()) {
                if (currentIpCity) {
                    if (String(answers.city).trim() === String(currentIpCity).trim()) cityOk=true;
                    else locErrs.push(`城市選擇與IP偵測不符 (您選: ${answers.city}, IP偵測: ${currentIpCity})`);
                } else { cityOk=true; }
            } else locErrs.push("城市/縣市未選擇 (IP偵測為台灣時需選擇)");
        } else { cityOk=true; }
        if (answers.mode && String(answers.mode).trim()) modeOk=true;
        else locErrs.push("測驗方式未選擇");
        if(countryOk) locCorrectCount++; 
        if(cityOk) locCorrectCount++; 
        if(modeOk) locCorrectCount++;
        const currentOrientationScore = locCorrectCount === 3 ? 5 : locCorrectCount;
        total += currentOrientationScore;
        if (locCorrectCount < 3 && locErrs.length > 0) {
            details.push(`② 地點定向 - 錯誤: ${locErrs.join('; ')}。此項得分: ${currentOrientationScore}`);
        }
        for (let i=0; i<5; i++) {
            if (String(answers[`sub${i+1}`]||"").trim() === correctBase.subtraction[i]) total++;
            else details.push(`④ 計算-第${i+1}次減法錯 (預:${correctBase.subtraction[i]}, 選:${answers[`sub${i+1}`]||'N/A'})`);
        }
        let recallPts = 0; const recalledOkNames = [];
        if (Array.isArray(currentWordsToRecallFromState) && currentWordsToRecallFromState.length > 0) {
            currentWordsToRecallFromState.forEach(w => { if (answers[`image_memory_${w.id}`]===true) { recallPts+=1; recalledOkNames.push(w.name);}}); // 注意: MMSE標準計分通常是每對一個詞得1分
            total += recallPts;
            if (recalledOkNames.length < currentWordsToRecallFromState.length) {
                const missed = currentWordsToRecallFromState.filter(w => !recalledOkNames.includes(w.name)).map(w => w.name).join(', ') || '無';
                details.push(`⑤ 回憶-未全對(應:${currentWordsToRecallFromState.length},對:${recalledOkNames.length},漏:${missed}) 得:${recallPts}`);
            }
        } else details.push("⑤ 回憶-目標詞列表錯");
        let namePts = 0;
        if (namingTargetsFromState && namingTargetsFromState.length === 2) {
            const userNamingSelections = answers.naming_selections || {};
            namingTargetsFromState.forEach(t => { if (userNamingSelections[t.id]===true) namePts++; else details.push(`⑥ 命名-未選對:${t.name}`);});
            total += namePts;
        }
        if (String(answers.sentence_order||"").trim() === correctBase.sentence_order) total++; else details.push(`⑦ 重複-句錯(選:"${answers.sentence_order||'N/A'}",正:"${correctBase.sentence_order}")`);
        const correctActs = ["拿起紙張","對折紙張","放在膝上"]; 
        correctActs.forEach((act,i)=>{ if(String(answers[`action_row${i}`]||"").trim()===act)total++; else details.push(`⑧ 理解與執行-指令${i+1}錯(預:${act},選:${answers[`action_row${i}`]||'N/A'})`);});
        if (String(answers.fill_sentence||"").trim() === correctBase.fill_sentence) total++; else details.push(`⑨ 書寫-句錯(選:"${answers.fill_sentence||'N/A'}",正:"${correctBase.fill_sentence}")`);
        if (String(answers.follow_command_choice||"").trim() === correctBase.follow_command_choice) total++; else details.push(`⑩ 指令卡-選錯(選:"${answers.follow_command_choice||'N/A'}",正:"${correctBase.follow_command_choice}")`);
        if (String(answers.overlap_choice||"").trim() === correctBase.overlap_choice) total++; else details.push(`⑪ 視覺空間-圖錯(選:"${answers.overlap_choice||'N/A'}",正:"${correctBase.overlap_choice}")`);
        return { total, details };
    };

    const handleSubmit = async () => {
        const currentFormData = formDataRef.current;
        if (!currentFormData.gender || !currentFormData.age || !currentFormData.education || !currentFormData.med_depression || !currentFormData.med_sleep || !currentFormData.med_attention) {
            alert("錯誤：基本資料或藥物服用情況未完整填寫，無法提交。請返回步驟1檢查。");
            setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
        }
        const mmseResultsObject = gradeMMSE(currentFormData.mmse, wordsToRecall, namingTargets, ipLocationData);
        try {
            const dataToSubmit = {
                email: email || localStorage.getItem("userEmail") || null,
                gender: currentFormData.gender, age: currentFormData.age, education: currentFormData.education,
                med_depression: currentFormData.med_depression, med_sleep: currentFormData.med_sleep, med_attention: currentFormData.med_attention,
                mmse_score: mmseResultsObject.total, mmse_details: mmseResultsObject.details, 
                user_selected_country: currentFormData.mmse.country, user_selected_city: currentFormData.mmse.city,
                ip_detected_country: ipLocationData.ipCountry, ip_detected_city: ipLocationData.ipCity,
                queried_ip_address: ipLocationData.queryIp, ip_location_raw_country: ipLocationData.rawCountry,
                ip_location_raw_city: ipLocationData.rawCity, ip_location_error: ipLocationData.error,
                naming_task_correct_ids: namingTargets.map(t => t.id)
            };
            const response = await axios.post(`${backendBaseUrl}/api/submit_mmse_session`, dataToSubmit);
            if (response.data && typeof response.data.session_id === 'number') {
                localStorage.setItem("current_session_id", String(response.data.session_id));
                const userEmailKey = email || localStorage.getItem("userEmail");
                const mmseStorageKey = userEmailKey ? `mmse_result_${userEmailKey}` : 'mmse_result_guest';
                const resultToStore = {
                    score: mmseResultsObject.total, date: new Date().toISOString(), details: mmseResultsObject.details, 
                    userSelectedLocation: { country: currentFormData.mmse.country, city: currentFormData.mmse.city },
                    ipDetectedLocation: { country: ipLocationData.ipCountry, city: ipLocationData.ipCity }
                };
                localStorage.setItem(mmseStorageKey, JSON.stringify(resultToStore));
                navigate("/mmse-results");
            } else { alert("提交MMSE結果時發生錯誤，後端未返回有效的 session_id。"); }
        } catch (e) {
            const errorMsg = e.response?.data?.detail || JSON.stringify(e.response?.data) || e.message;
            alert(`提交MMSE結果失敗：${errorMsg}。`);
        }
    };

    const generateOptions = (field) => {
        switch (field) {
            case 'year': return Array.from({length:5},(_,i)=>new Date().getFullYear()-2+i);
            case 'month': return Array.from({length:12},(_,i)=>i+1);
            case 'date': return Array.from({length:31},(_,i)=>i+1);
            case 'weekday': return ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
            case 'season': return [{label:'春天',value:'春天',hint:'3-5月'},{label:'夏天',value:'夏天',hint:'6-8月'},{label:'秋天',value:'秋天',hint:'9-11月'},{label:'冬天',value:'冬天',hint:'12-2月'}];
            default: return [];
        }
    };

    const renderStepContent = () => {
        const countryOptions = ["台灣", "美國", "日本", "中國"];
        const modeOptions = ["網路", "紙筆"];
        const q1DateFields = ['year', 'month', 'date', 'weekday', 'season'];
        const q4Steps = [1, 2, 3, 4, 5];
        const q7SentenceOrderOptions = ["在陽光下一隻老狗散步", "一隻老狗在陽光下散步", "老狗一隻散步在陽光下", "陽光下有一隻狗老在散步"];
        const q9FillSentenceOptions = ["吃了早餐", "不要", "蘋果", "睡"];
        const q11OverlapImgOptions = [1, 2, 3, 4];
        const basicInfoGenderOptions = ["男", "女", ];
        const basicInfoEducationOptions = ["未受教育", "小學", "國中", "高中/職", "大專/大學", "研究所以上"];
        const yesNoOptions = ["是", "否", "不確定"];

        const fieldsetStyles = { marginBottom: "30px", padding: "20px 25px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" };
        const legendStyles = { fontWeight: "bold", padding: "0 10px", fontSize: "20px", color: "#333" };
        const questionLabelStyles = { display: 'block', marginBottom: '10px', fontSize: '17px', fontWeight: '500', color: '#444' };
        const optionLabelStyles = { marginRight: "25px", fontSize: '17px', cursor: 'pointer' };
        const imageOptionLabelStyles = { display: "inline-flex", flexDirection: "column", alignItems: "center", padding: "15px", border: "1px solid #ddd", borderRadius: "6px", minWidth: "160px", cursor: "pointer", fontSize: "17px", backgroundColor: "#fff", transition: "all 0.2s ease" };
        const selectedImageOptionLabelStyles = { ...imageOptionLabelStyles, borderColor: "#007bff", boxShadow: "0 0 0 2px rgba(0,123,255,.25)" };
        const selectStyles = { padding: "10px", fontSize: '17px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '220px', backgroundColor: 'white' };
        
        const stepInstructionStyles = {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#34495e',
            backgroundColor: '#ecf0f1',
            padding: '15px 20px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '30px',
            border: '1px solid #bdc3c7',
            lineHeight: '1.6'
        };

        const safeMap = (arr, callback) => Array.isArray(arr) && arr.length > 0 ? arr.map(callback) : null;
        
        const isCitySelectionDisabled = isLocating || (ipLocationData.queryIp && ipLocationData.ipCountry && ipLocationData.ipCountry !== "台灣") || !ipLocationData.queryIp || !!ipLocationData.error;
        const citySelectorEffectiveStyle = isCitySelectionDisabled ? { ...selectStyles, backgroundColor: '#e9ecef', cursor: 'not-allowed' } : selectStyles;

        switch (currentStep) {
            case 1: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>基本資料({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>請您協助填寫基本資料及藥物服用情況。</div>
                <div style={{ marginBottom: "20px" }}><label style={{ ...questionLabelStyles, minWidth: "180px", display: "inline-block" }}>性別：</label>{safeMap(basicInfoGenderOptions, g => (<label key={g} style={optionLabelStyles}><input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={() => handleChange("gender", g)} required /> {g}</label>))}</div>
                <div style={{ marginBottom: "20px" }}><label htmlFor="ageSelect" style={{ ...questionLabelStyles, minWidth: "180px", display: "inline-block" }}>年齡區間：</label><select id="ageSelect" value={formData.age} onChange={e => handleChange("age", e.target.value)} required style={selectStyles}><option value="">請選擇</option><option value="20歲以下">20歲以下</option>{Array.from({ length: 14 }, (_, i) => { const m = 20 + i * 5; const x = m + 4; const l = i === 13 ? "85歲以上" : `${m}-${x}歲`; return <option key={l} value={l}>{l}</option>; })}</select></div>
                <div style={{ marginBottom: "20px" }}><label style={{ ...questionLabelStyles, minWidth: "180px", display: "inline-block" }}>教育程度：</label>{safeMap(basicInfoEducationOptions, e => (<label key={e} style={optionLabelStyles}><input type="radio" name="education" value={e} checked={formData.education === e} onChange={() => handleChange("education", e)} required /> {e}</label>))}</div>
                <div style={{ marginTop: "25px", paddingTop: "20px", borderTop: "1px dashed #ccc" }}><p style={{ fontWeight: "bold", marginBottom: "15px", fontSize: '18px' }}>藥物服用情況：</p>
                    {[['med_depression', '憂鬱'], ['med_sleep', '睡眠'], ['med_attention', '注意力']].map(([f, n]) => (<div key={f} style={{ marginBottom: "15px", display: 'flex', alignItems: 'center' }}><label style={{ ...questionLabelStyles, minWidth: "250px", display: "inline-block" }}>是否有服用{n}相關藥物?</label>{safeMap(yesNoOptions, v => (<label key={`${f}-${v}`} style={optionLabelStyles}><input type="radio" name={f} value={v} checked={formData[f] === v} onChange={() => handleChange(f, v)} required />{v}</label>))}</div>))}
                </div></fieldset>);
            case 2: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>① 時間定向({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>請問今天的日期是？</div>
                {safeMap(q1DateFields, (f) => { const opts = generateOptions(f); if (!Array.isArray(opts)) return <p key={f} style={{ color: "red" }}>Err:{f}</p>; return (<div key={f} style={{ marginBottom: "15px", display: 'flex', alignItems: 'center', gap: '10px' }}><label htmlFor={`s-${f}`} style={{ minWidth: '90px', textAlign: 'right', fontSize: '17px', fontWeight: '500' }}>{f === 'year' ? '年份' : f === 'month' ? '月份' : f === 'date' ? '日期' : f === 'weekday' ? '星期幾' : '季節'}：</label><select id={`s-${f}`} value={formData.mmse[f] || ""} onChange={e => handleMMSEChange(f, e.target.value)} required style={{ ...selectStyles, minWidth: "200px", flexGrow: 1 }}><option value="">請選擇</option>{safeMap(opts, (op, j) => typeof op === 'object' ? (<option key={j} value={op.value} title={op.hint}>{op.label}{op.hint ? `(${op.hint})` : ''}</option>) : (<option key={j} value={op}>{op}</option>))}</select></div>); })}</fieldset>);
            case 3: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}> ② 地點定向({currentStep}/{totalSteps})
                {isLocating && <span style={{ marginLeft: '15px', fontSize: '16px', color: '#007bff', fontWeight: 'normal' }}>🌍 正在獲取您的IP位置資訊...</span>}
                {ipLocationData.error && !isLocating && (<span style={{ marginLeft: '15px', fontSize: '14px', color: 'red', fontWeight: 'normal' }}>✗ IP位置資訊獲取失敗。</span>)}
            </legend>
                <div style={stepInstructionStyles}>請問您現在所在的地點是？</div>
                <div style={{ marginBottom: "20px" }}><label style={questionLabelStyles}>Q. 本測驗進行於哪一國？ <span style={{ color: 'red' }}>*</span></label>{safeMap(countryOptions, (c) => (<label key={c} style={optionLabelStyles}><input type="radio" name="country" value={c} checked={formData.mmse.country === c} onChange={(e) => handleMMSEChange("country", e.target.value)} disabled={isLocating} /> {c}</label>))}</div>
                <div style={{ marginBottom: "20px" }}><label htmlFor="citySelect" style={questionLabelStyles}>Q. 您目前所在城市/縣市？{formData.mmse.country === "台灣" && ipLocationData.ipCountry === "台灣" && <span style={{ color: 'red' }}>*</span>}{isCitySelectionDisabled && ipLocationData.ipCountry && ipLocationData.ipCountry !== "台灣" && <span style={{ fontSize: '0.9em', color: '#6c757d', marginLeft: '10px' }}>(IP偵測非台灣地區，無需選擇城市)</span>}</label><select id="citySelect" value={formData.mmse.city || ""} onChange={(e) => handleMMSEChange("city", e.target.value)} style={citySelectorEffectiveStyle} disabled={isCitySelectionDisabled || formData.mmse.country !== "台灣"} required={formData.mmse.country === "台灣" && ipLocationData.ipCountry === "台灣" && !isCitySelectionDisabled}><option value="">{isCitySelectionDisabled || formData.mmse.country !== "台灣" ? "無需選擇" : "請選擇城市/縣市"}</option>{formData.mmse.country === "台灣" && !isCitySelectionDisabled && safeMap(taiwaneseCitiesAndCounties, (city) => (<option key={city} value={city}>{city}</option>))}</select></div>
                <div style={{ marginBottom: "20px" }}><label style={questionLabelStyles}>Q. 測驗進行方式？ <span style={{ color: 'red' }}>*</span></label>{safeMap(modeOptions, (mode) => (<label key={mode} style={optionLabelStyles}><input type="radio" name="mode" value={mode} checked={formData.mmse.mode === mode} onChange={(e) => handleMMSEChange("mode", e.target.value)} disabled={isLocating} /> {mode}</label>))}</div>
            </fieldset>);
            case 4: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>③ 記憶({currentStep}/{totalSteps})</legend>
            <p style={{ 
                ...questionLabelStyles, 
                fontSize: '35px', // 將主要指示文字放大
                textAlign: 'center', 
                marginBottom: '25px' 
            }}>
                請記住接下來播放的三個詞
                <br />
                <span style={{ 
                    color: '#6c757d', 
                    fontWeight: 'normal', 
                    fontSize: '17px', // 將輔助提示文字也放大
                    marginTop: '8px', // 稍微增加間距
                    display: 'inline-block'
                }}>
                    (請點擊每個詞語旁的「▶」播放按鈕以聆聽發音)
                </span>
            </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '15px' }}>{safeMap(wordsToRecall, (w, i) => (<div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ fontSize: '17px', fontWeight: '500', minWidth: '60px' }}>詞語{i + 1}:</span><audio controls src={w.audioSrc} preload="auto" style={{ width: "100%" }}></audio></div>))}</div></fieldset>);
            case 5: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>④ 計算({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>從100開始，每次減7，請連續作答五次：</div>
                {safeMap(q4Steps, s => (<div key={s} style={{ marginBottom: "15px", display: 'flex', alignItems: 'center', gap: '10px' }}><label htmlFor={`sub${s}`} style={{ width: '100px', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '17px', fontWeight: '500' }}>第{s}次：</label><input id={`sub${s}`} type="number" value={formData.mmse[`sub${s}`] || ""} onChange={e => handleMMSEChange(`sub${s}`, e.target.value)} style={{ padding: "10px", width: "150px", fontSize: '17px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>))}</fieldset>);
            case 6: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>⑤ 回憶({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>請選出先前聲音播放題，您記住的三個詞 (最多選三張)：</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px', justifyContent: 'center' }}>{safeMap(recallOptions, w => { const sel = !!formData.mmse[`image_memory_${w.id}`]; return (<label key={w.id} style={sel ? selectedImageOptionLabelStyles : imageOptionLabelStyles}><img src={w.imgSrc} alt={w.name} style={{ width: 200, height: 200, objectFit: 'contain', marginBottom: 10, borderRadius: '4px' }} onError={e => { e.target.alt = `Img ${w.name} Err`; e.target.src = ''; }} /><div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}><input type="checkbox" name={`img_mem_${w.id}`} checked={sel} onChange={e => { const chk = e.target.checked; const cnt = Object.keys(formData.mmse).filter(k => k.startsWith("image_memory_") && formData.mmse[k]).length; if (chk && cnt >= 3 && !formData.mmse[`image_memory_${w.id}`]) alert("最多選三個詞！"); else handleMMSEChange(`image_memory_${w.id}`, chk); }} /><span>{w.name}</span></div></label>) })}</div></fieldset>);
            case 7: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>⑥ 命名({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>{`請從下方圖片中，選出代表「${namingTargets[0]?.name || ''}」與「${namingTargets[1]?.name || ''}」的兩張圖：`}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px', justifyContent: 'center' }}>{safeMap(displayedNamingItems, (it, idx) => { const sel = !!(formData.mmse.naming_selections && formData.mmse.naming_selections[it.id]); return (<label key={it.id} style={sel ? selectedImageOptionLabelStyles : imageOptionLabelStyles}><img src={it.imgSrc} alt={it.name} style={{ width: 200, height: 200, objectFit: 'contain', marginBottom: 10, borderRadius: '4px' }} onError={e => { e.target.alt = `Img ${it.name} Fail`; e.target.src = ''; }} /><div style={{ display: 'flex', alignItems: 'center', marginTop: '5px', justifyContent: 'center' }}><input type="checkbox" checked={sel} onChange={e => { const chk = e.target.checked; const sels = { ...(formData.mmse.naming_selections || {}) }; const selIds = Object.keys(sels).filter(k => sels[k]); if (chk && selIds.length >= 2 && !sels[it.id]) { alert("最多選兩項"); return; } sels[it.id] = chk; handleMMSEChange("naming_selections", sels); }} /><span style={{ marginLeft: '8px' }}>選項{idx + 1}</span></div></label>); })}</div></fieldset>);
            case 8: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>⑦ 重複({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>請先聆聽下方的音檔，然後選出與音檔內容完全相同的句子：<span style={{ 
                    color: '#6c757d', 
                    fontWeight: 'normal', 
                    fontSize: '20px', 
                    marginTop: '5px',
                    display: 'inline-block'
                }}></span></div>
                <audio controls src="/audio/sentence1.mp3" preload="auto" style={{ display: 'block', margin: '15px auto 25px auto', width: "100%" }}></audio><div style={{ marginTop: "10px", display: 'flex', flexDirection: 'column', gap: '10px' }}>{safeMap(q7SentenceOrderOptions, (o, i) => (<label key={i} style={{ display: "block", padding: "12px 15px", fontSize: '17px', border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer', backgroundColor: formData.mmse.sentence_order === o ? '#e0f3ff' : '#fff' }}><input type="radio" name="sentence_order" value={o} checked={formData.mmse.sentence_order === o} onChange={() => handleMMSEChange("sentence_order", o)} /> {o}</label>))}</div></fieldset>);
            case 9: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>⑧ 理解與執行({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>請依撥放語音，依序點選三個提示的動作：                <br />
                <span style={{ 
                    color: '#6c757d', 
                    fontWeight: 'normal', 
                    fontSize: '20px', 
                    marginTop: '5px',
                    display: 'inline-block'
                }}>
                    (請點擊下方的「▶」播放按鈕以聆聽指令)
                </span></div>
                <audio controls src="/audio/action_instruction.mp3" preload="auto" style={{ display: 'block', margin: '15px auto 25px auto', width: "100%" }}></audio>
                {safeMap(actionRows, (r, rIdx) => (<div key={rIdx} style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "25px", paddingBottom: rIdx < actionRows.length - 1 ? "20px" : "0", borderBottom: rIdx < actionRows.length - 1 ? "1px dashed #ddd" : "none" }}><div style={{ width: "40px", textAlign: "center", fontSize: "28px", flexShrink: 0, color: '#555' }}>{["1️⃣", "2️⃣", "3️⃣"][rIdx]}</div><div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: 'center' }}>{safeMap(r, aItm => { const sel = formData.mmse[`action_row${rIdx}`] === aItm.text; return (<label key={aItm.text} style={sel ? selectedImageOptionLabelStyles : imageOptionLabelStyles} className="custom-radio"><input type="radio" name={`action_row${rIdx}`} value={aItm.text} checked={sel} onChange={() => handleMMSEChange(`action_row${rIdx}`, aItm.text)} /><span className="radio-visual"></span><img src={aItm.imgSrc} alt={aItm.text} style={{ width: "180px", height: "180px", objectFit: "contain", borderRadius: '4px', marginTop: '5px' }} onError={e => { e.target.style.display = 'none'; }} /></label>) })}</div></div>))}</fieldset>);
            case 10: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>⑨ 書寫({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>請選出一個最適合的詞語，讓句子「我今天_____。」變得通順且完整：</div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '15px', justifyContent: 'center' }}> {safeMap(q9FillSentenceOptions, (opt, idx) => (<label key={idx} style={{ padding: "10px 15px", cursor: "pointer", fontSize: '17px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: formData.mmse.fill_sentence === opt ? '#e0f3ff' : '#fff' }}> <input type="radio" name="fill_sentence" value={opt} checked={formData.mmse.fill_sentence === opt} onChange={() => handleMMSEChange("fill_sentence", opt)} /> {opt} </label>))}</div></fieldset>);
            case 11: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>⑩ 指令卡({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>請閱讀指令卡上的文字，並依照指令完成動作：</div>
                <div style={{ border: "2px solid #333", padding: "30px", margin: "20px auto", fontSize: "22px", fontWeight: "bold", textAlign: "center", maxWidth: "90%", lineHeight: "1.6", backgroundColor: '#fff', borderRadius: '6px' }}>請閱讀完畢後，按下「我已閱讀指令並完成動作」按鈕，然後從下方圖片中選取「跑步」的動作。</div>
                <button onClick={() => { handleMMSEChange("follow_command_action", "已完成"); setCommandDone(true); }} disabled={commandDone || !!formData.mmse.follow_command_action} style={{ padding: "12px 20px", marginRight: "10px", cursor: (commandDone || !!formData.mmse.follow_command_action) ? "default" : "pointer", backgroundColor: (commandDone || !!formData.mmse.follow_command_action) ? "#d4edda" : "#007bff", color: (commandDone || !!formData.mmse.follow_command_action) ? "#155724" : "white", border: "none", borderRadius: "5px", fontSize: '17px', fontWeight: '500' }}>{(commandDone || !!formData.mmse.follow_command_action) ? "✅ 我已閱讀指令" : "我已閱讀指令並完成動作"}</button>
                {(commandDone || !!formData.mmse.follow_command_action) && (<>
                    <p style={{ marginTop: "30px", fontWeight: "bold", fontSize: "18px" }}>指令卡指令是要您選取下列哪個動作？</p>
                    <div style={{ display: 'flex', justifyContent: 'space-around', gap: '20px', flexWrap: 'wrap', marginTop: '15px' }}>{safeMap(commandActionOptions, itm => { const sel = formData.mmse.follow_command_choice === itm.text; return (<label key={itm.text} style={sel ? selectedImageOptionLabelStyles : imageOptionLabelStyles} className="custom-radio"><input type="radio" name="follow_command_choice" value={itm.text} checked={sel} onChange={() => handleMMSEChange("follow_command_choice", itm.text)} /><span className="radio-visual"></span><img src={itm.imgSrc} alt={itm.text} style={{ width: "18px", height: "180px", objectFit: "contain", borderRadius: '4px', marginTop: '5px' }} onError={e => { e.target.style.display = 'none'; }} /></label>) })}</div></>)}</fieldset>);
            case 12: return (<fieldset style={fieldsetStyles}><legend style={legendStyles}>⑪ 視覺空間({currentStep}/{totalSteps})</legend>
                <div style={stepInstructionStyles}>請選出代表「兩個交疊的五邊形」的圖案：</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px', justifyContent: 'center' }}>{safeMap(q11OverlapImgOptions, i => { const sel = formData.mmse.overlap_choice === `選項${i}`; return (<label key={`overlap-${i}`} style={sel ? selectedImageOptionLabelStyles : imageOptionLabelStyles}><img src={`/images/overlap${i}.jpg`} alt={`選項${i}`} style={{ width: 150, height: 120, objectFit: 'contain', marginBottom: 10, borderRadius: '4px' }} onError={e => { e.target.alt = `OptImg ${i} Err`; e.target.src = ''; }} /><div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}><input type="radio" name="overlap_choice" value={`選項${i}`} checked={sel} onChange={() => handleMMSEChange("overlap_choice", `選項${i}`)} /><span>選項 {i}</span></div></label>) })}</div></fieldset>);
            default: return <p>頁面載入中或發生未知錯誤。</p>;
        }
    };

    return ( 
        <div style={{ padding: "30px 50px", maxWidth: 950, margin: "40px auto", fontFamily: "'Noto Sans TC', Arial, sans-serif", backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <h2 style={{ textAlign: "center", marginBottom: "40px", color: "#2c3e50", fontSize: "28px", fontWeight: 600, borderBottom: '2px solid #3498db', paddingBottom: '15px' }}>🧠 MMSE 測驗</h2>
            {renderStepContent()}
             <div style={{ marginTop: "50px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                {currentStep > 1 ? (<button onClick={handlePrevStep} style={{ padding: "15px 30px", backgroundColor: "#7f8c8d", color: "white", border: "none", borderRadius: "6px", fontSize: "18px", cursor: "pointer", fontWeight: 500 }}>⬅️ 上一題</button>) : (<div style={{flexGrow:1}}/>)}
                <button onClick={handleNextStep} style={{ padding: "15px 30px", backgroundColor: currentStep === totalSteps ? "#2ecc71" : "#3498db", color: "white", border: "none", borderRadius: "6px", fontSize: "18px", cursor: "pointer", fontWeight: 500 }}>{currentStep === totalSteps ? "完成MMSE，查看結果 ➡️" : "下一題 ➡️"}</button>
            </div>
             <div style={{ textAlign: "center", marginTop: "30px", paddingBottom: "20px" }}>
                <button onClick={() => navigate("/")} style={{ padding: "12px 25px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "6px", fontSize: "17px", cursor: "pointer", fontWeight: 500 }}>返回首頁 🏠</button>
            </div>
        </div>
    );
};
export default MMSEPage;
// --- END OF FILE MMSEPage.js (MODIFIED FOR IP-BASED LOCATION SCORING AND UI) ---
