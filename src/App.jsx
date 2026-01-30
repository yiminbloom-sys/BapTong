import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, deleteDoc, writeBatch, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { 
  Volume2, CheckCircle, XCircle, RefreshCcw, ArrowRight, 
  Trophy, BookOpen, Settings, Trash2, 
  Download, Upload, ChevronLeft, Star, MessageSquare, Send, Sparkles, Bot,
  Keyboard, Flame, X, Globe, Mic, Headphones, Crown, User, Utensils, LogOut, Mail, Lock
} from 'lucide-react';

// --- Firebase 配置 ---
const firebaseConfig = { apiKey: "AIzaSyBRmpEYh52O6wXv-_mLNj9avBIheENU2SI",
  authDomain: "gen-lang-client-0673508413.firebaseapp.com",
  projectId: "gen-lang-client-0673508413",
  storageBucket: "gen-lang-client-0673508413.firebasestorage.app",
  messagingSenderId: "337365162204",
  appId: "1:337365162204:web:81b8cf0a66d83a37febc19",
  measurementId: "G-48BMT0W1LL" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'korean-dictation-v9';

// --- 等级系统配置 ---
const LEVEL_SYSTEM = [
  { max: 100, name: '떡볶이', label: 'Tteokbokki' },        // Lv.1
  { max: 300, name: '냉면', label: 'Naengmyeon' },          // Lv.2
  { max: 500, name: '소바', label: 'Soba' },                // Lv.3
  { max: 800, name: '돈까스', label: 'Tonkatsu' },          // Lv.4
  { max: 1100, name: '비빔밥', label: 'Bibimbap' },         // Lv.5
  { max: 1500, name: '낙지덮밥', label: 'Nakji-deopbap' },  // Lv.6
  { max: 1900, name: '닭갈비', label: 'Dakgalbi' },         // Lv.7
  { max: 2300, name: '찜닭', label: 'Jjimdak' },            // Lv.8
  { max: 2600, name: '닭볶음탕', label: 'Dakbokkeumtang' }, // Lv.9
  { max: 3000, name: '팟타이', label: 'Pad Thai' },         // Lv.10
  { max: 4000, name: '갈비찜', label: 'Galbijjim' },        // Lv.11
  { max: 99999, name: '김치등갈비', label: 'Kimchi Ribs' }  // Lv.12
];

// --- 音效配置 (可替换 URL) ---
const SOUND_URLS = {
  correct: null, 
  incorrect: null 
};

// --- 初始示例词库 ---
const DEFAULT_WORDS = [
  { id: '1', hangul: '가게', meaning: '商店', level: 1, example_kr: '가게에 가서 빵을 샀어요.', example_cn: '去商店买了面包。' },
  { id: '2', hangul: '가격', meaning: '价格', level: 1, example_kr: '가격이 너무 비싸요.', example_cn: '价格太贵了。' },
  { id: '3', hangul: '강아지', meaning: '小狗', level: 1, example_kr: '우리 집 강아지는 귀여워요.', example_cn: '我家的小狗很可爱。' },
  { id: '4', hangul: '학교', meaning: '学校', level: 1, example_kr: '저는 학교에서 한국어를 배워요.', example_cn: '我在学校学韩语。' },
  { id: '5', hangul: '친구', meaning: '朋友', level: 1, example_kr: '주말에 친구를 만날 거예요.', example_cn: '周末我要见朋友。' },
  { id: '6', hangul: '고민', meaning: '苦恼', level: 2, example_kr: '진로 문제로 고민이 많아요.', example_cn: '因为前途问题有很多苦恼。' },
  { id: '7', hangul: '분석', meaning: '分析', level: 5, example_kr: '데이터를 분석해서 결과를 냈어요.', example_cn: '分析数据得出了结果。' },
  { id: '8', hangul: '철학', meaning: '哲学', level: 6, example_kr: '그는 철학적인 질문을 던졌다.', example_cn: '他提出了哲学性的问题。' },
];

// --- 模拟好友数据 ---
const MOCK_FRIENDS = [
  { id: 'bot1', displayName: 'Jimin 🐥', streak: 15, wordsToday: 42, totalWords: 1250, avatar: 'bg-yellow-100 text-yellow-600' }, 
  { id: 'bot2', displayName: 'Lisa 🎤', streak: 8, wordsToday: 25, totalWords: 450, avatar: 'bg-pink-100 text-pink-600' },    
  { id: 'bot3', displayName: 'Minho ⚽️', streak: 3, wordsToday: 12, totalWords: 80, avatar: 'bg-blue-100 text-blue-600' },    
];

// --- 国际化字典 ---
const TRANSLATIONS = {
  'zh-CN': {
    title: '韩语听写 Pro',
    subtitle: 'AI 智能助教集成',
    selectLevel: '听写练习',
    speakingMode: '口语练习',
    mistakes: '错题本',
    import: '导入词库',
    settings: '系统设置',
    streak: '连胜挑战',
    totalWords: '累计单词',
    day: '天',
    wordUnit: '词',
    level: '级',
    mistakeMode: '错题强化',
    progress: '进度',
    meaning: '中文含义',
    inputPlaceholder: '输入韩语...',
    correct: '回答正确！',
    incorrect: '继续加油！',
    noExample: '暂无例句',
    next: '下一题',
    submit: '提交答案',
    aiTutor: 'Gemini 助教 (在线)',
    aiIntro: '关于这个词有什么不懂的吗？问我吧！',
    aiPlaceholder: '例如：请用敬语造个句...',
    mistakeCount: '待攻克',
    startReview: '开始复习',
    noMistakes: '目前没有错题，继续加油！',
    importDesc: '请粘贴 JSON 数组。建议包含 example_kr 和 example_cn。',
    confirmImport: '确认导入',
    resultTitle: '本次练习完成',
    backHome: '返回主页',
    settingsTitle: '设置',
    langSelect: '语言设置',
    voiceSelect: '语音选择',
    voiceMale: '男声 (Fenrir)',
    voiceFemale: '女声 (Kore)',
    dangerZone: '危险区域',
    clearData: '清空所有学习记录',
    clearConfirm: '确定要清空错题和连胜记录吗？此操作无法撤销。',
    cleared: '已清空！',
    loading: '加载中...',
    tapToSpeak: '点击说话',
    listening: '正在听...',
    speakError: '未识别到声音，请重试',
    speakCorrect: '发音准确！',
    speakRetry: '发音有误，再试一次',
    permissionDenied: '请允许麦克风权限',
    browserNotSupport: '当前浏览器不支持语音识别',
    readAloud: '请大声朗读：',
    leaderboard: '美食段位榜',
    wordsToday: '今日单词',
    nickname: '我的昵称',
    save: '保存',
    you: '你',
    rank: '排名',
    levelPrefix: 'Lv.',
    accountSync: '账号同步',
    loginDesc: '登录以在多设备间同步进度',
    email: '邮箱',
    password: '密码',
    login: '登录',
    register: '注册',
    logout: '退出登录',
    loggedInAs: '当前登录：',
    guestMode: '游客模式 (数据不互通)',
    authError: '认证失败: '
  },
  'zh-TW': {
    title: '韓語聽寫 Pro',
    subtitle: 'AI 智能助教集成',
    selectLevel: '聽寫練習',
    speakingMode: '口語練習',
    mistakes: '錯題本',
    import: '導入詞庫',
    settings: '系統設置',
    streak: '連勝挑戰',
    totalWords: '累計單詞',
    day: '天',
    wordUnit: '詞',
    level: '級',
    mistakeMode: '錯題強化',
    progress: '進度',
    meaning: '中文含義',
    inputPlaceholder: '輸入韓語...',
    correct: '回答正確！',
    incorrect: '繼續加油！',
    noExample: '暫無例句',
    next: '下一題',
    submit: '提交答案',
    aiTutor: 'Gemini 助教 (在線)',
    aiIntro: '關於這個詞有什麼不懂的嗎？問我吧！',
    aiPlaceholder: '例如：請用敬語造個句...',
    mistakeCount: '待攻克',
    startReview: '開始複習',
    noMistakes: '目前沒有錯題，繼續加油！',
    importDesc: '請粘貼 JSON 數組。建議包含 example_kr 和 example_cn。',
    confirmImport: '確認導入',
    resultTitle: '本次練習完成',
    backHome: '返回主頁',
    settingsTitle: '設置',
    langSelect: '語言設置',
    voiceSelect: '語音選擇',
    voiceMale: '男聲 (Fenrir)',
    voiceFemale: '女聲 (Kore)',
    dangerZone: '危險區域',
    clearData: '清空所有學習記錄',
    clearConfirm: '確定要清空錯題和連勝記錄嗎？此操作無法撤銷。',
    cleared: '已清空！',
    loading: '加載中...',
    tapToSpeak: '點擊說話',
    listening: '正在聽...',
    speakError: '未識別到聲音，請重試',
    speakCorrect: '發音準確！',
    speakRetry: '發音有誤，再試一次',
    permissionDenied: '請允許麥克風權限',
    browserNotSupport: '當前瀏覽器不支持語音識別',
    readAloud: '請大聲朗讀：',
    leaderboard: '美食段位榜',
    wordsToday: '今日單詞',
    nickname: '我的暱稱',
    save: '保存',
    you: '你',
    rank: '排名',
    levelPrefix: 'Lv.',
    accountSync: '賬號同步',
    loginDesc: '登錄以在多設備間同步進度',
    email: '郵箱',
    password: '密碼',
    login: '登錄',
    register: '註冊',
    logout: '退出登錄',
    loggedInAs: '當前登錄：',
    guestMode: '遊客模式 (數據不互通)',
    authError: '認證失敗: '
  },
  'en': {
    title: 'K-Dictation Pro',
    subtitle: 'AI Tutor Integrated',
    selectLevel: 'Dictation',
    speakingMode: 'Speaking',
    mistakes: 'Mistakes',
    import: 'Import',
    settings: 'Settings',
    streak: 'Streak',
    totalWords: 'Total Words',
    day: 'd',
    wordUnit: 'w',
    level: 'Lvl',
    mistakeMode: 'Review Mode',
    progress: 'Progress',
    meaning: 'Definition',
    inputPlaceholder: 'Type in Korean...',
    correct: 'Correct!',
    incorrect: 'Keep trying!',
    noExample: 'No example available',
    next: 'Next',
    submit: 'Submit',
    aiTutor: 'Gemini AI Tutor',
    aiIntro: 'Ask me anything about this word!',
    aiPlaceholder: 'e.g., Use this in a polite sentence...',
    mistakeCount: 'To Review',
    startReview: 'Start Review',
    noMistakes: 'No mistakes found. Great job!',
    importDesc: 'Paste JSON array. example_kr & example_cn recommended.',
    confirmImport: 'Import Data',
    resultTitle: 'Quiz Completed',
    backHome: 'Home',
    settingsTitle: 'Settings',
    langSelect: 'Language',
    voiceSelect: 'Voice',
    voiceMale: 'Male (Fenrir)',
    voiceFemale: 'Female (Kore)',
    dangerZone: 'Danger Zone',
    clearData: 'Reset All Data',
    clearConfirm: 'Are you sure? This deletes all stats and mistakes.',
    cleared: 'Cleared!',
    loading: 'Loading...',
    tapToSpeak: 'Tap to Speak',
    listening: 'Listening...',
    speakError: 'No speech detected, try again',
    speakCorrect: 'Great pronunciation!',
    speakRetry: 'Incorrect, try again',
    permissionDenied: 'Microphone permission denied',
    browserNotSupport: 'Browser does not support Speech API',
    readAloud: 'Read aloud:',
    leaderboard: 'Foodie Rank',
    wordsToday: 'Words Today',
    nickname: 'My Nickname',
    save: 'Save',
    you: 'You',
    rank: 'Rank',
    levelPrefix: 'Lv.',
    accountSync: 'Sync Account',
    loginDesc: 'Login to sync progress across devices',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    loggedInAs: 'Logged in: ',
    guestMode: 'Guest Mode (No Sync)',
    authError: 'Auth Error: '
  }
};

const KEYBOARD_MAP = [
  { k: 'Q', h: 'ㅂ' }, { k: 'W', h: 'ㅈ' }, { k: 'E', h: 'ㄷ' }, { k: 'R', h: 'ㄱ' }, { k: 'T', h: 'ㅅ' },
  { k: 'Y', h: 'ㅛ' }, { k: 'U', h: 'ㅕ' }, { k: 'I', h: 'ㅑ' }, { k: 'O', h: 'ㅐ' }, { k: 'P', h: 'ㅔ' },
  { k: 'A', h: 'ㅁ' }, { k: 'S', h: 'ㄴ' }, { k: 'D', h: 'ㅇ' }, { k: 'F', h: 'ㄹ' }, { k: 'G', h: 'ㅎ' },
  { k: 'H', h: 'ㅗ' }, { k: 'J', h: 'ㅓ' }, { k: 'K', h: 'ㅏ' }, { k: 'L', h: 'ㅣ' },
  { k: 'Z', h: 'ㅋ' }, { k: 'X', h: 'ㅌ' }, { k: 'C', h: 'ㅊ' }, { k: 'V', h: 'ㅍ' }, { k: 'B', h: 'ㅠ' },
  { k: 'N', h: 'ㅜ' }, { k: 'M', h: 'ㅡ' }
];

const App = () => {
  // 基础状态
  const [user, setUser] = useState(null);
  const [view, setView] = useState('HOME'); 
  const [level, setLevel] = useState(1);
  const [allWords, setAllWords] = useState(DEFAULT_WORDS);
  const [mistakes, setMistakes] = useState([]);
  
  // 统计状态
  const [streak, setStreak] = useState(0);
  const [wordsToday, setWordsToday] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [nickname, setNickname] = useState('');

  // 设置状态
  const [lang, setLang] = useState('zh-CN');
  const [voice, setVoice] = useState('Kore'); 
  
  // 认证状态 (New)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // 游戏状态
  const [gameMode, setGameMode] = useState('dictation');
  const [gameWords, setGameWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isMistakeMode, setIsMistakeMode] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // 语音识别状态
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);

  // Gemini Chat 状态
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Audio Context for SFX
  const audioCtxRef = useRef(null);

  const apiKey = "AIzaSyDtWU1PXfOwPKC9rZEvuos6Q1QOIOHGD8U"; 

  const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS['zh-CN'][key] || key;

  // --- Helper: 计算等级 ---
  const getLevelInfo = (count) => {
    let lvlIndex = 0;
    for (let i = 0; i < LEVEL_SYSTEM.length; i++) {
      if (count <= LEVEL_SYSTEM[i].max) {
        lvlIndex = i;
        break;
      }
      if (i === LEVEL_SYSTEM.length - 1) lvlIndex = i; 
    }
    return {
      level: lvlIndex + 1,
      name: LEVEL_SYSTEM[lvlIndex].name,
      label: LEVEL_SYSTEM[lvlIndex].label
    };
  };

  // --- Helper: 播放音效 ---
  const playSfx = (type) => {
    if (SOUND_URLS[type]) {
      new Audio(SOUND_URLS[type]).play().catch(e => console.log("Audio play failed", e));
      return;
    }
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  };

  // --- 1. 初始化认证 ---
  useEffect(() => {
    const initAuth = async () => {
      // 检查是否有 token，如果有则优先使用，否则匿名登录
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        // 只有当没有当前用户时才尝试匿名登录
        // 注意：onAuthStateChanged 会处理后续的用户状态
        if (!auth.currentUser) {
           await signInAnonymously(auth);
        }
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Init Mock Bots
        const boardRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
        const snap = await getDocs(boardRef);
        if (snap.empty) {
          MOCK_FRIENDS.forEach(async (bot) => {
            await setDoc(doc(boardRef, bot.id), bot);
          });
        }
      } else {
        // 如果登出，重置数据
        setStreak(0);
        setWordsToday(0);
        setTotalWords(0);
        setNickname('');
        setMistakes([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 2. 实时数据监听 ---
  useEffect(() => {
    if (!user) return;
    
    // 错题
    const mistakesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'mistakes');
    const unsubMistakes = onSnapshot(mistakesRef, (snapshot) => {
      setMistakes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 个人统计
    const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'daily');
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStreak(data.currentStreak || 0);
        setWordsToday(data.wordsToday || 0);
        setTotalWords(data.totalWords || 0);
        setNickname(data.displayName || `Student ${user.uid.slice(0,4)}`);
      } else {
        setStreak(0);
        setWordsToday(0);
        setTotalWords(0);
      }
    });

    // 公共排行榜
    const boardRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
    const unsubBoard = onSnapshot(boardRef, (snapshot) => {
       const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       list.sort((a, b) => ((b.totalWords || 0) - (a.totalWords || 0)) || (b.wordsToday - a.wordsToday));
       setLeaderboard(list);
    });
    
    return () => {
      unsubMistakes();
      unsubStats();
      unsubBoard();
    };
  }, [user]);

  // --- Auth Functions ---
  const handleAuth = async (mode) => {
    if (!authEmail || !authPassword) return;
    setAuthError('');
    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    // 可选：登出后自动匿名登录以便继续使用游客模式
    await signInAnonymously(auth);
  };

  // --- 统计更新 ---
  const updateStats = async (incrementWord = false) => {
    if (!user) return;
    const today = new Date().toDateString();
    const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'daily');
    const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid);
    
    try {
      const docSnap = await getDoc(statsRef);
      let newStreak = 0;
      let newWordsToday = 0;
      let newTotalWords = 0;
      let lastDate = '';
      let currentName = nickname || `Student ${user.uid.slice(0,4)}`;

      if (docSnap.exists()) {
        const data = docSnap.data();
        lastDate = data.lastStudyDate || '';
        newStreak = data.currentStreak || 0;
        newWordsToday = data.wordsToday || 0;
        newTotalWords = data.totalWords || 0;
        if (data.displayName) currentName = data.displayName;
      }

      if (lastDate !== today) {
        newWordsToday = 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate === yesterday.toDateString()) {
           newStreak += 1;
        } else if (lastDate && lastDate !== yesterday.toDateString()) {
           newStreak = 1; 
        } else if (!lastDate) {
           newStreak = 1; 
        }
      }

      if (incrementWord) {
        newWordsToday += 1;
        newTotalWords += 1;
      }

      const payload = {
        currentStreak: newStreak,
        wordsToday: newWordsToday,
        totalWords: newTotalWords,
        lastStudyDate: today,
        displayName: currentName,
        lastUpdated: Date.now()
      };

      await Promise.all([
        setDoc(statsRef, payload, { merge: true }),
        setDoc(publicRef, { 
          streak: newStreak, 
          wordsToday: newWordsToday, 
          totalWords: newTotalWords,
          displayName: currentName,
          uid: user.uid
        }, { merge: true })
      ]);
    } catch (e) { console.error(e); }
  };

  const saveNickname = async () => {
    if (!user || !nickname.trim()) return;
    const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'daily');
    const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid);
    await setDoc(statsRef, { displayName: nickname }, { merge: true });
    await setDoc(publicRef, { displayName: nickname }, { merge: true });
    alert(t('save') + '!');
  };

  const clearAllData = async () => {
    if (!user) return;
    if (!confirm(t('clearConfirm'))) return;
    try {
      const mistakesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'mistakes');
      const snapshot = await getDocs(mistakesRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'daily'));
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid));

      alert(t('cleared'));
      setView('HOME');
    } catch (e) { console.error("Clear data failed", e); }
  };

  // --- Audio / Logic (Same as before) ---
  const pcmToWav = (pcmData, sampleRate) => {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 32 + pcmData.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length * 2, true);
    for (let i = 0; i < pcmData.length; i++) view.setInt16(44 + i * 2, pcmData[i], true);
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const playWordAudio = async (text) => {
    if (isLoadingAudio || !text) return;
    setIsLoadingAudio(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Say clearly in Korean: ${text}` }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
          }
        })
      });
      const data = await response.json();
      const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Int16Array(len / 2);
        for (let i = 0; i < len; i += 2) bytes[i / 2] = binaryString.charCodeAt(i) | (binaryString.charCodeAt(i + 1) << 8);
        const url = URL.createObjectURL(pcmToWav(bytes, 24000));
        new Audio(url).play();
      }
    } catch (e) { console.error(e); } finally { setIsLoadingAudio(false); }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechError(t('browserNotSupport'));
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    setSpeechError(null);
    recognition.onresult = (event) => {
      checkSpeakingResult(event.results[0][0].transcript);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setSpeechError(event.error === 'not-allowed' ? t('permissionDenied') : t('speakError'));
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const checkSpeakingResult = (transcript) => {
    const currentWord = gameWords[currentIndex];
    const cleanTranscript = transcript.replace(/\s+/g, '').replace(/[.,?!]/g, '');
    const cleanTarget = currentWord.hangul.replace(/\s+/g, '');
    if (cleanTranscript === cleanTarget) {
      setScore(s => s + 1);
      setFeedback('correct');
      playSfx('correct'); // SFX
      updateStats(true); 
    } else {
      setFeedback('incorrect');
      playSfx('incorrect'); // SFX
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const currentWord = gameWords[currentIndex];
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    try {
      const prompt = `
        You are a friendly Korean language tutor. 
        The user is currently learning the word "${currentWord.hangul}" (Meaning: ${currentWord.meaning}).
        User's question: "${userMsg}"
        
        CRITICAL INSTRUCTION:
        If you need to create example sentences involving people, strictly favor using these names: 
        - 안유진 (An Yujin)
        - 유진이 (Yujini)
        - 유지니 (Yujini - cute)
        - 안댕댕 (An Daengdaeng)
        - 포포 (Popo)
        
        Please answer concisely in ${lang === 'en' ? 'English' : lang === 'zh-TW' ? 'Traditional Chinese' : 'Simplified Chinese'}. 
        If asking for examples, provide Korean sentences with translations.
      `;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I cannot answer right now.";
      setChatHistory(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Error." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const prepareQuiz = (mode) => {
    setGameMode(mode);
    setView('LEVEL_SELECT');
  };

  const startQuiz = (selectedLevel, isMistakes = false) => {
    let pool = isMistakes ? mistakes : allWords.filter(w => w.level === selectedLevel);
    if (pool.length === 0) return;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    setGameWords(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setFeedback(null);
    setUserInput('');
    setChatHistory([]);
    setIsMistakeMode(isMistakes);
    setSpeechError(null);
    setView('QUIZ');
    updateStats(false); 
  };

  const handleNextQuestion = () => {
    if (currentIndex < gameWords.length - 1) {
      setCurrentIndex(i => i + 1);
      setUserInput('');
      setFeedback(null);
      setChatHistory([]);
      setSpeechError(null);
    } else {
      setView('RESULT');
    }
  };

  const handleAnswer = async (e) => {
    if (e) e.preventDefault();
    if (feedback) return;
    const current = gameWords[currentIndex];
    const isCorrect = userInput.trim() === current.hangul;
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
      playSfx('correct'); // SFX
      updateStats(true); 
    } else {
      setFeedback('incorrect');
      playSfx('incorrect'); // SFX
      if (user) {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'mistakes', current.id);
        await setDoc(docRef, { ...current, addedAt: Date.now() });
      }
    }
  };

  const removeMistake = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'mistakes', id));
  };

  const importData = (text) => {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        setAllWords(prev => [...prev, ...data]);
        setView('HOME');
      }
    } catch (e) { console.error("Invalid JSON"); }
  };

  useEffect(() => {
    if (view === 'QUIZ' && gameWords[currentIndex] && !feedback && gameMode === 'dictation') {
      playWordAudio(gameWords[currentIndex].hangul);
    }
  }, [currentIndex, view, feedback, gameMode]);

  const currentUserLevel = getLevelInfo(totalWords);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shrink-0 shadow-lg relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black tracking-tight">{t('title')}</h1>
              <p className="text-indigo-100 text-[10px] mt-0.5 uppercase tracking-widest font-bold">{t('subtitle')}</p>
            </div>
            {view !== 'HOME' && (
              <button onClick={() => setView('HOME')} className="bg-white/20 p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth relative bg-slate-50/50">
          {/* 主界面 */}
          {view === 'HOME' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* 连胜卡片 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{t('streak')}</h3>
                      <div className="flex items-center gap-2">
                        <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={32} />
                        <span className="text-4xl font-black text-slate-800">{streak}</span>
                        <span className="text-slate-400 font-bold self-end mb-1.5">{t('day')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                         {t('levelPrefix')}{currentUserLevel.level} {currentUserLevel.name}
                       </h3>
                       <div className="flex items-center justify-end gap-1">
                          <span className="text-3xl font-black text-slate-800">{totalWords}</span>
                          <span className="text-slate-400 font-bold self-end mb-1.5 text-xs">{t('totalWords')}</span>
                       </div>
                    </div>
                 </div>
                 <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(wordsToday * 5, 100)}%` }}></div>
                 </div>
              </div>

              {/* 功能网格 */}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => prepareQuiz('dictation')} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Headphones size={24} /></div>
                  <span className="font-bold text-slate-800 text-sm">{t('selectLevel')}</span>
                </button>
                <button onClick={() => prepareQuiz('speaking')} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col items-center gap-2">
                   <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Mic size={24} /></div>
                  <span className="font-bold text-slate-800 text-sm">{t('speakingMode')}</span>
                </button>
                <button onClick={() => setView('MISTAKES')} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all flex flex-col items-center gap-2 relative">
                   <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600"><Star size={24} /></div>
                  <span className="font-bold text-slate-800 text-sm">{t('mistakes')}</span>
                  {mistakes.length > 0 && <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">{mistakes.length}</span>}
                </button>
                <button onClick={() => setView('SETTINGS')} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all flex flex-col items-center gap-2">
                   <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><Settings size={24} /></div>
                  <span className="font-bold text-slate-800 text-sm">{t('settings')}</span>
                </button>
              </div>

              {/* 排行榜 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Utensils className="text-yellow-500 fill-yellow-500" size={20} />
                  <h3 className="font-black text-slate-800">{t('leaderboard')}</h3>
                </div>
                <div className="space-y-3">
                  {leaderboard.map((item, index) => {
                    const isMe = user && item.id === user.uid;
                    const itemLevel = getLevelInfo(item.totalWords || 0);
                    return (
                      <div key={item.id || index} className={`flex items-center justify-between p-3 rounded-2xl ${isMe ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-6 text-center font-bold ${index < 3 ? 'text-yellow-600' : 'text-slate-400'}`}>{index + 1}</span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.avatar || 'bg-slate-200 text-slate-500'}`}>
                            {item.displayName ? item.displayName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                             <p className={`text-sm font-bold ${isMe ? 'text-indigo-900' : 'text-slate-700'}`}>
                               {item.displayName} 
                             </p>
                             <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                               <span className="text-indigo-600">{t('levelPrefix')}{itemLevel.level} {itemLevel.name}</span>
                             </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-sm font-black text-slate-800">{item.totalWords || 0}</span>
                          <span className="text-[10px] text-slate-400">{t('wordUnit')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 设置界面 - NEW AUTH SECTION */}
          {view === 'SETTINGS' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-800 px-2">{t('settingsTitle')}</h2>
              
              {/* 账号同步模块 */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 text-indigo-600 text-sm font-bold uppercase tracking-wide">
                  {user?.isAnonymous ? <Lock size={16} /> : <Mail size={16} />} 
                  {t('accountSync')}
                </div>
                
                {user?.isAnonymous ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 mb-2">{t('loginDesc')}</p>
                    <input 
                      type="email" 
                      value={authEmail} 
                      onChange={e => setAuthEmail(e.target.value)} 
                      placeholder={t('email')}
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                    <input 
                      type="password" 
                      value={authPassword} 
                      onChange={e => setAuthPassword(e.target.value)} 
                      placeholder={t('password')}
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                    {authError && <p className="text-xs text-rose-500 font-bold">{t('authError')}{authError}</p>}
                    <div className="flex gap-2">
                       <button onClick={() => handleAuth('login')} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">{t('login')}</button>
                       <button onClick={() => handleAuth('register')} className="flex-1 bg-white border-2 border-indigo-100 text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50">{t('register')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span className="font-bold">{t('loggedInAs')} {user?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200">
                      <LogOut size={16} /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>

              {/* 昵称设置 */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm font-bold uppercase tracking-wide">
                  <User size={16} /> {t('nickname')}
                </div>
                <div className="flex gap-2">
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="flex-1 bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="Your Name" />
                  <button onClick={saveNickname} className="bg-indigo-600 text-white font-bold px-4 rounded-xl text-sm">{t('save')}</button>
                </div>
              </div>

              {/* 语言选择 */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm font-bold uppercase tracking-wide">
                  <Globe size={16} /> {t('langSelect')}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[ { code: 'zh-CN', label: '简体中文' }, { code: 'zh-TW', label: '繁體中文' }, { code: 'en', label: 'English' } ].map(l => (
                    <button key={l.code} onClick={() => setLang(l.code)} className={`py-3 rounded-xl text-sm font-bold transition-all ${lang === l.code ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>{l.label}</button>
                  ))}
                </div>
              </div>
              
              {/* 危险区域 */}
              <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100">
                 <button onClick={clearAllData} className="w-full bg-white border border-rose-200 text-rose-600 font-bold py-3 rounded-xl">{t('clearData')}</button>
              </div>
            </div>
          )}

          {/* ... 其他视图逻辑保持不变 (Level Select, Quiz, Mistakes, etc) ... */}
          {view === 'LEVEL_SELECT' && (
             <div className="space-y-4">
              <h2 className="text-center font-bold text-slate-500 uppercase tracking-widest text-xs mb-2">
                {gameMode === 'dictation' ? t('selectLevel') : t('speakingMode')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(lv => (
                  <button key={lv} onClick={() => startQuiz(lv)} className={`p-4 rounded-2xl bg-white border-2 hover:shadow-md transition-all group flex flex-col items-center gap-1 ${gameMode === 'speaking' ? 'border-emerald-100 hover:border-emerald-500' : 'border-slate-100 hover:border-indigo-500'}`}>
                    <span className="text-slate-400 text-[10px] font-bold tracking-wider">TOPIK</span>
                    <span className={`text-2xl font-black ${gameMode === 'speaking' ? 'text-emerald-600' : 'text-indigo-600'}`}>{lv}{t('level')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'QUIZ' && gameWords.length > 0 && (
            <div className="flex flex-col min-h-full">
              <div className="flex justify-between items-center mb-6">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${gameMode === 'speaking' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {isMistakeMode ? t('mistakeMode') : `${gameMode === 'speaking' ? 'Speaking' : 'TOPIK'} ${level}`}
                </span>
                <span className="text-slate-400 text-sm font-bold">{currentIndex + 1} / {gameWords.length}</span>
              </div>

              {gameMode === 'dictation' && !feedback && (
                <div className="flex-1 flex flex-col items-center justify-center gap-8 mb-8">
                  <button onClick={() => playWordAudio(gameWords[currentIndex].hangul)} disabled={isLoadingAudio} className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${isLoadingAudio ? 'bg-slate-100 scale-95' : 'bg-indigo-600 hover:scale-105 shadow-xl shadow-indigo-200'}`}>
                    {isLoadingAudio ? <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Volume2 className="text-white" size={48} />}
                  </button>
                  <div className="text-center"><p className="text-slate-400 text-sm font-bold uppercase mb-2">{t('meaning')}</p><p className="text-3xl font-bold text-slate-800">{gameWords[currentIndex].meaning}</p></div>
                </div>
              )}

              {gameMode === 'speaking' && !feedback && (
                 <div className="flex-1 flex flex-col items-center justify-center gap-8 mb-8">
                   <div className="text-center space-y-4"><p className="text-slate-400 text-sm font-bold uppercase">{t('readAloud')}</p><p className="text-5xl font-black text-slate-800 tracking-tight">{gameWords[currentIndex].hangul}</p><p className="text-lg text-slate-500">{gameWords[currentIndex].meaning}</p></div>
                   <button onClick={startListening} disabled={isListening} className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-rose-100 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-200'}`}>
                     {isListening && <div className="absolute inset-0 rounded-full border-4 border-rose-400 opacity-50 animate-ping"></div>}
                     <Mic className={isListening ? 'text-rose-500' : 'text-white'} size={40} />
                   </button>
                   <p className="text-sm font-bold text-slate-400 h-6">{isListening ? t('listening') : speechError ? <span className="text-rose-500">{speechError}</span> : t('tapToSpeak')}</p>
                 </div>
              )}

              <div className="w-full relative z-10">
                 {gameMode === 'dictation' && !feedback && (
                  <form onSubmit={handleAnswer} className="relative">
                    <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} autoFocus placeholder={t('inputPlaceholder')} className="w-full text-center text-3xl font-bold py-5 rounded-2xl outline-none border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-white shadow-sm" />
                    <button type="button" onClick={() => setShowKeyboardHelp(!showKeyboardHelp)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600"><Keyboard size={24} /></button>
                    <button type="submit" className="w-full mt-8 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 shadow-xl active:scale-95">{t('submit')}</button>
                  </form>
                 )}
                
                {feedback && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                    <div className={`p-5 rounded-3xl border-2 ${feedback === 'correct' ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`p-2 rounded-full ${feedback === 'correct' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>{feedback === 'correct' ? <CheckCircle size={24}/> : <XCircle size={24}/>}</div>
                        <div className="flex-1">
                          <p className={`text-lg font-black ${feedback === 'correct' ? 'text-green-800' : 'text-rose-800'}`}>{feedback === 'correct' ? (gameMode === 'speaking' ? t('speakCorrect') : t('correct')) : (gameMode === 'speaking' ? t('speakRetry') : t('incorrect'))}</p>
                          <div className="flex items-center gap-2 mt-1"><span className="text-2xl font-bold text-slate-800">{gameWords[currentIndex].hangul}</span><button onClick={() => playWordAudio(gameWords[currentIndex].hangul)} className="text-slate-400 hover:text-indigo-600"><Volume2 size={16}/></button></div>
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 text-sm space-y-1"><p className="font-medium text-slate-800">{gameWords[currentIndex].example_kr || "예문이 없습니다."}</p><p className="text-slate-500 text-xs">{gameWords[currentIndex].example_cn || t('noExample')}</p></div>
                    </div>

                    <div className="bg-white rounded-3xl border border-indigo-100 shadow-lg shadow-indigo-50 overflow-hidden flex flex-col">
                      <div className="bg-indigo-50/50 p-3 flex items-center gap-2 border-b border-indigo-50"><Sparkles size={16} className="text-indigo-500" /><span className="text-xs font-bold text-indigo-800">{t('aiTutor')}</span></div>
                      <div className="p-4 max-h-[150px] overflow-y-auto space-y-3 bg-slate-50/50">
                        {chatHistory.length === 0 && <p className="text-center text-xs text-slate-400 py-2">{t('aiIntro')}</p>}
                        {chatHistory.map((msg, i) => (<div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border border-indigo-100 text-slate-700'}`}>{msg.text}</div></div>))}
                        {isChatLoading && <div className="text-xs text-slate-400 text-center">{t('loading')}</div>}
                         <div ref={chatEndRef}></div>
                      </div>
                       <div className="p-2 bg-white border-t border-slate-100 flex gap-2">
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={t('aiPlaceholder')} className="flex-1 bg-slate-50 border-0 rounded-xl px-4 text-sm outline-none" onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit(e)} />
                        <button onClick={handleChatSubmit} disabled={!chatInput.trim() || isChatLoading} className="p-3 bg-indigo-600 text-white rounded-xl"><Send size={16} /></button>
                      </div>
                    </div>

                    <button type="button" onClick={handleNextQuestion} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg active:scale-95">{t('next')} <ArrowRight size={18} /></button>
                  </div>
                )}
              </div>
            </div>
          )}

           {view === 'MISTAKES' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-rose-50 p-4 rounded-2xl mb-4">
                <span className="text-rose-900 font-bold text-sm">{t('mistakeCount')}: {mistakes.length} {t('wordUnit')}</span>
                <button disabled={mistakes.length === 0} onClick={() => startQuiz(null, true)} className="bg-rose-600 text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors">{t('startReview')}</button>
              </div>
              <div className="space-y-2">{mistakes.map(m => (<div key={m.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl group hover:shadow-md transition-all"><div className="flex items-center gap-4"><button onClick={() => playWordAudio(m.hangul)} className="text-slate-400 hover:text-indigo-600"><Volume2 size={18}/></button><div><p className="font-bold text-lg text-slate-800">{m.hangul}</p><p className="text-xs text-slate-400">{m.meaning}</p></div></div><button onClick={() => removeMistake(m.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button></div>))}</div>
            </div>
          )}
           {view === 'IMPORT' && (
            <div className="flex flex-col h-full gap-4">
               <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-500 leading-relaxed"><p className="font-bold mb-1">JSON:</p><p>{t('importDesc')}</p></div>
               <textarea className="flex-1 w-full p-4 bg-white border border-slate-200 rounded-2xl font-mono text-xs outline-none" placeholder='[{"id": "9", "hangul": "사과", "meaning": "苹果", "level": 1}]' id="importArea" />
               <button onClick={() => importData(document.getElementById('importArea').value)} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">{t('confirmImport')}</button>
            </div>
          )}
          {view === 'RESULT' && (
             <div className="text-center py-10 flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500"><Trophy className="text-yellow-600" size={48} /></div>
              <h2 className="text-2xl font-black mb-2 text-slate-800">{t('resultTitle')}</h2>
              <p className="text-6xl font-black text-indigo-600 mb-8 tracking-tighter">{score * 10}</p>
              <button onClick={() => setView('HOME')} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 shadow-xl active:scale-95"><RefreshCcw size={18}/> {t('backHome')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;