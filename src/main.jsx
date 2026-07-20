import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  AudioLines,
  Bell,
  BookOpen,
  CalendarPlus,
  Check,
  ChevronLeft,
  CircleHelp,
  Clock3,
  Flame,
  Globe2,
  Mic,
  Phone,
  PhoneCall,
  Play,
  Repeat2,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import "./styles.css";
import "./onboarding.css";

const scenes = [
  {
    id: "coffee",
    icon: "☕",
    title: "Coffee before the meeting",
    sub: "Ordering · small talk · confidence",
    time: "3 min",
    level: "A2 → B1",
  },
  {
    id: "meeting",
    icon: "✦",
    title: "Speak up in the meeting",
    sub: "Clarifying · disagreeing politely",
    time: "4 min",
    level: "B1 → B2",
  },
  {
    id: "airport",
    icon: "✈",
    title: "A change at the gate",
    sub: "Listening under pressure",
    time: "3 min",
    level: "A2 → B1",
  },
];

const languages = [
  { name: "Spanish", hello: "Hola" },
  { name: "French", hello: "Bonjour" },
  { name: "Japanese", hello: "こんにちは" },
  { name: "English", hello: "Hello" },
  { name: "Korean", hello: "안녕하세요" },
  { name: "German", hello: "Hallo" },
  { name: "Italian", hello: "Ciao" },
  { name: "Mandarin", hello: "你好" },
];
const coachPrompts = {
  English: {
    lang: "en-US",
    text: "Good morning. I am calling because your day is starting. Tell me one thing you need to achieve today.",
    translation:
      "Good morning. Your day is starting—tell me one thing you need to achieve today.",
    sample: "Today I need to finish my presentation before lunch.",
  },
  Spanish: {
    lang: "es-ES",
    text: "Buenos días. Te llamo porque empieza tu día. Dime una cosa que necesitas lograr hoy.",
    translation:
      "Good morning. I’m calling because your day is starting. Tell me one thing you need to achieve today.",
    sample: "Hoy necesito terminar mi presentación antes del almuerzo.",
  },
  French: {
    lang: "fr-FR",
    text: "Bonjour. Je t’appelle parce que ta journée commence. Dis-moi une chose que tu dois accomplir aujourd’hui.",
    translation:
      "Good morning. I’m calling because your day is starting. Tell me one thing you need to accomplish today.",
    sample: "Aujourd’hui, je dois terminer ma présentation avant le déjeuner.",
  },
  Japanese: {
    lang: "ja-JP",
    text: "おはようございます。今日、必ず達成したいことを一つ教えてください。",
    translation:
      "Good morning. Tell me one thing you definitely want to accomplish today.",
    sample: "今日は昼までにプレゼンを完成させたいです。",
  },
  Korean: {
    lang: "ko-KR",
    text: "좋은 아침이에요. 오늘 꼭 이루고 싶은 한 가지를 말해 주세요.",
    translation:
      "Good morning. Tell me one thing you really want to accomplish today.",
    sample: "오늘 점심 전에 발표 자료를 끝내야 해요.",
  },
  German: {
    lang: "de-DE",
    text: "Guten Morgen. Dein Tag beginnt. Sag mir eine Sache, die du heute erreichen musst.",
    translation:
      "Good morning. Your day is starting. Tell me one thing you must achieve today.",
    sample: "Heute muss ich meine Präsentation vor dem Mittagessen fertigstellen.",
  },
  Italian: {
    lang: "it-IT",
    text: "Buongiorno. La tua giornata sta iniziando. Dimmi una cosa che devi realizzare oggi.",
    translation:
      "Good morning. Your day is starting. Tell me one thing you need to accomplish today.",
    sample: "Oggi devo finire la mia presentazione prima di pranzo.",
  },
  Mandarin: {
    lang: "zh-CN",
    text: "早上好。你今天必须完成的一件事是什么？请用一句话告诉我。",
    translation:
      "Good morning. What is one thing you must finish today? Tell me in one sentence.",
    sample: "今天中午以前，我必须完成演示文稿。",
  },
};

