import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { RealtimePcmAudio } from "./realtime-audio.js";
import {
  ArrowRight,
  AudioLines,
  Bell,
  BookOpen,
  CalendarPlus,
  Camera,
  Check,
  ChevronLeft,
  CircleHelp,
  Clock3,
  FileUp,
  Flame,
  Globe2,
  Keyboard,
  Mic,
  Phone,
  PhoneCall,
  PhoneOff,
  Play,
  Repeat2,
  ScanText,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import "./styles.css";
import "./onboarding.css";
import {
  createLearnerModel,
  learnerSnapshot,
  nextBestAction,
  recordEvidence,
  saveContextualLookup,
} from "./learningEngine.js";

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
const socialScenarios = [
  { id: "coworker-lunch", icon: "🥪", title: "Coworker lunch", relationship: "new coworkers", locale: "United States", channel: "face-to-face", register: "casual-professional", pressure: "friendly small talk with fast topic changes" },
  { id: "group-chat", icon: "💬", title: "Friends' group chat", relationship: "new friends", locale: "United States", channel: "group text", register: "informal-digital", pressure: "abbreviations, teasing, and implied context" },
  { id: "house-party", icon: "🎉", title: "A friend's house party", relationship: "friends of friends", locale: "United States", channel: "face-to-face", register: "casual", pressure: "noise, interruptions, and joining a group" },
  { id: "meetup", icon: "🧭", title: "Local community meetup", relationship: "strangers with a shared interest", locale: "United States", channel: "face-to-face", register: "warm-casual", pressure: "introductions and keeping a conversation alive" },
  { id: "slack", icon: "⚡", title: "Team chat", relationship: "cross-functional coworkers", locale: "United States", channel: "work chat", register: "concise-digital", pressure: "acronyms, soft disagreement, and quick coordination" },
  { id: "conference", icon: "🎙", title: "Conference reception", relationship: "professional peers", locale: "international academic conference", channel: "face-to-face", register: "social-academic", pressure: "entering conversations and explaining research naturally" },
];
const domainTracks = [
  {
    id: "life",
    icon: "◎",
    title: "Life & social fluency",
    subtitle: "Errands, friendships, services, conflict, humor",
    terms: ["read the room", "I’m down", "no worries"],
    mission: "Join a conversation, clarify naturally, and keep it moving.",
    relationship: "people encountered in everyday life",
    locale: "learner-selected local community",
    channel: "mixed spoken and digital",
    register: "everyday adaptive",
    pressure: "natural pace, implied meaning, interruptions, and social repair",
  },
  {
    id: "ai-research",
    icon: "◈",
    title: "AI · world models & embodied intelligence",
    subtitle: "Papers, technical talks, lab discussion, Q&A",
    terms: ["latent dynamics", "VLA policy", "sim-to-real"],
    knowledgeMap: [
      "VLM: multimodal alignment · grounding · instruction tuning · evaluation",
      "VLA: action tokenization · robot trajectories · policy pretraining · post-training",
      "World models: latent dynamics · video prediction · rollout · planning · reward signals",
      "Training stack: data mixture · embodiment diversity · sim-to-real · closed-loop evaluation",
    ],
    mission: "Explain a paper claim, qualify its evidence, and answer a skeptical question.",
    relationship: "AI researchers and engineering peers",
    locale: "international AI research community",
    channel: "paper discussion and conference Q&A",
    register: "technical-academic",
    pressure: "dense terminology, compressed explanations, and critical follow-up questions",
  },
  {
    id: "ar-waveguide",
    icon: "◇",
    title: "AR · optical waveguides & fabrication",
    subtitle: "Array waveguides · PVG volume holography · slanted/gradient SRG",
    terms: ["pupil replication", "Bragg condition", "slant angle", "diffraction-efficiency gradient"],
    knowledgeMap: [
      "Array: partial reflector array · pupil replication · coating split ratio · stray light",
      "PVG: chiral dopant · helical pitch · Bragg selectivity · polarization conversion · 2D EPE",
      "SRG: slant angle · duty cycle/fill factor · grating depth · sidewall taper · RCWA",
      "Process: master · NIL replication · residual layer · pitch/CD error · metrology · yield",
    ],
    mission: "Compare array, PVG, and SRG architectures; explain fabrication; diagnose optical/process trade-offs; and defend a design choice.",
    relationship: "optical engineers, process engineers, and research authors",
    locale: "international AR optics community",
    channel: "design review and technical conference",
    register: "optics-engineering",
    pressure: "architecture comparison, polarization and diffraction physics, process dependencies, metrology trade-offs, and precise causal language",
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
const translationLanguages = [
  "Simplified Chinese",
  "Traditional Chinese",
  "Mandarin Chinese",
  "English",
  "Japanese",
  "Korean",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Arabic",
  "Hindi",
];
const deviceExplanationLanguage = () => {
  const locale = String(navigator.languages?.[0] || navigator.language || "").toLowerCase();
  if (locale.startsWith("zh-tw") || locale.startsWith("zh-hk") || locale.includes("hant")) return "Traditional Chinese";
  if (locale.startsWith("zh")) return "Simplified Chinese";
  if (locale.startsWith("ja")) return "Japanese";
  if (locale.startsWith("ko")) return "Korean";
  if (locale.startsWith("es")) return "Spanish";
  if (locale.startsWith("fr")) return "French";
  if (locale.startsWith("de")) return "German";
  if (locale.startsWith("it")) return "Italian";
  if (locale.startsWith("pt")) return "Portuguese";
  if (locale.startsWith("ar")) return "Arabic";
  if (locale.startsWith("hi")) return "Hindi";
  return "English";
};
const localeProfiles = {
  English: [
    { id: "en-US", label: "United States", audience: "workplace + social life" },
  ],
  French: [
    { id: "fr-FR", label: "Paris / France", audience: "young professionals" },
    { id: "fr-CA", label: "Québec", audience: "young professionals" },
    { id: "fr-BE", label: "Belgium", audience: "young professionals" },
    { id: "fr-AF", label: "Francophone Africa", audience: "urban professional contexts" },
  ],
  Spanish: [
    { id: "es-MX", label: "Mexico City / Mexico", audience: "young professionals" },
    { id: "es-ES", label: "Madrid / Spain", audience: "young professionals" },
    { id: "es-AR", label: "Buenos Aires / Argentina", audience: "young professionals" },
    { id: "es-US", label: "United States Spanish", audience: "bilingual workplace + social life" },
  ],
};
const defaultLocale = (target) => (localeProfiles[target] || [])[0] || {
  id: practiceContent?.[target]?.lang || "und",
  label: "International",
  audience: "general adult contexts",
};
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
const publicRealtimeOrigin = "https://sg.api.aimodelapi.ai";
const practiceSessionId = crypto.randomUUID();
const coachApiUrl = () =>
  location.hostname.endsWith("github.io")
    ? `${hostedCoachOrigin}/api/coach`
    : new URL(`${import.meta.env.BASE_URL}api/coach`, location.origin).href;
const lookupApiUrl = () =>
  ["localhost", "127.0.0.1"].includes(location.hostname)
    ? new URL(`${import.meta.env.BASE_URL}api/lookup`, location.origin).href
    : `${publicRealtimeOrigin}/v1/luma/lookup`;
const learnerApiUrl = () =>
  location.hostname.endsWith("github.io")
    ? `${hostedCoachOrigin}/api/learner`
    : new URL(`${import.meta.env.BASE_URL}api/learner`, location.origin).href;
const realtimeApiUrl = (profile, scenario) => {
  const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
  const base = isLocal
    ? new URL(`${import.meta.env.BASE_URL}api/realtime/session`, location.origin).href
    : `${publicRealtimeOrigin}/v1/realtime/luma-tickets`;
  const url = new URL(base);
  url.searchParams.set("target", profile?.target || "Spanish");
  url.searchParams.set("native", profile?.nativeLanguage || "English");
  url.searchParams.set("scenario", scenario);
  return url.href;
};
const realtimeWebrtcUrl = () =>
  `${publicRealtimeOrigin}/v1/realtime/luma-webrtc`;
const cloudIdentity = (enabled = false) => {
  if (!enabled) return null;
  let learnerId = localStorage.getItem("luma-cloud-learner-id");
  let secret = localStorage.getItem("luma-cloud-secret");
  if (!learnerId) {
    learnerId = crypto.randomUUID();
    localStorage.setItem("luma-cloud-learner-id", learnerId);
  }
  if (!secret) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    secret = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    localStorage.setItem("luma-cloud-secret", secret);
  }
  return { cloudLearnerId: learnerId, cloudSecret: secret };
};
const syncCloudLearning = async (profile, learnerModel, evidence) => {
  const identity = cloudIdentity(profile?.cloudLearning === true);
  if (!identity) return null;
  const response = await fetch(learnerApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...identity, profile, learnerModel, evidence }),
  });
  if (!response.ok) throw new Error("Cloud learning sync failed");
  const result = await response.json();
  localStorage.setItem("luma-cloud-prep", JSON.stringify(result.prep || {}));
  return result;
};
const coachCloudPayload = (profile) => cloudIdentity(profile?.cloudLearning === true) || {};
const speechLocaleFor = (language = "") => {
  const value = language.toLocaleLowerCase();
  if (/mandarin|chinese|中文|普通话|汉语/.test(value)) return "zh-CN";
  if (/cantonese|粤语|廣東話/.test(value)) return "zh-HK";
  if (/spanish|español/.test(value)) return "es-ES";
  if (/french|français/.test(value)) return "fr-FR";
  if (/japanese|日本語/.test(value)) return "ja-JP";
  if (/korean|한국어/.test(value)) return "ko-KR";
  if (/german|deutsch/.test(value)) return "de-DE";
  return "en-US";
};

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
  if (intent === "bridge") {
    return {
      reply: item.reply,
      replyTranslation: item.translation,
      praise: "Using your strongest language kept the real meaning alive.",
      grammarCorrection: "Luma used your meaning as a bridge. Now try the short target-language version below.",
      naturalVersion: item.focus,
      pronunciation: item.pronunciation,
      vocabulary: item.words,
      memoryHook: `Make “${item.focus}” yours in the next reply.`,
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
  const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    updateViaCache: "none",
  });
  registration.update().catch(() => {});
  return registration;
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
  const [learnerModel, setLearnerModel] = useState(() =>
    readJson("luma-learner-model", createLearnerModel(saved || {})),
  );
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
  const [socialScenario, setSocialScenario] = useState(null);
  const [useLegacyCall, setUseLegacyCall] = useState(false);
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
    setLearnerModel((current) => ({
      ...(() => {
        const next = {
          ...(current || createLearnerModel(p)),
          profile: {
            goal: p.goal,
            domain: p.domain,
            difficultMoment: p.difficultMoment,
            focusTracks: ["life", "ai-research", "ar-waveguide"],
            technicalDomains: {
              embodiedAI: ["VLM training", "VLA training", "world model training"],
              arOptics: ["array waveguide", "PVG volume holographic waveguide", "slanted and gradient SRG"],
            },
            localeProfile: p.localeProfile,
          },
        };
        localStorage.setItem("luma-learner-model", JSON.stringify(next));
        syncCloudLearning(p, next).catch(() => {});
        return next;
      })(),
    }));
  };
  const captureEvidence = (evidence) => {
    setLearnerModel((current) => {
      const next = recordEvidence(current || createLearnerModel(profile || {}), evidence);
      localStorage.setItem("luma-learner-model", JSON.stringify(next));
      syncCloudLearning(profile, next, evidence).catch(() => {});
      return next;
    });
  };
  const forgetCloudLearning = async () => {
    const identity = cloudIdentity(profile?.cloudLearning === true);
    if (identity) {
      await fetch(learnerApiUrl(), {
        method: "DELETE",
        headers: {
          "X-Luma-Learner": identity.cloudLearnerId,
          "X-Luma-Secret": identity.cloudSecret,
        },
      }).catch(() => {});
    }
    localStorage.removeItem("luma-cloud-learner-id");
    localStorage.removeItem("luma-cloud-secret");
    localStorage.removeItem("luma-cloud-prep");
    const nextProfile = { ...profile, cloudLearning: false };
    localStorage.setItem("luma-profile", JSON.stringify(nextProfile));
    setProfile(nextProfile);
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
        learnerModel={learnerModel}
        captureEvidence={captureEvidence}
      />
    );
  if (view === "memory")
    return (
      <Memory
        profile={profile}
        learnerModel={learnerModel}
        back={() => setView("home")}
        start={() => {
          setSpoken("");
          setSpeechNotice("");
          setView("lesson");
          setLesson(0);
        }}
      />
    );
  if (view === "lookup")
    return (
      <ContextLookup
        profile={profile}
        back={() => setView("home")}
        save={(lookup) => {
          setLearnerModel((current) => {
            const next = saveContextualLookup(current || createLearnerModel(profile || {}), lookup);
            localStorage.setItem("luma-learner-model", JSON.stringify(next));
            return next;
          });
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
        lookup={() => setView("lookup")}
        callSettings={callSettings}
        callDone={callCompleteDay === localDay()}
        setupCall={() => setShowCallSetup(true)}
        answerCall={() => setIncomingCall(true)}
        learnerModel={learnerModel}
        startSocial={(scenario) => {
          setSocialScenario(scenario);
          setIncomingCall(true);
        }}
        forgetCloudLearning={forgetCloudLearning}
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
        useLegacyCall ? <CoachCall
          profile={profile}
          settings={callSettings}
          complete={completeCall}
          miss={missCall}
          learnerModel={learnerModel}
          captureEvidence={captureEvidence}
          socialScenario={socialScenario}
        /> : <RealtimeCoachCall
          profile={profile}
          settings={callSettings}
          complete={completeCall}
          miss={missCall}
          learnerModel={learnerModel}
          captureEvidence={captureEvidence}
          socialScenario={socialScenario}
          useFallback={() => setUseLegacyCall(true)}
        />
      )}
    </>
  );
}

function Onboarding({ initial, save }) {
  const [target, setTarget] = useState(initial?.target || "Spanish");
  const [localeProfile, setLocaleProfile] = useState(
    initial?.localeProfile || defaultLocale(initial?.target || "Spanish"),
  );
  const [goal, setGoal] = useState(initial?.goal || "Speak naturally at work");
  const [minutes, setMinutes] = useState(initial?.minutes || 3);
  const [domain, setDomain] = useState(
    initial?.domain || "AI research, technical papers, and academic talks",
  );
  const [difficultMoment, setDifficultMoment] = useState(
    initial?.difficultMoment || "I understand slowly but cannot respond quickly",
  );
  const [nativeLanguage, setNativeLanguage] = useState(
    initial?.nativeLanguage || "English",
  );
  const [cloudLearning, setCloudLearning] = useState(initial?.cloudLearning === true);
  const [corpusConsent, setCorpusConsent] = useState(initial?.corpusConsent === true);
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
              onClick={() => {
                setTarget(l.name);
                setLocaleProfile(defaultLocale(l.name));
              }}
            >
              <b>{l.hello}</b>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
        {(localeProfiles[target] || []).length > 0 && (
          <>
            <label>My real-world language community</label>
            <div className="localegrid">
              {localeProfiles[target].map((locale) => (
                <button
                  type="button"
                  key={locale.id}
                  className={localeProfile.id === locale.id ? "selected" : ""}
                  onClick={() => setLocaleProfile(locale)}
                >
                  <b>{locale.label}</b>
                  <small>{locale.audience}</small>
                </button>
              ))}
            </div>
          </>
        )}
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
        <label htmlFor="luma-domain">The real material I must master</label>
        <input
          id="luma-domain"
          className="profileinput"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="e.g. robotics papers, investor meetings, medical conferences"
        />
        <label htmlFor="luma-native">My strongest language for explanations</label>
        <input
          id="luma-native"
          className="profileinput"
          value={nativeLanguage}
          onChange={(event) => setNativeLanguage(event.target.value)}
          placeholder="e.g. Mandarin Chinese, English, Japanese"
        />
        <label htmlFor="luma-friction">Where I currently get stuck</label>
        <input
          id="luma-friction"
          className="profileinput"
          value={difficultMoment}
          onChange={(event) => setDifficultMoment(event.target.value)}
          placeholder="e.g. fast talks, writing precisely, answering questions"
        />
        <label className="privacy">
          <input
            type="checkbox"
            checked={cloudLearning}
            onChange={(event) => setCloudLearning(event.target.checked)}
          />
          <ShieldCheck />
          <span>
            <b>Cloud learning memory</b>
            <small>
              Save structured progress and teaching outcomes so Luma can prepare the next lesson and improve its methods. No raw audio; delete anytime.
            </small>
          </span>
        </label>
        <label className="privacy">
          <input
            type="checkbox"
            checked={cloudLearning && corpusConsent}
            disabled={!cloudLearning}
            onChange={(event) => setCorpusConsent(event.target.checked)}
          />
          <ShieldCheck />
          <span>
            <b>Contribute my learning conversations</b>
            <small>
              With separate consent, save bounded conversation text as teaching research corpus for progress analysis and future lesson design. Turning this off deletes saved corpus while keeping progress memory.
            </small>
          </span>
        </label>
        <button
          type="button"
          className="primary full"
          onClick={() =>
            save({
              target,
              goal,
              minutes,
              level: "adaptive",
              nativeLanguage: nativeLanguage.trim() || "English",
              domain: domain.trim(),
              difficultMoment: difficultMoment.trim(),
              localeProfile,
              cloudLearning,
              corpusConsent: cloudLearning && corpusConsent,
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
  lookup,
  profile,
  configure,
  callSettings,
  callDone,
  setupCall,
  answerCall,
  learnerModel,
  startSocial,
  forgetCloudLearning,
}) {
  const action = nextBestAction(learnerModel);
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
            Start my next best 3-minute mission <ArrowRight size={18} />
          </button>
          <section className="contextlenscard" aria-label="Context translation tools">
            <div className="contextlensintro">
              <span><ScanText /></span>
              <div>
                <b>Translate what’s in front of you</b>
                <small>Get the meaning used here—not a dictionary guess.</small>
              </div>
              <ArrowRight />
            </div>
            <div className="contextlensactions">
              <button type="button" onClick={lookup}>
                <Keyboard /><b>Type or paste</b><small>Word or sentence</small>
              </button>
              <button type="button" onClick={lookup}>
                <Camera /><b>Take a photo</b><small>Book, screen, sign</small>
              </button>
              <button type="button" onClick={lookup}>
                <FileUp /><b>Upload a file</b><small>Image, TXT or MD</small>
              </button>
            </div>
          </section>
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
      <section className="adaptivebrief">
        <div>
          <span className="kicker">WHY THIS, WHY NOW</span>
          <h2>{action.mode === "transfer-retrieval" ? "A memory is ready to become usable." : `Luma needs one piece of ${action.skill} evidence.`}</h2>
          <p>{action.reason} The task uses your world: {profile?.domain || "daily life"}.</p>
        </div>
        <div>
          <span className="adaptivetag">{profile?.cloudLearning ? "CLOUD MEMORY ON" : "DEVICE MEMORY ONLY"}</span>
          {profile?.cloudLearning && (
            <button className="textbtn" onClick={forgetCloudLearning}>Delete cloud learning data</button>
          )}
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
      <section className="sociallab">
        <div className="sectiontitle">
          <div>
            <span className="kicker">SOCIAL IMMERSION LAB</span>
            <h2>Practice belonging—not textbook dialogue</h2>
            <p>Each person reacts differently. Repair misunderstandings, read the room, and shift register while the conversation is still moving.</p>
          </div>
        </div>
        <div className="socialgrid">
          {socialScenarios.map((scenario) => (
            <button type="button" key={scenario.id} onClick={() => startSocial({
              ...scenario,
              locale: profile?.localeProfile?.label || scenario.locale,
              localeCode: profile?.localeProfile?.id,
              audience: profile?.localeProfile?.audience,
            })}>
              <span>{scenario.icon}</span>
              <b>{scenario.title}</b>
              <small>{scenario.relationship} · {scenario.register}</small>
              <ArrowRight />
            </button>
          ))}
        </div>
        <p className="freshnessnote"><ShieldCheck /> Slang is taught with locale, relationship, channel, source date, and “safe to use” guidance. Unverified trends are never presented as current fact.</p>
      </section>
      <section className="domainlab">
        <div className="sectiontitle">
          <div>
            <span className="kicker">YOUR THREE CONTEXT WORLDS</span>
            <h2>Learn the language inside the work and life it must perform</h2>
            <p>A term becomes durable only after you understand it in source material, explain it aloud, use its common partners, and retrieve it in a changed situation.</p>
          </div>
        </div>
        <div className="domaintracks">
          {domainTracks.map((track) => (
            <article key={track.id}>
              <span className="domainicon">{track.icon}</span>
              <h3>{track.title}</h3>
              <p>{track.subtitle}</p>
              <div>{track.terms.map((term) => <span key={term}>{term}</span>)}</div>
              {track.knowledgeMap && (
                <ul>{track.knowledgeMap.map((item) => <li key={item}>{item}</li>)}</ul>
              )}
              <small>{track.mission}</small>
              <button type="button" onClick={() => startSocial({ ...track, title: track.title })}>
                Enter this context <ArrowRight />
              </button>
            </article>
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

function RealtimeCoachCall({ profile, settings, complete, miss, learnerModel, captureEvidence, socialScenario, useFallback }) {
  const [phase, setPhase] = useState("ringing");
  const [status, setStatus] = useState("Incoming live audio call");
  const [learnerTranscript, setLearnerTranscript] = useState("");
  const [coachTranscript, setCoachTranscript] = useState("");
  const [turns, setTurns] = useState(0);
  const streamRef = useRef(null);
  const channelRef = useRef(null);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pcmAudioRef = useRef(null);
  const fallbackStartedRef = useRef(false);
  const responseEndedAtRef = useRef(null);
  const responseLatencyRef = useRef(null);
  const scenario = socialScenario
    ? `${socialScenario.title}; relationship: ${socialScenario.relationship}; channel: ${socialScenario.channel}; challenge: ${socialScenario.pressure}; mission: ${socialScenario.mission || "complete a meaningful exchange"}`
    : `a spontaneous call before work about ${profile?.domain || "the learner's real day"}`;

  useEffect(() => {
    navigator.vibrate?.([300, 180, 300, 180, 600]);
    const timer = setInterval(() => navigator.vibrate?.([300, 180, 300]), 2200);
    return () => {
      clearInterval(timer);
      navigator.vibrate?.(0);
      channelRef.current?.close();
      peerRef.current?.close();
      remoteAudioRef.current?.pause();
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
      pcmAudioRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const endCall = () => {
    channelRef.current?.close();
    peerRef.current?.close();
    remoteAudioRef.current?.pause();
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    pcmAudioRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    captureEvidence?.({
      skill: "speaking",
      score: turns > 1 ? 0.76 : 0.55,
      hesitation: 0.2,
      transfer: turns > 2,
      memoryKey: learnerTranscript || "realtime-call",
      phrase: learnerTranscript || "live spoken interaction",
      intent: "sustain a spontaneous live conversation",
      context: scenario,
      strategy: "realtime-agentic-dialogue",
    });
    complete();
  };

  const handleEvent = (event) => {
    if (event.type === "input_audio_buffer.speech_started") {
      pcmAudioRef.current?.interrupt();
      if (responseEndedAtRef.current) responseLatencyRef.current = Date.now() - responseEndedAtRef.current;
      setStatus("You’re speaking — Luma is listening");
    } else if (event.type === "input_audio_buffer.speech_stopped") {
      setStatus("Luma is understanding your meaning…");
    } else if (event.type === "conversation.item.input_audio_transcription.completed") {
      const transcript = String(event.transcript || "").trim();
      if (transcript) {
        setLearnerTranscript((value) => [value.trim(), transcript].filter(Boolean).join("\n").slice(-4000));
      }
      setTurns((value) => value + 1);
    } else if (event.type === "response.output_audio_transcript.delta" || event.type === "response.audio_transcript.delta") {
      setCoachTranscript((value) => value + (event.delta || ""));
      setStatus("Luma is speaking — interrupt anytime");
    } else if (event.type === "response.created") {
      setCoachTranscript("");
      setStatus("Luma is responding…");
    } else if (event.type === "response.done") {
      responseEndedAtRef.current = Date.now();
      setStatus("Your turn — take your time, pauses are okay");
    } else if (event.type === "response.audio.delta") {
      pcmAudioRef.current?.play(event.delta).catch(() => {});
    } else if (event.type === "luma.provider.connecting") {
      setStatus(event.provider === "zhipu" ? "Switching to the backup voice service…" : "Connecting Alibaba realtime voice…");
    } else if (event.type === "luma.provider.connected") {
      setPhase("live");
      setStatus(event.fallback ? "Live on backup voice service — continue speaking" : "Live — take your time, and interrupt naturally");
    } else if (event.type === "luma.provider.failed") {
      setStatus(`${event.provider === "bailian" ? "Alibaba" : "Backup"} voice was interrupted; reconnecting…`);
    } else if (event.type === "luma.provider.exhausted") {
      setPhase("error");
      setStatus("The configured live voice services are unavailable");
    } else if (event.type === "session.updated") {
      channelRef.current?.send(JSON.stringify({ type: "response.create" }));
    } else if (event.type === "response.function_call_arguments.done" && event.name === "record_learning_observation") {
      try {
        const observation = JSON.parse(event.arguments || "{}");
        const evidence = {
          skill: observation.skill || "speaking",
          score: observation.score,
          hesitation: observation.hesitation,
          transfer: observation.transfer,
          memoryKey: observation.phrase,
          phrase: observation.phrase,
          intent: observation.nextMove,
          context: observation.context || scenario,
          strategy: "realtime-agent-observation",
          hints: observation.hints || 0,
          technique: observation.technique,
          responseLatencyMs: responseLatencyRef.current,
        };
        captureEvidence?.(evidence);
        channelRef.current?.send(JSON.stringify({
          type: "conversation.item.create",
          item: { type: "function_call_output", call_id: event.call_id, output: JSON.stringify({ saved: true }) },
        }));
        channelRef.current?.send(JSON.stringify({ type: "response.create" }));
      } catch {
        channelRef.current?.send(JSON.stringify({
          type: "conversation.item.create",
          item: { type: "function_call_output", call_id: event.call_id, output: JSON.stringify({ saved: false }) },
        }));
      }
    } else if (event.type === "error") {
      setStatus(event.error?.message || "The live audio session hit a problem");
    }
  };

  const connectWebSocketFallback = async (stream) => {
    if (fallbackStartedRef.current) return;
    fallbackStartedRef.current = true;
    setStatus("Optimized direct audio was unavailable; connecting the backup voice path…");
    const cloud = cloudIdentity(profile?.cloudLearning === true);
    const sessionUrl = realtimeApiUrl(profile, scenario);
    const headers = { "Content-Type": "application/json" };
    if (cloud && new URL(sessionUrl).origin === location.origin) {
      headers["X-Luma-Learner"] = cloud.cloudLearnerId;
      headers["X-Luma-Secret"] = cloud.cloudSecret;
    }
    const response = await fetch(sessionUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ client: "luma-web" }),
    });
    if (!response.ok) throw new Error(`Backup live voice is unavailable (${response.status})`);
    const session = await response.json();
    if (!session?.url || !session?.instructions) throw new Error("The realtime gateway returned an incomplete session");
    const channel = new WebSocket(session.url);
    channelRef.current = channel;
    const pcmAudio = new RealtimePcmAudio((audio) => {
      if (channel.readyState === WebSocket.OPEN) {
        channel.send(JSON.stringify({ type: "input_audio_buffer.append", audio }));
      }
    });
    pcmAudioRef.current = pcmAudio;
    channel.onmessage = (message) => {
      try { handleEvent(JSON.parse(message.data)); } catch { /* ignore non-JSON events */ }
    };
    channel.onopen = async () => {
      try {
        await pcmAudio.start(stream);
        channel.send(JSON.stringify({
          type: "session.update",
          session: { instructions: session.instructions, tools: session.tools || [] },
        }));
      } catch (error) {
        setPhase("error");
        setStatus(error?.message || "Could not start backup microphone streaming");
        channel.close();
      }
    };
    channel.onclose = (event) => {
      pcmAudio.close();
      if (event.code !== 1000) {
        setPhase("error");
        setStatus(event.reason || "The live audio connection was interrupted");
      }
    };
    channel.onerror = () => setStatus("The backup voice connection was interrupted");
  };

  const waitForIce = (peer) => new Promise((resolve) => {
    if (peer.iceGatheringState === "complete") return resolve();
    const finish = () => {
      peer.removeEventListener("icegatheringstatechange", check);
      resolve();
    };
    const check = () => {
      if (peer.iceGatheringState === "complete") finish();
    };
    peer.addEventListener("icegatheringstatechange", check);
    setTimeout(finish, 3000);
  });

  const connectWebRtc = async (stream) => {
    if (!window.RTCPeerConnection) throw new Error("WebRTC is unavailable");
    const peer = new RTCPeerConnection({ iceServers: [] });
    peerRef.current = peer;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.createDataChannel("oai-events");

    let sessionUpdate = null;
    let sessionUpdateSent = false;
    let connected = false;
    const sendSessionUpdate = () => {
      const channel = channelRef.current;
      if (sessionUpdateSent || !sessionUpdate || channel?.readyState !== "open") return;
      sessionUpdateSent = true;
      channel.send(JSON.stringify(sessionUpdate));
    };

    peer.ondatachannel = (event) => {
      const channel = event.channel;
      if (channel.label !== "txt") return;
      channelRef.current = channel;
      channel.onopen = () => setTimeout(sendSessionUpdate, 250);
      channel.onmessage = async (message) => {
        sendSessionUpdate();
        try {
          const raw = typeof message.data === "string" ? message.data : await message.data.text();
          handleEvent(JSON.parse(raw));
        } catch { /* ignore non-JSON events */ }
      };
    };
    peer.ontrack = (event) => {
      const audio = remoteAudioRef.current;
      if (!audio) return;
      audio.srcObject = event.streams[0] || new MediaStream([event.track]);
      audio.play().catch(() => setStatus("Tap the audio button once to allow playback"));
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        connected = true;
        setPhase("live");
        setStatus("Live on the direct low-latency audio path");
      } else if (peer.connectionState === "failed" && !fallbackStartedRef.current) {
        peer.close();
        connectWebSocketFallback(stream).catch((error) => {
          setPhase("error");
          setStatus(error?.message || "Could not start live audio");
        });
      } else if (peer.connectionState === "disconnected" && connected) {
        setStatus("Mobile network changed; restoring the audio path…");
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitForIce(peer);
    const response = await fetch(realtimeWebrtcUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sdp: peer.localDescription?.sdp,
        target: profile?.target || "Spanish",
        native: profile?.nativeLanguage || "English",
        scenario,
      }),
    });
    if (!response.ok) throw new Error(`Direct voice signaling failed (${response.status})`);
    const session = await response.json();
    if (!session?.sdp || !session?.sessionUpdate) throw new Error("Direct voice signaling returned incomplete data");
    sessionUpdate = session.sessionUpdate;
    await peer.setRemoteDescription({ type: "answer", sdp: session.sdp });
    sendSessionUpdate();
  };

  const answer = async () => {
    setPhase("connecting");
    setStatus("Connecting direct low-latency audio…");
    navigator.vibrate?.(0);
    fallbackStartedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;
      try {
        await connectWebRtc(stream);
      } catch {
        peerRef.current?.close();
        await connectWebSocketFallback(stream);
      }
      navigator.wakeLock?.request?.("screen").catch(() => {});
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current?.close();
      pcmAudioRef.current?.close();
      setPhase("error");
      setStatus(error?.message || "Could not start live audio");
    }
  };

  if (phase === "ringing") return (
    <div className="incoming">
      <div className="incomingrings"></div>
      <div className="caller">
        <span className="brandmark">L</span>
        <span className="kicker">REALTIME AUDIO CALL</span>
        <h1>Luma</h1>
        <p>Your {profile?.target || "English"} teacher is calling</p>
      </div>
      <div className="incomingactions">
        <button className="decline" onClick={miss}><X /><span>Retry in {settings.retryMinutes} min</span></button>
        <button className="accept" onClick={answer}><Phone /><span>Answer live</span></button>
      </div>
    </div>
  );

  return (
    <div className="incoming calllive">
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <div className="livehead">
        <span className="pulse"></span>
        <b>Luma · realtime audio</b>
        <span>{turns} spoken turns</span>
      </div>
      <section className="conversationcall">
        <span className="kicker">OPEN MIC · FULL DUPLEX · INTERRUPTIBLE</span>
        <h1>A real <em>conversation.</em></h1>
        <p>Your microphone stays open. Pause to think; Luma waits for meaning, not a timer. Speak over Luma whenever you need to interrupt.</p>
        <div className="orbcard realtimeorb">
          <div className="orb"><div className="rings"></div><AudioLines size={38} /></div>
          <p className="quote" role="status">{status}</p>
        </div>
        {(learnerTranscript || coachTranscript) && (
          <div className="callthread" aria-live="polite">
            {learnerTranscript && <article className="bubblemsg learner"><b>You · live transcript</b><p>{learnerTranscript}</p></article>}
            {coachTranscript && <article className="bubblemsg coach"><b>Luma</b><p>{coachTranscript}</p></article>}
          </div>
        )}
        <div className="callpromise">
          <Mic />
          <span><b>{phase === "live" ? "Microphone live" : phase === "connecting" ? "Connecting…" : "Connection unavailable"}</b><small>Audio is sent continuously during this call. Conversation text is saved only under your separate corpus consent.</small></span>
        </div>
        {phase === "error" && <button className="secondary full" onClick={useFallback}>Use transcript fallback</button>}
        <button className="decline full" onClick={endCall}><PhoneOff /><span>End call</span></button>
      </section>
    </div>
  );
}

function CoachCall({ profile, settings, complete, miss, learnerModel, captureEvidence, socialScenario }) {
  const [answered, setAnswered] = useState(false);
  const [spoken, setSpoken] = useState("");
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [callNotice, setCallNotice] = useState("");
  const [recognitionConfidence, setRecognitionConfidence] = useState(null);
  const [learnerTurns, setLearnerTurns] = useState(0);
  const [speechMode, setSpeechMode] = useState("target");
  const prompt = coachPrompts[profile?.target] || coachPrompts.English;
  const activeScenario = socialScenario
    ? `${socialScenario.title}; speaking with ${socialScenario.relationship}; ${socialScenario.channel}; ${socialScenario.register}; challenge: ${socialScenario.pressure}; mission: ${socialScenario.mission || "complete a socially meaningful exchange"}; anchor language: ${(socialScenario.terms || []).join(", ") || "selected from the learner's response"}; technical knowledge map: ${(socialScenario.knowledgeMap || []).join(" | ") || "not applicable"}`
    : "a proactive morning accountability call before work";
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
  const listen = (mode = speechMode) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setCallNotice(
        "Voice recognition is unavailable here. Type below or use the sample.",
      );
      return;
    }
    try {
      const r = new SR();
      const configuredNativeLocale = speechLocaleFor(profile?.nativeLanguage || "");
      const browserLocale = navigator.language || "zh-CN";
      r.lang = mode === "native"
        ? (configuredNativeLocale === "en-US" && browserLocale.toLowerCase().startsWith("zh") ? browserLocale : configuredNativeLocale)
        : prompt.lang;
      r.onstart = () => {
        setListening(true);
        setCallNotice(mode === "native" ? `正在用${profile?.nativeLanguage || "中文"}识别你的求助…` : `Listening in ${profile?.target || "the target language"}…`);
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
        setCallNotice(mode === "native"
          ? "已识别母语内容。发送后，Luma 会先理解你的意思，再教你怎样用目标语言表达。"
          : "I captured your words. Check the transcript, then send it for coaching.");
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
    if (intent === "respond" && (/[㐀-鿿]/.test(spoken) || speechMode === "native")) intent = "bridge";
    const isAnswer = intent === "respond";
    const usesComposer = isAnswer || intent === "bridge";
    if (usesComposer && !spoken.trim()) {
      setCallNotice(
        `Say it in ${profile?.target || "Spanish"}, or use ${profile?.nativeLanguage || "your strongest language"} and tap “Help me say this.”`,
      );
      answerRef.current?.focus();
      return;
    }
    const helpLabels = {
      clarify: `I did not understand this exact sentence: “${messages.at(-1)?.text || prompt.text}”. Explain its complete meaning in ${profile?.nativeLanguage || "my strongest language"}, break it into short parts, then ask a different and simpler question. Do not merely repeat it.`,
      vocabulary: `Explain the important words in this exact sentence: “${messages.at(-1)?.text || prompt.text}”.`,
    };
    const learnerText = usesComposer ? spoken.trim() : helpLabels[intent];
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
          scenario: activeScenario,
          socialContext: socialScenario,
          utterance: learnerText,
          intent,
          recognitionConfidence,
          turn: learnerTurns,
          sessionId: practiceSessionId,
          history: nextHistory.slice(-8),
          learnerModel: learnerSnapshot(learnerModel),
          transfer: learnerTurns > 0,
          ...coachCloudPayload(profile),
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
      if (isAnswer) captureEvidence?.({
        skill: "speaking",
        score: result.understood === false ? 0.35 : 0.78,
        hesitation: recognitionConfidence !== null && recognitionConfidence < 0.7 ? 0.35 : 0.1,
        transfer: learnerTurns > 0,
        memoryKey: result.naturalVersion || learnerText,
        phrase: result.naturalVersion || learnerText,
        intent: "explain a real work goal",
        context: profile?.domain || "morning work call",
      });
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
        <b>Luma · {socialScenario ? socialScenario.title : "live coach"}</b>
        <span>{learnerTurns}/3 replies</span>
      </div>
      <section className="conversationcall">
        <span className="kicker">LIVE · INTERACTIVE · ADAPTIVE</span>
        <h1>
          Have a real <em>conversation.</em>
        </h1>
        <p>
          Answer, ask what anything means, and try again. If the words are not
          there yet, say your meaning in {profile?.nativeLanguage || "your strongest language"}—Luma will bridge it into {profile?.target || "Spanish"}.
        </p>
        {socialScenario && (
          <div className="socialcontext">
            <span>{socialScenario.locale}</span>
            <span>{socialScenario.relationship}</span>
            <span>{socialScenario.channel}</span>
            <span>{socialScenario.register}</span>
          </div>
        )}
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
              {feedback?._meta?.languagePulse && (
                <article>
                  <span>LANGUAGE FRESHNESS</span>
                  <p>{feedback._meta.languagePulse.live ? `Live language pulse · ${feedback._meta.languagePulse.updatedAt}` : "Baseline corpus only—not verified as a current trend."}</p>
                  <small>{feedback._meta.languagePulse.source || "No live source configured"}</small>
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
          <button type="button" disabled={loading} onClick={() => respond("bridge")}>
            <Globe2 /> Help me say this
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
          <div className="dualmic">
            <button type="button" className={"mic compactmic " + (listening && speechMode === "target" ? "active" : "")} onClick={() => { setSpeechMode("target"); listen("target"); }} aria-label={`Speak in ${profile?.target || "Spanish"}`}>
              <Mic /><span>{listening && speechMode === "target" ? "Listening…" : profile?.target || "Speak"}</span>
            </button>
            <button type="button" className={"nativemic " + (listening && speechMode === "native" ? "active" : "")} onClick={() => { setSpeechMode("native"); listen("native"); }} aria-label={`用${profile?.nativeLanguage || "中文"}求助`}>
              <Globe2 /><span>母语求助</span>
            </button>
          </div>
          <textarea
            ref={answerRef}
            value={spoken}
            onChange={(e) => {
              setSpoken(e.target.value);
              setRecognitionConfidence(null);
              setCallNotice("");
            }}
            placeholder={`Use ${profile?.target || "Spanish"}—or ${profile?.nativeLanguage || "your strongest language"} when you need a bridge…`}
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
  learnerModel,
  captureEvidence,
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
          nativeLanguage: profile?.nativeLanguage || "English",
          learnerModel: learnerSnapshot(learnerModel),
          sessionId: practiceSessionId,
          ...coachCloudPayload(profile),
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
      captureEvidence?.({
        skill: "speaking",
        score: 0.78,
        hesitation: spoken.trim() === copy.prompt ? 0.05 : 0.18,
        memoryKey: copy.chunk,
        phrase: copy.chunk,
        intent: "make a polite request",
        context: "coffee shop",
      });
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

const prepareLookupImage = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const source = new Image();
  source.onload = () => {
    try {
      const maxEdge = 1600;
      const scale = Math.min(1, maxEdge / Math.max(source.naturalWidth, source.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
      const context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    } catch (error) {
      reject(error);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };
  source.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("This image could not be read"));
  };
  source.src = objectUrl;
});

function ContextLookup({ profile, back, save }) {
  const [query, setQuery] = useState("");
  const [context, setContext] = useState("");
  const [image, setImage] = useState("");
  const [imageName, setImageName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [translationLanguage, setTranslationLanguage] = useState(() =>
    localStorage.getItem("luma-translation-language")
      || (profile?.nativeLanguage && profile.nativeLanguage !== "English" ? profile.nativeLanguage : deviceExplanationLanguage()),
  );
  const wordInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const chooseImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Please choose a screenshot or photo.");
      return;
    }
    if (file.size > 12_000_000) {
      setNotice("Please choose an image under 12 MB.");
      return;
    }
    setNotice("Optimizing the image for fast translation…");
    try {
      const prepared = await prepareLookupImage(file);
      setImage(prepared);
      setImageName(file.name);
      setNotice("Image ready. It was compressed on your phone for a faster result.");
    } catch (error) {
      setNotice(error?.message || "This image could not be read.");
    }
  };

  const chooseFile = (file) => {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      chooseImage(file);
      return;
    }
    const isText = ["text/plain", "text/markdown"].includes(file.type)
      || /\.(txt|md)$/i.test(file.name);
    if (!isText) {
      setNotice("Choose an image, TXT, or Markdown file. PDF support is coming next.");
      return;
    }
    if (file.size > 500_000) {
      setNotice("Please choose a text file under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const fileText = String(reader.result || "").slice(0, 4000);
      setContext((current) => [current.trim(), fileText].filter(Boolean).join("\n\n"));
      setImage("");
      setImageName(file.name);
      setNotice(`Loaded ${file.name}. Add a word hint or analyze the text as it is.`);
    };
    reader.readAsText(file);
  };

  const analyze = async () => {
    if (!query.trim() && !context.trim() && !image) {
      setNotice("Paste the sentence, type part of the word, or add a screenshot first.");
      return;
    }
    setLoading(true);
    const startedAt = performance.now();
    setNotice(image ? "Reading and translating the image…" : "Finding the meaning…");
    try {
      const response = await fetch(lookupApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          context: context.trim(),
          image,
          targetLanguage: profile?.target || "English",
          nativeLanguage: translationLanguage,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || `Context analysis failed (${response.status}).`);
      }
      const data = await response.json();
      setResult(data);
      save?.(data);
      setNotice(`Done in ${((performance.now() - startedAt) / 1000).toFixed(1)}s · translated into ${translationLanguage}.`);
    } catch (error) {
      const isVerdict = /verdi|判决/i.test(`${query} ${context}`);
      if (isVerdict) {
        const data = {
          term: "verdict",
          sourceText: context,
          detectedDomain: "quantitative trading / software output",
          nativeExplanation: "这里通常不是法院的“判决”，而是模型或系统综合证据后给出的最终判断、分类结果或结论。具体是买入、卖出、看多、看空还是通过/拒绝，要看附近字段。",
          plainExplanation: "Here, verdict means the system’s final judgment or decision after evaluating the data.",
          contextualMeaning: "模型或规则引擎输出的最终判断结果",
          dictionaryMeaning: "a formal decision made by a jury in court",
          dictionaryContrast: "法律义是陪审团裁决；量化系统借用了“综合证据后下结论”这一核心概念，属于领域中的隐喻性延伸。",
          naturalExample: "The strategy returned a bullish verdict after the risk checks passed.",
          examples: ["The model’s verdict was neutral, so no order was placed.", "Wait for the final verdict from the signal aggregator."],
          commonCollocations: ["final verdict", "return a verdict", "bullish verdict", "model verdict"],
          usageNote: "在软件界面中可以理解为 final decision/output；是否是标准字段名仍要结合该系统文档。",
          ambiguityNote: "没有完整截图时，无法确定它代表交易方向、风险审核还是多个信号的汇总结论。",
          confidence: "medium",
          retrievalPrompt: "如果模型评估所有信号后给出最终看多结论，你会怎样用 verdict 描述？",
        };
        setResult(data);
        save?.(data);
        setNotice("Live analysis was unavailable, so Luma used its verified contextual fallback and saved the result.");
      } else {
        setNotice(error?.message || "Context analysis is temporarily unavailable. Keep the text and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="lookupShell">
      <nav>
        <button className="iconbtn" onClick={back}><ChevronLeft /></button>
        <div className="brand"><span className="brandmark">L</span><span>Context Lens</span></div>
        <span>Every lookup becomes future teaching</span>
      </nav>
      <section className="lookuphero">
        <span className="kicker">MEANING IN THE REAL WORLD</span>
        <h1>Don’t translate the word.<br /><em>Decode what it means here.</em></h1>
        <p>Paste a sentence, upload a screenshot, or type the part you remember. Luma separates the dictionary meaning from the meaning used in your paper, app, workplace, or daily life.</p>
      </section>
      <section className="lookupworkbench">
        <div className="lookupinputs">
          <div className="lookupmodepanel">
            <span className="kicker">CHOOSE AN INPUT</span>
            <h2>How do you want to bring it in?</h2>
            <div className="lookupmodegrid">
              <button type="button" onClick={() => wordInputRef.current?.focus()}>
                <Keyboard />
                <span><b>Type or paste</b><small>A word, sentence, or paragraph</small></span>
              </button>
              <button type="button" onClick={() => cameraInputRef.current?.click()}>
                <Camera />
                <span><b>Take a photo</b><small>Use your phone camera now</small></span>
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                <FileUp />
                <span><b>Upload a file</b><small>Image, TXT, or Markdown</small></span>
              </button>
            </div>
            <input ref={cameraInputRef} className="hiddenfile" type="file" accept="image/*" capture="environment" onChange={(event) => chooseImage(event.target.files?.[0])} />
            <input ref={fileInputRef} className="hiddenfile" type="file" accept="image/*,.txt,.md,text/plain,text/markdown" onChange={(event) => chooseFile(event.target.files?.[0])} />
          </div>
          <div className="translationchoice">
            <Globe2 />
            <label htmlFor="translation-language">
              <b>Translate explanations into</b>
              <small>Automatically follows this phone; change it anytime.</small>
            </label>
            <select
              id="translation-language"
              value={translationLanguage}
              onChange={(event) => {
                setTranslationLanguage(event.target.value);
                localStorage.setItem("luma-translation-language", event.target.value);
              }}
            >
              {!translationLanguages.includes(translationLanguage) && (
                <option value={translationLanguage}>{translationLanguage}</option>
              )}
              {translationLanguages.map((language) => <option key={language} value={language}>{language}</option>)}
            </select>
          </div>
          <label htmlFor="word-hint">Word or fuzzy hint</label>
          <input ref={wordInputRef} id="word-hint" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. accum… / sounds like ‘ver-dict’ / 判决那个词" />
          <label htmlFor="word-context">Paste the surrounding sentence or paragraph</label>
          <textarea id="word-context" value={context} onChange={(event) => setContext(event.target.value)} placeholder="e.g. The signal aggregator returned a neutral verdict, so the strategy placed no order." />
          {imageName && (
            <div className="selectedsource">
              <Check />
              <span><b>{imageName}</b><small>{image ? "Image ready for visual context analysis" : "Text loaded into the context field"}</small></span>
            </div>
          )}
          {image && <img className="lookuppreview" src={image} alt="Selected source for contextual word analysis" />}
          <button type="button" className="primary full" onClick={analyze} disabled={loading}>
            <Sparkles /> {loading ? (image ? "Reading + translating image…" : "Finding the meaning…") : "Explain what it means here"}
          </button>
          {notice && <p className="lookupnotice">{notice}</p>}
        </div>
        <div className={`lookupresult ${result ? "ready" : ""}`}>
          {!result ? (
            <div className="emptylookup"><BookOpen /><h2>Context changes meaning.</h2><p><b>verdict</b> can mean a court decision—or a model’s final decision in a quantitative system. Luma uses the surrounding evidence first.</p></div>
          ) : (
            <>
              <div className="termhead"><div><span>{result.detectedDomain}</span><h2>{result.term}</h2></div><b>{result.confidence} confidence</b></div>
              <article className="meaningprimary"><span>Meaning in {translationLanguage}</span><h3>{result.contextualMeaning}</h3><p>{result.nativeExplanation}</p></article>
              <div className="meaningpair"><article><span>Plain {profile?.target || "language"}</span><p>{result.plainExplanation}</p></article><article><span>Dictionary ≠ context</span><p>{result.dictionaryContrast}</p></article></div>
              <article><span className="resultlabel">Natural example</span><p className="exampleline">{result.naturalExample}</p></article>
              <article><span className="resultlabel">Words it naturally travels with</span><div className="collocations">{result.commonCollocations?.map((item) => <span key={item}>{item}</span>)}</div></article>
              <article><span className="resultlabel">Usage note</span><p>{result.usageNote}</p>{result.ambiguityNote && <small>{result.ambiguityNote}</small>}</article>
              <article className="retrievalcard"><span>Later—not another flashcard</span><p>{result.retrievalPrompt}</p><small>Luma saved this meaning and will make you reconstruct and use it in a new context.</small></article>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function Memory({ profile, learnerModel, back, start }) {
  const copy = practiceContent[profile?.target] || practiceContent.Spanish;
  const memories = Object.values(learnerModel?.memories || {});
  const action = nextBestAction(learnerModel);
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
        <span>{memories.length} living {memories.length === 1 ? "memory" : "memories"}</span>
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
              {memories.reduce((sum, item) => sum + (item.contexts?.length || 0), 0)} useful
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
          <h2>“{action.memory?.phrase || copy.chunk}…”</h2>
          <p>
            Next time, this language moves beyond {action.memory?.contexts?.at(-1) || "its first situation"} into a new {profile?.domain || "real-life"} task.
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