const offlineCallTurns = {
  Spanish: [
    {
      reply: "Muy bien. ¿Por qué es importante terminarla hoy?",
      translation: "Very good. Why is it important to finish it today?",
      focus: "necesito terminar",
      pronunciation: "Link ‘necesito terminar’ smoothly: ne-ce-SI-to ter-mi-NAR.",
      words: [
        { term: "terminar", meaning: "to finish", example: "Necesito terminarlo hoy." },
        { term: "antes de", meaning: "before", example: "antes del almuerzo" },
      ],
    },
    {
      reply: "Entiendo. ¿Cuál será el primer paso después de esta llamada?",
      translation: "I understand. What will your first step be after this call?",
      focus: "el primer paso",
      pronunciation: "Keep ‘primer paso’ light and connected: pri-MER PA-so.",
      words: [
        { term: "el primer paso", meaning: "the first step", example: "Mi primer paso es abrir el documento." },
      ],
    },
    {
      reply: "Perfecto. Dímelo como una promesa: ‘Después de esta llamada, voy a…’",
      translation: "Perfect. Tell me as a promise: ‘After this call, I’m going to…’",
      focus: "Después de esta llamada, voy a…",
      pronunciation: "Stress the action after ‘voy a’; let ‘voy a’ flow as one unit.",
      words: [
        { term: "voy a", meaning: "I’m going to", example: "Voy a empezar ahora." },
      ],
    },
  ],
  French: [
    { reply: "Très bien. Pourquoi est-ce important de le terminer aujourd’hui ?", translation: "Very good. Why is it important to finish it today?", focus: "je dois terminer", pronunciation: "Join ‘je dois’ smoothly; do not stress each word.", words: [{ term: "terminer", meaning: "to finish", example: "Je dois le terminer aujourd’hui." }] },
    { reply: "Je comprends. Quelle sera ta première étape après cet appel ?", translation: "I understand. What will your first step be after this call?", focus: "la première étape", pronunciation: "Keep the final consonants soft in ‘première étape’.", words: [{ term: "une étape", meaning: "a step", example: "La première étape est simple." }] },
    { reply: "Parfait. Fais-en une promesse : ‘Après cet appel, je vais…’", translation: "Perfect. Make it a promise: ‘After this call, I’m going to…’", focus: "je vais", pronunciation: "Say ‘je vais’ as one compact phrase.", words: [{ term: "je vais", meaning: "I’m going to", example: "Je vais commencer maintenant." }] },
  ],
  Japanese: [
    { reply: "いいですね。なぜ今日中に終えることが大切ですか？", translation: "Good. Why is it important to finish it today?", focus: "今日中に終える", pronunciation: "Keep きょうじゅうに together: kyō-jū-ni.", words: [{ term: "今日中に", meaning: "by the end of today", example: "今日中に終えます。" }] },
    { reply: "分かりました。この電話の後、最初に何をしますか？", translation: "I understand. What will you do first after this call?", focus: "最初に", pronunciation: "Say さいしょに in three even beats.", words: [{ term: "最初に", meaning: "first", example: "最初に資料を開きます。" }] },
    { reply: "いいですね。約束として言ってみましょう。「この電話の後、すぐに…」", translation: "Good. Say it as a promise: ‘Right after this call, I will…’", focus: "この電話の後", pronunciation: "Pause lightly after あと before the action.", words: [{ term: "すぐに", meaning: "right away", example: "すぐに始めます。" }] },
  ],
  Korean: [
    { reply: "좋아요. 오늘 끝내는 것이 왜 중요해요?", translation: "Good. Why is finishing it today important?", focus: "오늘 끝내야 해요", pronunciation: "Connect 끝내야 해요 smoothly without pausing.", words: [{ term: "끝내다", meaning: "to finish", example: "오늘 끝내야 해요." }] },
    { reply: "알겠어요. 이 통화 후에 가장 먼저 무엇을 할 거예요?", translation: "I understand. What will you do first after this call?", focus: "가장 먼저", pronunciation: "Keep 가장 먼저 as one rhythm group.", words: [{ term: "가장 먼저", meaning: "first of all", example: "가장 먼저 문서를 열 거예요." }] },
    { reply: "좋아요. 약속처럼 말해 보세요. ‘이 통화 후에 바로…’", translation: "Good. Say it like a promise: ‘Right after this call…’", focus: "바로", pronunciation: "Stress the first syllable: BA-ro.", words: [{ term: "바로", meaning: "right away", example: "바로 시작할 거예요." }] },
  ],
  German: [
    { reply: "Sehr gut. Warum ist es wichtig, das heute fertigzustellen?", translation: "Very good. Why is it important to finish that today?", focus: "ich muss … fertigstellen", pronunciation: "Keep ‘fertigstellen’ together; stress FER-tig.", words: [{ term: "fertigstellen", meaning: "to complete", example: "Ich muss es heute fertigstellen." }] },
    { reply: "Verstanden. Was ist dein erster Schritt nach diesem Anruf?", translation: "Understood. What is your first step after this call?", focus: "der erste Schritt", pronunciation: "Keep the ‘sch’ sound clear in Schritt.", words: [{ term: "der Schritt", meaning: "the step", example: "Der erste Schritt ist einfach." }] },
    { reply: "Perfekt. Sag es als Versprechen: ‘Nach diesem Anruf werde ich…’", translation: "Perfect. Say it as a promise: ‘After this call, I will…’", focus: "werde ich", pronunciation: "Link ‘werde ich’ naturally; the words should not sound isolated.", words: [{ term: "werde ich", meaning: "I will", example: "Dann werde ich anfangen." }] },
  ],
  Italian: [
    { reply: "Molto bene. Perché è importante finirla oggi?", translation: "Very good. Why is it important to finish it today?", focus: "devo finire", pronunciation: "Let ‘devo finire’ flow; stress ni in finire.", words: [{ term: "finire", meaning: "to finish", example: "Devo finirla oggi." }] },
    { reply: "Capisco. Qual è il primo passo dopo questa chiamata?", translation: "I understand. What is the first step after this call?", focus: "il primo passo", pronunciation: "Hold the double s slightly in passo.", words: [{ term: "il passo", meaning: "the step", example: "Il primo passo è semplice." }] },
    { reply: "Perfetto. Dillo come una promessa: ‘Dopo questa chiamata, inizierò a…’", translation: "Perfect. Say it as a promise: ‘After this call, I will start to…’", focus: "inizierò", pronunciation: "Stress the final syllable: ini-zie-RÒ.", words: [{ term: "inizierò", meaning: "I will start", example: "Inizierò subito." }] },
  ],
  Mandarin: [
    { reply: "很好。为什么今天完成这件事很重要？", translation: "Very good. Why is it important to finish this today?", focus: "必须完成", pronunciation: "Keep the tones clear: bì-xū wán-chéng.", words: [{ term: "完成", meaning: "to complete", example: "我今天必须完成。" }] },
    { reply: "明白了。这通电话以后，你第一步要做什么？", translation: "I understand. After this call, what will your first step be?", focus: "第一步", pronunciation: "Say dì-yī-bù with three clear tones.", words: [{ term: "第一步", meaning: "the first step", example: "第一步是打开文件。" }] },
    { reply: "很好。像承诺一样说：‘这通电话以后，我马上…’", translation: "Good. Say it like a promise: ‘After this call, I will immediately…’", focus: "我马上", pronunciation: "Keep mǎ-shàng compact; do not insert a pause.", words: [{ term: "马上", meaning: "right away", example: "我马上开始。" }] },
  ],
  English: [
    { reply: "Good. Why is finishing it today important to you?", translation: "Why does this goal matter today?", focus: "I need to finish", pronunciation: "Link ‘need to’ naturally; it often sounds like ‘need-tuh’.", words: [{ term: "finish", meaning: "complete something", example: "I need to finish it today." }] },
    { reply: "I understand. What is the first step you will take after this call?", translation: "What action will you take first?", focus: "the first step", pronunciation: "Keep the final st in first before step.", words: [{ term: "first step", meaning: "the earliest action", example: "My first step is opening the document." }] },
    { reply: "Perfect. Say it as a promise: ‘Right after this call, I’m going to…’", translation: "Commit to one immediate action.", focus: "I’m going to", pronunciation: "In natural speech, ‘going to’ can reduce, but keep it clear.", words: [{ term: "right after", meaning: "immediately following", example: "Right after this call, I’ll begin." }] },
  ],
};
const practiceContent = {
  Spanish: {
    lang: "es-ES",
    hear: "Buenos días. ¿Es para aquí o para llevar?",
    prompt: "Quisiera un café con leche de avena para llevar, por favor.",
    choice: "They’re asking whether I’m staying or taking it away.",
    alternative: "They’re asking what size I want.",
    refinement:
      "Let “quisiera un” flow as one thought for a more natural rhythm.",
    chunk: "quisiera un",
  },
  French: {
    lang: "fr-FR",
    hear: "Bonjour. C’est sur place ou à emporter ?",
    prompt: "Je voudrais un café au lait d’avoine à emporter, s’il vous plaît.",
    choice: "They’re asking whether I’m staying or taking it away.",
    alternative: "They’re asking what size I want.",
    refinement:
      "Let “je voudrais” flow as one thought for a more natural rhythm.",
    chunk: "je voudrais",
  },
  Japanese: {
    lang: "ja-JP",
    hear: "店内でお召し上がりですか、お持ち帰りですか？",
    prompt: "オーツミルクラテを持ち帰りでお願いします。",
    choice: "They’re asking whether I’m staying or taking it away.",
    alternative: "They’re asking what size I want.",
    refinement:
      "Keep the request smooth and finish gently with “お願いします”.",
    chunk: "お願いします",
  },
  Korean: {
    lang: "ko-KR",
    hear: "드시고 가세요, 아니면 포장이세요?",
    prompt: "오트 밀크 라테 포장해 주세요.",
    choice: "They’re asking whether I’m staying or taking it away.",
    alternative: "They’re asking what size I want.",
    refinement: "Connect the order and “포장해 주세요” as one smooth request.",
    chunk: "포장해 주세요",
  },
  German: {
    lang: "de-DE",
    hear: "Für hier oder zum Mitnehmen?",
    prompt: "Ich hätte gern einen Hafermilchkaffee zum Mitnehmen, bitte.",
    choice: "They’re asking whether I’m staying or taking it away.",
    alternative: "They’re asking what size I want.",
    refinement: "Let “ich hätte gern” sound like one useful phrase.",
    chunk: "ich hätte gern",
  },
  Italian: {
    lang: "it-IT",
    hear: "Da bere qui o da portare via?",
    prompt: "Vorrei un caffè con latte d’avena da portare via, per favore.",
    choice: "They’re asking whether I’m staying or taking it away.",
    alternative: "They’re asking what size I want.",
    refinement: "Connect “vorrei un” without stressing each word.",
    chunk: "vorrei un",
  },
  Mandarin: {
    lang: "zh-CN",
    hear: "您好，请问在这里喝还是带走？",
    prompt: "请给我一杯燕麦拿铁，带走，谢谢。",
    choice: "They’re asking whether I’m staying or taking it away.",
    alternative: "They’re asking what size I want.",
    refinement: "Say “请给我一杯” as one smooth request frame.",
    chunk: "请给我一杯",
  },
  English: {
    lang: "en-US",
    hear: "Good morning! Is that for here, or to go?",
    prompt: "Could I get an oat milk latte to go, please?",
    choice: "They’re asking whether I’m staying or taking it away.",
    alternative: "They’re asking what size I want.",
    refinement:
      "Let “could I get” flow as one thought instead of stressing every word.",
    chunk: "could I get",
  },
};

const defaultCallSettings = {
  enabled: false,
  time: "08:30",
  retryMinutes: 10,
  retries: 3,
};
const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
};
const localDay = () => new Date().toLocaleDateString("en-CA");
const publicCallUrl = () =>
  `${location.origin}${location.pathname}?coachCall=1`;
const hostedCoachOrigin =
  "https://luma-language-agent.taotao918918918.chatgpt.site";
const coachApiUrl = () =>
  location.hostname.endsWith("github.io")
    ? `${hostedCoachOrigin}/api/coach`
    : new URL(`${import.meta.env.BASE_URL}api/coach`, location.origin).href;

function offlineCoachReply(target, utterance, intent, responseTurn) {
  const turns = offlineCallTurns[target] || offlineCallTurns.Spanish;
  const item = turns[Math.min(responseTurn, turns.length - 1)];
  if (intent === "clarify") {
    return {
      reply: item.reply,
      replyTranslation: item.translation,
      praise: "Asking for clarification is real communication—not a failure.",
      grammarCorrection: "No correction needed. You used a repair strategy.",
      naturalVersion: item.reply,
      pronunciation: item.pronunciation,
      vocabulary: item.words,
      memoryHook: `Keep the useful frame “${item.focus}”.`,
    };
  }
  if (intent === "vocabulary") {
    return {
      reply: item.reply,
      replyTranslation: item.translation,
      praise: "You paused to make meaning clear before continuing.",
      grammarCorrection: "Now reuse one of the new words in your next answer.",
      naturalVersion: item.focus,
      pronunciation: item.pronunciation,
      vocabulary: item.words,
      memoryHook: `Use “${item.focus}” in your next sentence.`,
    };
  }
  const offlineRules = {
    Spanish: [
      [/\bYo va\b/gi, "Yo voy", "Use “voy” with yo; “va” belongs with él, ella, or usted."],
      [/\bYo es\b/gi, "Yo soy", "Use “soy” with yo; “es” belongs with él, ella, or usted."],
      [/\btengo terminar\b/gi, "tengo que terminar", "Use “tener que + infinitive” to say you have to do something."],
    ],
    French: [
      [/\bje suis besoin de\b/gi, "j’ai besoin de", "French says “j’ai besoin de”—literally, “I have need of.”"],
    ],
    Japanese: [
      [/終わる必要です/g, "終える必要があります", "Use 終える for actively finishing something and 必要があります for “need to.”"],
    ],
    Korean: [
      [/끝내 필요해요/g, "끝내야 해요", "Use -아/어야 해요 after the verb stem to express “have to.”"],
    ],
    German: [
      [/\bich muss zu ([a-zäöüß]+en)\b/gi, "ich muss $1", "After a modal verb such as muss, use the infinitive without zu."],
    ],
    Italian: [
      [/\bio va\b/gi, "io vado", "Use “vado” with io; “va” belongs with lui, lei, or Lei."],
    ],
    Mandarin: [
      [/我需要完成了/g, "我需要完成", "After 需要, use the verb directly; 了 is not needed in this unfinished goal."],
    ],
    English: [
      [/\bI need finish\b/gi, "I need to finish", "Use “need to + verb” for an action you must do."],
    ],
  };
  let naturalVersion = utterance.trim();
  let grammarCorrection =
    "Your meaning landed. Reuse the highlighted phrase while answering the next question.";
  for (const [pattern, replacement, explanation] of offlineRules[target] || []) {
    if (pattern.test(naturalVersion)) {
      naturalVersion = naturalVersion.replace(pattern, replacement);
      grammarCorrection = explanation;
      break;
    }
  }
  return {
    reply: item.reply,
    replyTranslation: item.translation,
    praise: utterance.trim()
      ? "Your message was understood, and you kept the conversation moving."
      : "You stayed in the conversation.",
    grammarCorrection,
    naturalVersion,
    pronunciation: item.pronunciation,
    vocabulary: item.words,
    memoryHook: `Reuse “${item.focus}” when you answer the next question.`,
  };
}

async function registerLumaWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
}

function downloadCallCalendar(settings) {
  const now = new Date();
  const [hour, minute] = settings.time.split(":").map(Number);
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
  );
  if (start <= now) start.setDate(start.getDate() + 1);
  const stamp = (d) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Luma//Daily Coach Call//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:luma-daily-${crypto.randomUUID()}@luma`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    "DURATION:PT12M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:Luma is calling — answer in your new language",
    "DESCRIPTION:Your daily active language call. Open Luma and respond to complete it.",
    `URL:${publicCallUrl()}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Luma is calling. Tap to answer.",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  link.download = "luma-daily-coach-call.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function App() {
  const saved = (() => {
    try {
      const value = JSON.parse(localStorage.getItem("luma-profile") || "null");
      if (value?.target === "English" && !value.nativeLanguage) {
        const migrated = {
          ...value,
          target: "Spanish",
          nativeLanguage: "English",
        };
        localStorage.setItem("luma-profile", JSON.stringify(migrated));
        return migrated;
      }
      return value;
    } catch {
      return null;
    }
  })();
  const [view, setView] = useState("home");
  const [profile, setProfile] = useState(saved);
  const [showOnboarding, setShowOnboarding] = useState(!saved);
  const [lesson, setLesson] = useState(0);
  const [listening, setListening] = useState(false);
  const [spoken, setSpoken] = useState("");
  const [speechNotice, setSpeechNotice] = useState("");
  const [done, setDone] = useState(false);
  const [seconds, setSeconds] = useState(180);
  const [callSettings, setCallSettings] = useState(() =>
    readJson("luma-call-settings", defaultCallSettings),
  );
  const [showCallSetup, setShowCallSetup] = useState(false);
  const [incomingCall, setIncomingCall] = useState(
    () => new URLSearchParams(location.search).get("coachCall") === "1",
  );
  const [callCompleteDay, setCallCompleteDay] = useState(
    () => localStorage.getItem("luma-call-complete-day") || "",
  );
  useEffect(() => {
    if (view !== "lesson" || seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [view, seconds]);
  useEffect(() => {
    registerLumaWorker().catch(() => {});
  }, []);
  useEffect(() => {
    const check = () => {
      if (
        !callSettings.enabled ||
        callCompleteDay === localDay() ||
        incomingCall
      )
        return;
      if (localStorage.getItem("luma-call-miss-day") !== localDay()) {
        localStorage.removeItem("luma-call-miss-count");
        localStorage.removeItem("luma-call-retry-at");
      }
      const now = new Date();
      const [h, m] = callSettings.time.split(":").map(Number);
      const retryAt = Number(localStorage.getItem("luma-call-retry-at") || 0);
      const due = retryAt
        ? Date.now() >= retryAt
        : now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
      if (due && localStorage.getItem("luma-call-last-shown") !== localDay()) {
        localStorage.setItem("luma-call-last-shown", localDay());
        setIncomingCall(true);
      }
    };
    check();
    const timer = setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [callSettings, callCompleteDay, incomingCall]);
  const say = (
    text,
    lang = practiceContent[profile?.target]?.lang || "es-ES",
  ) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.86;
    speechSynthesis.speak(u);
  };
  const listen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpeechNotice(
        "Voice recognition is unavailable here. Type your answer below or use the sample.",
      );
      return;
    }
    try {
      const r = new SR();
      r.lang = practiceContent[profile?.target]?.lang || "es-ES";
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.onstart = () => {
        setSpeechNotice("Listening… speak one sentence now.");
        setListening(true);
      };
      r.onend = () => setListening(false);
      r.onerror = () => {
        setListening(false);
        setSpeechNotice(
          "The microphone could not start. Type your answer below or use the sample.",
        );
      };
      r.onresult = (e) => {
        setSpoken(e.results[0][0].transcript);
        setSpeechNotice("Got it — you can edit the transcript before sending.");
      };
      r.start();
    } catch {
      setListening(false);
      setSpeechNotice(
        "The microphone could not start. Type your answer below or use the sample.",
      );
    }
  };
  const saveProfile = (p) => {
    localStorage.setItem("luma-profile", JSON.stringify(p));
    setProfile(p);
    setShowOnboarding(false);
  };
  const saveCallSettings = (s) => {
    localStorage.setItem("luma-call-settings", JSON.stringify(s));
    setCallSettings(s);
    setShowCallSetup(false);
  };
  const completeCall = () => {
    const day = localDay();
    localStorage.setItem("luma-call-complete-day", day);
    localStorage.removeItem("luma-call-retry-at");
    localStorage.removeItem("luma-call-miss-count");
    setCallCompleteDay(day);
    setIncomingCall(false);
  };
  const missCall = () => {
    const count = Number(localStorage.getItem("luma-call-miss-count") || 0) + 1;
    localStorage.setItem("luma-call-miss-day", localDay());
    localStorage.setItem("luma-call-miss-count", String(count));
    if (count < callSettings.retries) {
      localStorage.setItem(
        "luma-call-retry-at",
        String(Date.now() + callSettings.retryMinutes * 60000),
      );
      localStorage.removeItem("luma-call-last-shown");
    } else {
      localStorage.removeItem("luma-call-retry-at");
    }
    setIncomingCall(false);
  };
  if (view === "lesson")
    return (
      <Lesson
        profile={profile}
        step={lesson}
        setStep={setLesson}
        back={() => {
          setView("home");
          setLesson(0);
        }}
        say={say}
        listen={listen}
        listening={listening}
        speechNotice={speechNotice}
        spoken={spoken}
        setSpoken={setSpoken}
        done={done}
        setDone={setDone}
        seconds={seconds}
      />
    );
  if (view === "memory")
    return (
      <Memory
        profile={profile}
        back={() => setView("home")}
        start={() => {
          setSpoken("");
          setSpeechNotice("");
          setView("lesson");
          setLesson(0);
        }}
      />
    );
  return (
    <>
      <Home
        profile={profile}
        configure={() => setShowOnboarding(true)}
        start={() => {
          setSpoken("");
          setSpeechNotice("");
          setSeconds(180);
          setView("lesson");
        }}
        memory={() => setView("memory")}
        callSettings={callSettings}
        callDone={callCompleteDay === localDay()}
        setupCall={() => setShowCallSetup(true)}
        answerCall={() => setIncomingCall(true)}
      />
      {showOnboarding && <Onboarding initial={profile} save={saveProfile} />}{" "}
      {showCallSetup && (
        <CoachCallSetup
          initial={callSettings}
          close={() => setShowCallSetup(false)}
          save={saveCallSettings}
          test={() => setIncomingCall(true)}
        />
      )}{" "}
      {incomingCall && (
        <CoachCall
          profile={profile}
          settings={callSettings}
          complete={completeCall}
          miss={missCall}
        />
      )}
    </>
  );
}

function Onboarding({ initial, save }) {
  const [target, setTarget] = useState(initial?.target || "Spanish");
  const [goal, setGoal] = useState(initial?.goal || "Speak naturally at work");
  const [minutes, setMinutes] = useState(initial?.minutes || 3);
  return (
    <div className="modalback">
      <section className="onboarding">
        <span className="brandmark">L</span>
        <span className="kicker">60-SECOND PERSONAL START</span>
        <h2>
          What should Luma help you <em>live?</em>
        </h2>
        <p>
          Spanish is ready by default for English-speaking judges. Choose any
          language to personalize the demo.
        </p>
        <label>I want to use</label>
        <div className="languagegrid">
          {languages.map((l) => (
            <button
              type="button"
              key={l.name}
              className={target === l.name ? "selected" : ""}
              onClick={() => setTarget(l.name)}
            >
              <b>{l.hello}</b>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
        <label>My next real goal</label>
        <div className="goals">
          {[
            "Speak naturally at work",
            "Travel without freezing",
            "Connect with people",
          ].map((g) => (
            <button
              type="button"
              className={goal === g ? "selected" : ""}
              onClick={() => setGoal(g)}
              key={g}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="minute">
          <span>Daily rhythm</span>
          <div>
            {[3, 5, 10].map((m) => (
              <button
                type="button"
                className={minutes === m ? "selected" : ""}
                onClick={() => setMinutes(m)}
                key={m}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>
        <div className="privacy">
          <ShieldCheck />
          <span>
            <b>Your voice stays yours</b>
            <small>
              Only your transcript is used for feedback. Reset local memory
              anytime.
            </small>
          </span>
        </div>
        <button
          type="button"
          className="primary full"
          onClick={() =>
            save({
              target,
              goal,
              minutes,
              level: "adaptive",
              nativeLanguage: "English",
            })
          }
        >
          Meet my Luma <ArrowRight />
        </button>
      </section>
    </div>
  );
}

function Home({
  start,
  memory,
  profile,
  configure,
  callSettings,
  callDone,
  setupCall,
  answerCall,
}) {
  return (
    <main className="shell">
      <nav>
        <div className="brand">
          <span className="brandmark">L</span>
          <span>Luma</span>
        </div>
        <div className="navright">
          <button className="languagepill" onClick={configure}>
            <Globe2 /> {profile?.target || "Choose language"}
          </button>
          <span className="streak">
            <Flame size={15} fill="currentColor" /> 8 day rhythm
          </span>
          <button className="avatar">ME</button>
        </div>
      </nav>
      <section className="hero">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} /> YOUR LIFE, IN ANOTHER LANGUAGE
          </div>
          <h1>
            Don’t study {profile?.target || "Spanish"}.<br />
            <em>Live it.</em>
          </h1>
          <p>
            Luma turns the moments already in your day into tiny conversations
            your brain remembers—without word lists or homework.
          </p>
          <button type="button" className="primary" onClick={start}>
            Start today’s 3-minute moment <ArrowRight size={18} />
          </button>
          <div className="micro">
            <span>
              <Check />
              No setup
            </span>
            <span>
              <Check />
              Speak from minute one
            </span>
            <span>
              <Check />
              Built around you
            </span>
          </div>
        </div>
        <div className="orbcard">
          <div className="orb">
            <div className="rings"></div>
            <AudioLines size={38} />
          </div>
          <p className="quote">
            “Your 9:30 meeting is in 12 minutes.
            <br />
            Let’s rehearse the one sentence you need.”
          </p>
          <div className="now">
            <span className="pulse"></span>
            <b>Luma is ready</b>
            <span>· 2 min warm-up</span>
          </div>
        </div>
      </section>
      <section className="callstrip">
        <div>
          <span className="callbadge">
            <PhoneCall /> ACTIVE COACH CALL
          </span>
          <h2>
            {callDone
              ? "You answered today."
              : "Luma will not wait for you to remember."}
          </h2>
          <p>
            {callSettings.enabled
              ? `Daily call at ${callSettings.time}. If missed, Luma retries every ${callSettings.retryMinutes} minutes until you respond.`
              : "Turn on a daily call that puts speaking practice directly into your phone schedule."}
          </p>
        </div>
        <div className="callactions">
          <button className="secondary" onClick={setupCall}>
            <Settings2 />{" "}
            {callSettings.enabled ? "Call settings" : "Turn on daily calls"}
          </button>
          {callSettings.enabled && !callDone && (
            <button className="primary" onClick={answerCall}>
              <Phone /> Answer now
            </button>
          )}
        </div>
      </section>
      <section className="today">
        <div className="sectiontitle">
          <div>
            <span className="kicker">MADE FROM YOUR DAY</span>
            <h2>Choose your next real moment</h2>
          </div>
          <button className="textbtn" onClick={memory}>
            See your memory map <ArrowRight size={16} />
          </button>
        </div>
        <div className="scenegrid">
          {scenes.map((s, i) => (
            <button
              className={"scene " + (i === 0 ? "featured" : "")}
              key={s.id}
              onClick={start}
            >
              <div className="sceneicon">{s.icon}</div>
              <div>
                <span className="tag">
                  {i === 0 ? "NEXT UP" : "LATER TODAY"}
                </span>
                <h3>{s.title}</h3>
                <p>{s.sub}</p>
                <div className="meta">
                  <span>
                    <Clock3 /> {s.time}
                  </span>
                  <span>{s.level}</span>
                </div>
              </div>
              <span className="go">
                <ArrowRight />
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="proof">
        <span className="kicker">THE LUMA LOOP</span>
        <h2>One moment. Four skills. Zero studying.</h2>
        <div className="loop">
          {[
            ["01", "Hear", "Meaning before translation"],
            ["02", "Say", "Your words, not a script"],
            ["03", "Refine", "One useful correction"],
            ["04", "Reappear", "Right before you forget"],
          ].map((x, i) => (
            <div className="loopitem" key={x[1]}>
              <b>{x[0]}</b>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
              {i < 3 && <ArrowRight />}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function CoachCallSetup({ initial, close, save, test }) {
  const [settings, setSettings] = useState({ ...initial });
  const [notice, setNotice] = useState("");
  const enable = async () => {
    let permission = "unsupported";
    if ("Notification" in window) {
      permission = Notification.permission;
      if (permission === "default")
        permission = await Notification.requestPermission();
    }
    await registerLumaWorker().catch(() => {});
    setSettings((s) => ({ ...s, enabled: true }));
    setNotice(
      permission === "granted"
        ? "Notifications are allowed. Add the recurring calendar call next."
        : "Browser notifications were not allowed. The calendar call still works.",
    );
  };
  return (
    <div className="modalback">
      <section className="callsetup">
        <button className="close setupclose" onClick={close}>
          <X />
        </button>
        <span className="brandmark">
          <PhoneCall />
        </span>
        <span className="kicker">PROACTIVE MODE</span>
        <h2>Luma calls first.</h2>
        <p>
          You choose the safe window once. After that, the task remains due
          until you answer in the language you are learning.
        </p>
        <label>Daily call time</label>
        <input
          type="time"
          value={settings.time}
          onChange={(e) => setSettings({ ...settings, time: e.target.value })}
        />
        <label>When I miss it</label>
        <div className="retryrow">
          <select
            value={settings.retryMinutes}
            onChange={(e) =>
              setSettings({ ...settings, retryMinutes: Number(e.target.value) })
            }
          >
            <option value="5">Retry in 5 minutes</option>
            <option value="10">Retry in 10 minutes</option>
            <option value="15">Retry in 15 minutes</option>
          </select>
          <select
            value={settings.retries}
            onChange={(e) =>
              setSettings({ ...settings, retries: Number(e.target.value) })
            }
          >
            <option value="2">Up to 2 retries</option>
            <option value="3">Up to 3 retries</option>
            <option value="5">Up to 5 retries</option>
          </select>
        </div>
        <div className="callpromise">
          <ShieldCheck />
          <span>
            <b>Firm, never unsafe</b>
            <small>
              Luma can keep the learning task overdue and retry inside your
              window. Your phone always keeps emergency controls and
              notification settings.
            </small>
          </span>
        </div>
        {notice && <div className="notice">{notice}</div>}
        <button className="primary full" onClick={enable}>
          <Bell /> Allow reminders
        </button>
        <button
          className="secondary full"
          onClick={() => downloadCallCalendar(settings)}
        >
          <CalendarPlus /> Add the daily call to my phone calendar
        </button>
        {initial.enabled && (
          <button
            className="textbtn pausecall"
            onClick={() => setSettings((s) => ({ ...s, enabled: false }))}
          >
            Pause proactive mode
          </button>
        )}
        <div className="setupfooter">
          <button className="textbtn" onClick={test}>
            Test a call now
          </button>
          <button className="primary" onClick={() => save(settings)}>
            Save proactive mode <ArrowRight />
          </button>
        </div>
      </section>
    </div>
  );
}

function CoachCall({ profile, settings, complete, miss }) {
  const [answered, setAnswered] = useState(false);
  const [spoken, setSpoken] = useState("");
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [callNotice, setCallNotice] = useState("");
  const [recognitionConfidence, setRecognitionConfidence] = useState(null);
  const [learnerTurns, setLearnerTurns] = useState(0);
  const prompt = coachPrompts[profile?.target] || coachPrompts.English;
  const [messages, setMessages] = useState(() => [
    {
      role: "coach",
      text: prompt.text,
      translation: prompt.translation,
    },
  ]);
  const answerRef = useRef(null);
  const threadRef = useRef(null);
  useEffect(() => {
    navigator.vibrate?.([300, 180, 300, 180, 600]);
    const t = setInterval(() => navigator.vibrate?.([300, 180, 300]), 2200);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, feedback]);
  const speakCoach = (text, rate = 0.82) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = prompt.lang;
    u.rate = rate;
    speechSynthesis.speak(u);
  };
  const answer = () => {
    setAnswered(true);
    navigator.vibrate?.(0);
    navigator.wakeLock?.request?.("screen").catch(() => {});
    speakCoach(prompt.text);
  };
  const listen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setCallNotice(
        "Voice recognition is unavailable here. Type below or use the sample.",
      );
      return;
    }
    try {
      const r = new SR();
      r.lang = prompt.lang;
      r.onstart = () => {
        setListening(true);
        setCallNotice("Listening…");
      };
      r.onend = () => setListening(false);
      r.onerror = () => {
        setListening(false);
        setCallNotice(
          "The microphone could not start. Type below or use the sample.",
        );
      };
      r.onresult = (e) => {
        const result = e.results[0][0];
        setSpoken(result.transcript);
        setRecognitionConfidence(
          Number.isFinite(result.confidence) ? result.confidence : null,
        );
        setCallNotice(
          "I captured your words. Check the transcript, then send it for coaching.",
        );
      };
      r.start();
    } catch {
      setListening(false);
      setCallNotice(
        "The microphone could not start. Type below or use the sample.",
      );
    }
  };
  const respond = async (intent = "respond") => {
    const isAnswer = intent === "respond";
    if (isAnswer && !spoken.trim()) {
      setCallNotice(
        `Say or type your answer in ${profile?.target || "Spanish"} first. You can also ask for help below.`,
      );
      answerRef.current?.focus();
      return;
    }
    const helpLabels = {
      clarify: "I didn’t understand. Please explain and ask me again.",
      vocabulary: "Explain the important words in your last sentence.",
    };
    const learnerText = isAnswer ? spoken.trim() : helpLabels[intent];
    const nextHistory = [
      ...messages,
      { role: "learner", text: learnerText, intent },
    ];
    setLoading(true);
    setCallNotice("");
    try {
      const r = await fetch(coachApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: profile?.target || "Spanish",
          nativeLanguage: profile?.nativeLanguage || "English",
          scenario: "a proactive morning accountability call before work",
          utterance: learnerText,
          intent,
          recognitionConfidence,
          turn: learnerTurns,
          history: nextHistory.slice(-8),
        }),
      });
      if (!r.ok) throw new Error();
      const result = await r.json();
      setFeedback(result);
      setMessages([
        ...nextHistory,
        {
          role: "coach",
          text: result.reply,
          translation: result.replyTranslation,
        },
      ]);
      speakCoach(result.reply);
    } catch {
      const result = offlineCoachReply(
        profile?.target || "Spanish",
        learnerText,
        intent,
        learnerTurns,
      );
      setFeedback(result);
      setMessages([
        ...nextHistory,
        {
          role: "coach",
          text: result.reply,
          translation: result.replyTranslation,
        },
      ]);
      speakCoach(result.reply);
    } finally {
      if (isAnswer) setLearnerTurns((count) => count + 1);
      setSpoken("");
      setLoading(false);
    }
  };
  if (!answered)
    return (
      <div className="incoming">
        <div className="incomingrings"></div>
        <div className="caller">
          <span className="brandmark">L</span>
          <span className="kicker">DAILY LANGUAGE CALL</span>
          <h1>Luma</h1>
          <p>Your {profile?.target || "English"} coach is calling</p>
        </div>
        <div className="incomingactions">
          <button className="decline" onClick={miss}>
            <X />
            <span>Retry in {settings.retryMinutes} min</span>
          </button>
          <button className="accept" onClick={answer}>
            <Phone />
            <span>Answer</span>
          </button>
        </div>
      </div>
    );
  return (
    <div className="incoming calllive">
      <div className="livehead">
        <span className="pulse"></span>
        <b>Luma · live coach</b>
        <span>{learnerTurns}/3 replies</span>
      </div>
      <section className="conversationcall">
        <span className="kicker">LIVE · INTERACTIVE · ADAPTIVE</span>
        <h1>
          Have a real <em>conversation.</em>
        </h1>
        <p>
          Answer, ask questions, and try again. Luma explains what you miss and
          coaches every reply in {profile?.target || "Spanish"}.
        </p>
        <div className="callthread" ref={threadRef} aria-live="polite">
          {messages.map((message, index) => (
            <article className={`bubblemsg ${message.role}`} key={index}>
              <b>{message.role === "coach" ? "Luma" : "You"}</b>
              <p>{message.text}</p>
              {message.translation && message.role === "coach" && (
                <small>{message.translation}</small>
              )}
              {message.role === "coach" && (
                <button
                  type="button"
                  className="replayline"
                  onClick={() => speakCoach(message.text, 0.75)}
                >
                  <Volume2 /> Hear slowly
                </button>
              )}
            </article>
          ))}
          {loading && (
            <article className="bubblemsg coach thinking">
              <AudioLines /> Luma is listening deeply…
            </article>
          )}
        </div>
        {feedback && (
          <div className="feedbackdeck">
            <div className="feedbacksummary">
              <Check />
              <div>
                <b>Meaning</b>
                <p>{feedback.praise}</p>
              </div>
            </div>
            <div className="coachgrid">
              {(feedback.grammarCorrection || feedback.refinement) && (
                <article>
                  <span>GRAMMAR & CLARITY</span>
                  <p>{feedback.grammarCorrection || feedback.refinement}</p>
                </article>
              )}
              {feedback.naturalVersion && (
                <article>
                  <span>A MORE NATURAL WAY</span>
                  <p>“{feedback.naturalVersion}”</p>
                  <button
                    type="button"
                    onClick={() => speakCoach(feedback.naturalVersion, 0.72)}
                  >
                    <Volume2 /> Hear it
                  </button>
                </article>
              )}
              {feedback.pronunciation && (
                <article>
                  <span>PRONUNCIATION FOCUS</span>
                  <p>{feedback.pronunciation}</p>
                  {recognitionConfidence !== null && (
                    <small>
                      Speech recognition confidence: {Math.round(recognitionConfidence * 100)}%
                    </small>
                  )}
                </article>
              )}
              {(feedback.vocabulary || []).length > 0 && (
                <article className="wordcard">
                  <span>WORDS IN CONTEXT</span>
                  {(feedback.vocabulary || []).slice(0, 2).map((word, index) => (
                    <div key={`${word.term}-${index}`}>
                      <b>{word.term}</b>
                      <small>{word.meaning}</small>
                      <p>{word.example}</p>
                    </div>
                  ))}
                </article>
              )}
            </div>
            {feedback.naturalVersion && (
              <button
                type="button"
                className="secondary retryphrase"
                onClick={() => {
                  setSpoken(feedback.naturalVersion);
                  requestAnimationFrame(() => answerRef.current?.focus());
                }}
              >
                <Repeat2 /> Try the corrected sentence
              </button>
            )}
          </div>
        )}
        <div className="helpactions">
          <button type="button" disabled={loading} onClick={() => respond("clarify")}>
            <CircleHelp /> I didn’t understand
          </button>
          <button type="button" disabled={loading} onClick={() => respond("vocabulary")}>
            <BookOpen /> Explain the words
          </button>
          <button
            type="button"
            onClick={() => speakCoach(messages.at(-1)?.text || prompt.text, 0.62)}
          >
            <Volume2 /> Say it more slowly
          </button>
        </div>
        {callNotice && (
          <p className="speechnotice" role="status">
            {callNotice}
          </p>
        )}
        <div className="callcomposer">
          <button
            type="button"
            className={"mic compactmic " + (listening ? "active" : "")}
            onClick={listen}
            aria-label={`Speak in ${profile?.target || "Spanish"}`}
          >
            <Mic />
            <span>{listening ? "Listening…" : "Speak"}</span>
          </button>
          <textarea
            ref={answerRef}
            value={spoken}
            onChange={(e) => {
              setSpoken(e.target.value);
              setRecognitionConfidence(null);
              setCallNotice("");
            }}
            placeholder={`Answer or ask in ${profile?.target || "Spanish"}…`}
          />
          <button
            type="button"
            className="sendanswer"
            disabled={loading}
            onClick={() => respond("respond")}
            aria-label="Send my answer"
          >
            <Send />
          </button>
        </div>
        <button
          type="button"
          className="type sample callsample"
          onClick={() => {
            setSpoken(prompt.sample);
            setRecognitionConfidence(null);
            requestAnimationFrame(() => answerRef.current?.focus());
          }}
        >
          Use a sample answer
        </button>
        <div className="callprogress">
          <span>
            {learnerTurns < 3
              ? `${3 - learnerTurns} more real ${3 - learnerTurns === 1 ? "reply" : "replies"} to complete today’s call`
              : "Conversation complete—your coach has enough evidence for today."}
          </span>
          <i><u style={{ width: `${Math.min(100, (learnerTurns / 3) * 100)}%` }} /></i>
        </div>
        {learnerTurns >= 3 && (
          <button type="button" className="primary full" onClick={complete}>
            Complete today’s conversation <Check />
          </button>
        )}
      </section>
    </div>
  );
}

function Lesson({
  profile,
  step,
  setStep,
  back,
  say,
  listen,
  listening,
  speechNotice,
  spoken,
  setSpoken,
  done,
  setDone,
  seconds,
}) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState("");
  const answerRef = useRef(null);
  const copy = practiceContent[profile?.target] || practiceContent.Spanish;
  const mins = String(Math.floor(seconds / 60));
  const secs = String(seconds % 60).padStart(2, "0");
  const advance = () => setStep((s) => Math.min(3, s + 1));
  const getFeedback = async () => {
    if (!spoken.trim()) {
      setValidation(
        `Say or type one sentence in ${profile?.target || "Spanish"} first.`,
      );
      answerRef.current?.focus();
      return;
    }
    setValidation("");
    setLoading(true);
    try {
      const r = await fetch(coachApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: profile?.target || "Spanish",
          scenario: "ordering coffee before a work meeting",
          utterance: spoken,
        }),
      });
      if (!r.ok) throw new Error("demo");
      setFeedback(await r.json());
    } catch {
      setFeedback({
        understood: true,
        praise: "You were completely understood.",
        refinement: copy.refinement,
        naturalVersion: copy.prompt,
        memoryHook:
          "Luma will reuse this request frame tomorrow in a new real-life situation.",
      });
    } finally {
      setLoading(false);
      advance();
    }
  };
  return (
    <main className="lessonShell">
      <header className="lessonnav">
        <button className="iconbtn" onClick={back}>
          <ChevronLeft />
        </button>
        <div className="progress">
          <i style={{ width: `${(step + 1) * 25}%` }} />
        </div>
        <span>
          {mins}:{secs}
        </span>
        <button className="close" onClick={back}>
          <X />
        </button>
      </header>
      {step === 0 && (
        <section className="lesson">
          <span className="kicker">
            MOMENT 1 · COFFEE SHOP ·{" "}
            {profile?.target?.toUpperCase() || "SPANISH"}
          </span>
          <h1>
            Listen for the <em>shape</em>,<br />
            not every word.
          </h1>
          <p className="instruction">
            You’re ordering before work. Tap to hear the barista once. What
            matters is the choice they’re offering.
          </p>
          <button
            type="button"
            className="sound"
            onClick={() => say(copy.hear, copy.lang)}
          >
            <span>
              <Volume2 />
            </span>
            <div className="wave">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <i key={n} />
              ))}
            </div>
            <b>Play</b>
          </button>
          <div className="choices">
            <button type="button" onClick={advance}>
              {copy.choice}
            </button>
            <button type="button" onClick={advance}>
              {copy.alternative}
            </button>
          </div>
          <button type="button" className="skip" onClick={advance}>
            I’m not sure — show me gently
          </button>
        </section>
      )}
      {step === 1 && (
        <section className="lesson speak">
          <span className="kicker">
            NOW MAKE IT YOURS · {profile?.target?.toUpperCase() || "SPANISH"}
          </span>
          <h1>
            Order what you’d
            <br />
            <em>actually drink.</em>
          </h1>
          <p className="prompt">“{copy.prompt}”</p>
          <button
            type="button"
            className={"mic " + (listening ? "active" : "")}
            onClick={listen}
            aria-label={`Speak in ${profile?.target || "Spanish"}`}
          >
            <Mic size={34} />
            <span>{listening ? "Listening…" : "Tap to speak"}</span>
          </button>
          {speechNotice && (
            <p className="speechnotice" role="status">
              {speechNotice}
            </p>
          )}
          <label className="answerlabel" htmlFor="luma-answer">
            Your answer in {profile?.target || "Spanish"}
          </label>
          <textarea
            id="luma-answer"
            ref={answerRef}
            className="answerinput"
            value={spoken}
            onChange={(e) => {
              setSpoken(e.target.value);
              setValidation("");
            }}
            placeholder={`Type your ${profile?.target || "Spanish"} sentence here…`}
          />
          {validation && (
            <p className="validation" role="alert">
              {validation}
            </p>
          )}
          <button
            type="button"
            className="primary compact"
            disabled={loading}
            onClick={getFeedback}
          >
            {loading
              ? "Luma is listening deeply…"
              : "See one useful refinement"}{" "}
            {!loading && <ArrowRight />}
          </button>
          <button
            type="button"
            className="type sample"
            onClick={() => {
              setSpoken(copy.prompt);
              setValidation("");
              requestAnimationFrame(() => answerRef.current?.focus());
            }}
          >
            Use the sample answer
          </button>
        </section>
      )}
      {step === 2 && (
        <section className="lesson feedback">
          <span className="kicker">ONE CHANGE, BIGGER IMPACT</span>
          <div className="coach">
            <div className="coachhead">
              <span className="miniavatar">L</span>
              <div>
                <b>Luma noticed</b>
                <small>AI clarity coach</small>
              </div>
            </div>
            <h2>{feedback?.praise || "You were completely understood."}</h2>
            <p>{feedback?.refinement || copy.refinement}</p>
            <div className="rhythm">
              <span>your first try</span>
              <ArrowRight />
              <b>{feedback?.naturalVersion || copy.chunk}</b>
              <button
                type="button"
                onClick={() =>
                  say(feedback?.naturalVersion || copy.prompt, copy.lang)
                }
              >
                <Play size={15} />
              </button>
            </div>
          </div>
          <div className="win">
            <Check />
            <span>
              <b>Meaning landed</b>
              <small>
                {feedback?.memoryHook ||
                  "You communicated successfully—refinement comes second."}
              </small>
            </span>
          </div>
          <button type="button" className="primary compact" onClick={advance}>
            Lock it into memory <ArrowRight />
          </button>
        </section>
      )}
      {step === 3 && (
        <section className="lesson finish">
          <div className="celebrate">
            <Sparkles />
          </div>
          <span className="kicker">MOMENT COMPLETE</span>
          <h1>
            You didn’t study.
            <br />
            <em>You did the thing.</em>
          </h1>
          <div className="stats">
            <div>
              <b>3:02</b>
              <span>minutes</span>
            </div>
            <div>
              <b>4</b>
              <span>skills touched</span>
            </div>
            <div>
              <b>1</b>
              <span>memory formed</span>
            </div>
          </div>
          <div className="return">
            <Clock3 />
            <div>
              <b>Luma will bring this back tomorrow</b>
              <p>
                Inside a meeting sentence—just before your brain is likely to
                lose it.
              </p>
            </div>
          </div>
          <button
            className="primary"
            onClick={() => {
              setDone(true);
              back();
            }}
          >
            Back to my day <ArrowRight />
          </button>
        </section>
      )}
    </main>
  );
}

function Memory({ profile, back, start }) {
  const copy = practiceContent[profile?.target] || practiceContent.Spanish;
  return (
    <main className="memoryShell">
      <nav>
        <button className="iconbtn" onClick={back}>
          <ChevronLeft />
        </button>
        <div className="brand">
          <span className="brandmark">L</span>
          <span>Your living memory</span>
        </div>
        <span>12 moments learned</span>
      </nav>
      <section className="memoryhero">
        <span className="kicker">NOT A VOCABULARY LIST</span>
        <h1>
          What your brain can <em>use.</em>
        </h1>
        <p>
          Luma tracks situations and intentions—not isolated words. Every memory
          returns in a new context until it becomes automatic.
        </p>
      </section>
      <div className="memorygrid">
        <div className="mapcard">
          <div className="mapcenter">
            YOU
            <span>
              42 useful
              <br />
              connections
            </span>
          </div>
          {[
            ["COFFEE", "top left", "var(--coral)"],
            ["MEETINGS", "top right", "#506c59"],
            ["TRAVEL", "bottom left", "#355d7a"],
            ["SMALL TALK", "bottom right", "#b07d35"],
          ].map((x) => (
            <div
              className={"bubble " + x[1]}
              style={{ "--c": x[2] }}
              key={x[0]}
            >
              {x[0]}
            </div>
          ))}
        </div>
        <div className="queue">
          <span className="kicker">
            NEXT BEST REAPPEARANCE ·{" "}
            {profile?.target?.toUpperCase() || "SPANISH"}
          </span>
          <h2>“{copy.chunk}…”</h2>
          <p>
            Next time, this phrase moves from ordering coffee to asking for
            clarification in your meeting.
          </p>
          <div className="retention">
            <span>Estimated memory</span>
            <b>72%</b>
            <i>
              <u />
            </i>
          </div>
          <button type="button" className="primary" onClick={start}>
            Practice now · 90 sec <ArrowRight />
          </button>
          <div className="due">
            <Clock3 />
            <span>
              <b>Perfect window</b>
              <small>Due in about 18 hours</small>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

const rootElement = document.getElementById("root");
const root = rootElement.__lumaRoot || createRoot(rootElement);
rootElement.__lumaRoot = root;
root.render(<App />);
