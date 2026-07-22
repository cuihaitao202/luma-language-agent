const vocabularyItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    term: { type: "string" },
    meaning: { type: "string" },
    example: { type: "string" },
  },
  required: ["term", "meaning", "example"],
};

const coachSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    understood: { type: "boolean" },
    praise: { type: "string" },
    grammarCorrection: { type: "string" },
    naturalVersion: { type: "string" },
    pronunciation: { type: "string" },
    vocabulary: { type: "array", items: vocabularyItemSchema },
    reply: { type: "string" },
    replyTranslation: { type: "string" },
    memoryHook: { type: "string" },
  },
  required: [
    "understood",
    "praise",
    "grammarCorrection",
    "naturalVersion",
    "pronunciation",
    "vocabulary",
    "reply",
    "replyTranslation",
    "memoryHook",
  ],
};

const lookupSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    term: { type: "string" },
    sourceText: { type: "string" },
    detectedDomain: { type: "string" },
    nativeExplanation: { type: "string" },
    plainExplanation: { type: "string" },
    contextualMeaning: { type: "string" },
    dictionaryMeaning: { type: "string" },
    dictionaryContrast: { type: "string" },
    naturalExample: { type: "string" },
    examples: { type: "array", items: { type: "string" } },
    commonCollocations: { type: "array", items: { type: "string" } },
    usageNote: { type: "string" },
    ambiguityNote: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    retrievalPrompt: { type: "string" },
  },
  required: ["term", "sourceText", "detectedDomain", "nativeExplanation", "plainExplanation", "contextualMeaning", "dictionaryMeaning", "dictionaryContrast", "naturalExample", "examples", "commonCollocations", "usageNote", "ambiguityNote", "confidence", "retrievalPrompt"],
};

const allowedOrigins = new Set([
  "https://cuihaitao202.github.io",
  "https://luma-language-agent.taotao918918918.chatgpt.site",
]);

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin)
      ? origin
      : "https://cuihaitao202.github.io",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Luma-Learner, X-Luma-Secret",
    Vary: "Origin",
  };
}

const CONSENT_VERSION = "cloud-learning-v1";
const CORPUS_CONSENT_VERSION = "conversation-corpus-v1";
const boundedJson = (value, max = 48000) => JSON.stringify(value || {}).slice(0, max);
const safeJson = (value, fallback = {}) => {
  try { return JSON.parse(value || "{}"); } catch { return fallback; }
};
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ensureLearningSchema(env) {
  if (!env.DB) return false;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS learners (learner_id TEXT PRIMARY KEY, secret_hash TEXT NOT NULL, consent_version TEXT NOT NULL, profile_json TEXT NOT NULL DEFAULT '{}', model_json TEXT NOT NULL DEFAULT '{}', prep_json TEXT NOT NULL DEFAULT '{}', corpus_consent INTEGER NOT NULL DEFAULT 0, last_active_at INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS learning_events (event_id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, event_type TEXT NOT NULL, skill TEXT, score REAL, hesitation REAL, hints INTEGER NOT NULL DEFAULT 0, response_latency_ms INTEGER, technique TEXT, transfer INTEGER NOT NULL DEFAULT 0, strategy TEXT, context TEXT, memory_key_hash TEXT, created_at INTEGER NOT NULL, FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS learning_events_learner_time_idx ON learning_events (learner_id, created_at DESC)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS strategy_outcomes (strategy TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0, successes INTEGER NOT NULL DEFAULT 0, transfer_successes INTEGER NOT NULL DEFAULT 0, mean_score REAL NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS conversation_corpus (corpus_id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, session_id TEXT NOT NULL, learner_text TEXT NOT NULL, coach_text TEXT NOT NULL, target_language TEXT, scenario TEXT, outcome_json TEXT NOT NULL DEFAULT '{}', consent_version TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS conversation_corpus_learner_time_idx ON conversation_corpus (learner_id, created_at DESC)`),
  ]);
  for (const statement of [
    "ALTER TABLE learners ADD COLUMN corpus_consent INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE learners ADD COLUMN last_active_at INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE learning_events ADD COLUMN hints INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE learning_events ADD COLUMN response_latency_ms INTEGER",
    "ALTER TABLE learning_events ADD COLUMN technique TEXT",
  ]) {
    try { await env.DB.prepare(statement).run(); } catch (error) {
      if (!String(error?.message || error).toLowerCase().includes("duplicate column")) throw error;
    }
  }
  return true;
}

function cloudCredentials(request, body = {}) {
  return {
    learnerId: String(request.headers.get("X-Luma-Learner") || body.cloudLearnerId || "").slice(0, 80),
    secret: String(request.headers.get("X-Luma-Secret") || body.cloudSecret || "").slice(0, 160),
  };
}

async function authorizeLearner(request, env, body = {}, { create = false } = {}) {
  if (!await ensureLearningSchema(env)) return { error: "Cloud learning storage is not configured.", status: 503 };
  const { learnerId, secret } = cloudCredentials(request, body);
  if (!learnerId || secret.length < 24) return { error: "Cloud learner credentials are required.", status: 401 };
  const secretHash = await sha256(secret);
  const existing = await env.DB.prepare("SELECT * FROM learners WHERE learner_id = ?").bind(learnerId).first();
  if (!existing && create) {
    const now = Date.now();
    await env.DB.prepare("INSERT INTO learners (learner_id, secret_hash, consent_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .bind(learnerId, secretHash, CONSENT_VERSION, now, now).run();
    return { learner: { learner_id: learnerId, profile_json: "{}", model_json: "{}", prep_json: "{}" } };
  }
  if (!existing || existing.secret_hash !== secretHash) return { error: "Cloud learner credentials are invalid.", status: 403 };
  return { learner: existing };
}

function buildPrep(model, recentEvents = [], insights = {}) {
  const skills = model?.skills || {};
  const weakest = Object.entries(skills).sort((a, b) => finite(a[1]?.estimate, 1) - finite(b[1]?.estimate, 1))[0]?.[0] || "speaking";
  const memories = Object.values(model?.memories || {});
  const due = memories.filter((memory) => finite(memory.nextDueAt, Infinity) <= Date.now()).slice(0, 5);
  const hesitation = recentEvents.length
    ? recentEvents.reduce((sum, event) => sum + finite(event.hesitation), 0) / recentEvents.length
    : 0;
  const hinted = recentEvents.filter((event) => finite(event.hints) > 0).length;
  const latencyValues = recentEvents.map((event) => finite(event.response_latency_ms)).filter((value) => value > 0);
  const averageLatencyMs = latencyValues.length
    ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
    : null;
  const retrievalTechnique = hinted > recentEvents.length / 3
    ? "generation-first-with-one-cue-then-immediate-cue-fade"
    : hesitation > 0.35
      ? "short-successful-retrieval-then-expanded-transfer"
      : "free-recall-then-interleaved-transfer";
  const recentStrategies = recentEvents.map((event) => event.strategy).filter(Boolean);
  const lessonFormats = ["role-reversal", "skeptical-interview", "story-reconstruction", "design-review", "teach-it-back"];
  const format = lessonFormats.find((candidate) => !recentStrategies.includes(candidate)) || lessonFormats[Date.now() % lessonFormats.length];
  return {
    generatedAt: Date.now(),
    weakestSkill: weakest,
    dueMemoryKeys: due.map((memory) => String(memory.key || "").slice(0, 120)),
    recentAverageHesitation: Math.round(hesitation * 100) / 100,
    recentHintDependence: recentEvents.length ? Math.round((hinted / recentEvents.length) * 100) / 100 : 0,
    averageResponseLatencyMs,
    retrievalTechnique,
    lessonFormat: format,
    avoidRecentScenarios: (insights.recentScenarios || []).slice(0, 5),
    recommendedStrategy: insights.recommendedStrategy || "focused-recast",
    noveltyRule: "Do not repeat the last scenario; preserve the language function while changing role, stakes, and channel.",
    teachingPlan: hesitation > 0.35
      ? "Begin with a small successful retrieval, give at most one semantic cue, remove it immediately, then expand into spontaneous use."
      : `Require generation before explanation, collect meaningful ${weakest} evidence, interleave one confusable expression, then test transfer in a changed context.`,
    consolidationPlan: "End with one short successful retrieval; near bedtime, schedule the next test after sleep instead of adding more new material.",
    pronunciationPlan: "Use varied voices or contexts: listen for a contrast, identify it, shadow once, then produce freely in a new sentence.",
  };
}

async function saveConsentedCorpus(env, learnerId, body, result) {
  if (!env.DB || !learnerId) return;
  const learner = await env.DB.prepare("SELECT corpus_consent FROM learners WHERE learner_id = ?").bind(learnerId).first();
  if (!learner || Number(learner.corpus_consent) !== 1) return;
  await env.DB.prepare("INSERT INTO conversation_corpus (corpus_id, learner_id, session_id, learner_text, coach_text, target_language, scenario, outcome_json, consent_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(
      crypto.randomUUID(), learnerId, String(body.sessionId || "unspecified").slice(0, 100),
      String(body.utterance || "").slice(0, 2000), String(result.reply || "").slice(0, 2000),
      String(body.targetLanguage || "").slice(0, 40), String(body.scenario || "").slice(0, 240),
      boundedJson({ understood: result.understood, correction: result.grammarCorrection, naturalVersion: result.naturalVersion }, 3000),
      CORPUS_CONSENT_VERSION, Date.now(),
    ).run();
}

async function prepareInactiveLearners(env, inactiveBefore = Date.now() - 2 * 36e5) {
  if (!await ensureLearningSchema(env)) return 0;
  const learners = await env.DB.prepare("SELECT learner_id, model_json FROM learners WHERE last_active_at > 0 AND last_active_at <= ? ORDER BY last_active_at ASC LIMIT 100").bind(inactiveBefore).all();
  for (const learner of learners.results || []) {
    const recent = await env.DB.prepare("SELECT skill, score, hesitation, hints, response_latency_ms, technique, transfer, strategy, created_at FROM learning_events WHERE learner_id = ? ORDER BY created_at DESC LIMIT 20").bind(learner.learner_id).all();
    const corpus = await env.DB.prepare("SELECT scenario FROM conversation_corpus WHERE learner_id = ? ORDER BY created_at DESC LIMIT 5").bind(learner.learner_id).all();
    const bestStrategy = await env.DB.prepare("SELECT strategy FROM strategy_outcomes WHERE attempts >= 3 ORDER BY (transfer_successes * 1.0 / attempts) DESC, mean_score DESC LIMIT 1").first();
    const prep = {
      ...buildPrep(safeJson(learner.model_json), recent.results || [], {
        recentScenarios: (corpus.results || []).map((row) => row.scenario).filter(Boolean),
        recommendedStrategy: bestStrategy?.strategy,
      }),
      preparedWhileInactive: true,
    };
    await env.DB.prepare("UPDATE learners SET prep_json = ?, updated_at = ? WHERE learner_id = ?").bind(boundedJson(prep, 12000), Date.now(), learner.learner_id).run();
  }
  return learners.results?.length || 0;
}

async function saveCloudEvidence(env, learnerId, evidence = {}) {
  if (!env.DB || !learnerId) return;
  const score = Math.max(0, Math.min(1, finite(evidence.score, 0.5)));
  const hesitation = Math.max(0, Math.min(1, finite(evidence.hesitation, 0)));
  const strategy = String(evidence.strategy || "focused-recast").slice(0, 80);
  const memoryHash = evidence.memoryKey ? await sha256(evidence.memoryKey) : null;
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO learning_events (event_id, learner_id, event_type, skill, score, hesitation, hints, response_latency_ms, technique, transfer, strategy, context, memory_key_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), learnerId, String(evidence.type || "practice-turn").slice(0, 40), String(evidence.skill || "speaking").slice(0, 20), score, hesitation, Math.max(0, Math.min(3, finite(evidence.hints))), finite(evidence.responseLatencyMs) || null, String(evidence.technique || "").slice(0, 100) || null, evidence.transfer ? 1 : 0, strategy, String(evidence.context || "").slice(0, 160), memoryHash, now),
    env.DB.prepare(`INSERT INTO strategy_outcomes (strategy, attempts, successes, transfer_successes, mean_score, updated_at) VALUES (?, 1, ?, ?, ?, ?)
      ON CONFLICT(strategy) DO UPDATE SET attempts = attempts + 1, successes = successes + excluded.successes, transfer_successes = transfer_successes + excluded.transfer_successes, mean_score = ((mean_score * attempts) + excluded.mean_score) / (attempts + 1), updated_at = excluded.updated_at`)
      .bind(strategy, score >= 0.7 ? 1 : 0, evidence.transfer && score >= 0.7 ? 1 : 0, score, now),
  ]);
}

async function cloudLearner(request, env) {
  const body = request.method === "POST" ? await request.json() : {};
  const auth = await authorizeLearner(request, env, body, { create: request.method === "POST" });
  if (auth.error) return json(request, { error: auth.error }, auth.status);
  if (request.method === "GET") {
    return json(request, {
      profile: safeJson(auth.learner.profile_json),
      learnerModel: safeJson(auth.learner.model_json),
      prep: safeJson(auth.learner.prep_json),
      updatedAt: auth.learner.updated_at,
    });
  }
  const model = body.learnerModel && typeof body.learnerModel === "object" ? body.learnerModel : {};
  const recent = await env.DB.prepare("SELECT skill, score, hesitation, hints, response_latency_ms, technique, transfer, strategy, created_at FROM learning_events WHERE learner_id = ? ORDER BY created_at DESC LIMIT 20")
    .bind(auth.learner.learner_id).all();
  const prep = buildPrep(model, recent.results || []);
  const corpusConsent = body.profile?.corpusConsent === true ? 1 : 0;
  await env.DB.prepare("UPDATE learners SET profile_json = ?, model_json = ?, prep_json = ?, corpus_consent = ?, last_active_at = ?, consent_version = ?, updated_at = ? WHERE learner_id = ?")
    .bind(boundedJson(body.profile, 12000), boundedJson(model), boundedJson(prep, 12000), corpusConsent, Date.now(), CONSENT_VERSION, Date.now(), auth.learner.learner_id).run();
  if (!corpusConsent) await env.DB.prepare("DELETE FROM conversation_corpus WHERE learner_id = ?").bind(auth.learner.learner_id).run();
  if (body.evidence) await saveCloudEvidence(env, auth.learner.learner_id, body.evidence);
  return json(request, { saved: true, prep, consentVersion: CONSENT_VERSION });
}

async function deleteCloudLearner(request, env) {
  const auth = await authorizeLearner(request, env);
  if (auth.error) return json(request, { error: auth.error }, auth.status);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM conversation_corpus WHERE learner_id = ?").bind(auth.learner.learner_id),
    env.DB.prepare("DELETE FROM learning_events WHERE learner_id = ?").bind(auth.learner.learner_id),
    env.DB.prepare("DELETE FROM learners WHERE learner_id = ?").bind(auth.learner.learner_id),
  ]);
  return json(request, { deleted: true });
}

function json(request, data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

function realtimeInstructions({ target, nativeLanguage, scenario, prep }) {
  return `You are Luma, a live language teacher on a real phone call with one adult learner.
Teaching goal: build spontaneous, transferable ${target} communication inside this learner's real life.
Strongest support language: ${nativeLanguage}. Current situation: ${scenario}.
Pre-class brief: ${prep ? boundedJson(prep, 2800) : "No prior brief; diagnose naturally through conversation."}

Act as an adaptive agent, not a scripted exercise or questionnaire. Maintain a private working hypothesis about the learner's intention, comprehension, retrieval, grammar, pronunciation, confidence, and cognitive load. Choose your next move from the evidence: continue the real situation, react as the other person, clarify a misunderstanding, model one useful phrase, briefly coach pronunciation, change roles, raise or lower pressure, retrieve an older memory, or move to a surprising but relevant new context. Never announce a fixed sequence and never cycle through canned question patterns.

Make memory efficient: ask for generation before showing a model; give at most one semantic cue and fade it immediately; after an error, invite one corrected retry without shame; after success, interleave a confusable expression and later test the same function in a changed context. Introduce no more than three genuinely new memory targets in one call. For pronunciation, use a short listen-contrast-shadow-free-production sequence and vary voice, speed, or phonetic context rather than drilling one identical token. Near the learner's bedtime, end new learning early with one short successful retrieval that can consolidate during sleep.

Begin the call yourself with a short natural opening tied to the situation. Allow interruption and respond immediately to changed intent. Keep most turns to one or two spoken sentences. Do not correct every error. If meaning lands, keep the conversation alive; intervene only when one change has high learning value. When pronunciation materially affects intelligibility or natural rhythm, refer to what you actually heard in the audio—sounds, stress, rhythm, linking, pace, or hesitation—then give a short contrast and invite one natural retry. Do not claim laboratory phoneme scoring or diagnostic certainty.

Vary interaction moves and emotional texture. You may disagree, misunderstand plausibly, remember something the learner said, tell a short story, ask for a decision, switch roles, create time pressure, or invite the learner to teach you. Preserve psychological safety and adult dignity. Use ${nativeLanguage} briefly only for rescue or a concise explanation, then return to ${target}. Do not end after three replies; continue until the learner ends the call.`;
}

async function realtimeSession(request, env) {
  if (!env.OPENAI_API_KEY) return json(request, { error: "Realtime voice is not configured." }, 503);
  const url = new URL(request.url);
  const target = String(url.searchParams.get("target") || "Spanish").slice(0, 40);
  const nativeLanguage = String(url.searchParams.get("native") || "English").slice(0, 40);
  const scenario = String(url.searchParams.get("scenario") || "a spontaneous real-life call").slice(0, 300);
  const sdp = await request.text();
  if (!sdp.includes("v=0")) return json(request, { error: "A valid WebRTC offer is required." }, 400);
  let prep = null;
  let safetyIdentifier = "anonymous-luma-learner";
  const credentials = cloudCredentials(request);
  if (credentials.learnerId && credentials.secret) {
    const auth = await authorizeLearner(request, env);
    if (!auth.error) {
      prep = safeJson(auth.learner.prep_json, null);
      safetyIdentifier = await sha256(auth.learner.learner_id);
    }
  }
  const session = {
    type: "realtime",
    model: env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
    output_modalities: ["audio"],
    instructions: realtimeInstructions({ target, nativeLanguage, scenario, prep }),
    audio: {
      input: {
        transcription: { model: env.OPENAI_TRANSCRIBE_MODEL || "gpt-realtime-whisper" },
        turn_detection: {
          type: "semantic_vad",
          eagerness: "low",
          create_response: true,
          interrupt_response: true,
        },
      },
      output: { voice: env.OPENAI_REALTIME_VOICE || "marin" },
    },
    tools: [{
      type: "function",
      name: "record_learning_observation",
      description: "Privately record one evidence-backed learning observation when it should change future teaching. Do not call after every turn.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          skill: { type: "string", enum: ["listening", "speaking", "reading", "writing"] },
          score: { type: "number", minimum: 0, maximum: 1 },
          hesitation: { type: "number", minimum: 0, maximum: 1 },
          transfer: { type: "boolean" },
          phrase: { type: "string" },
          context: { type: "string" },
          nextMove: { type: "string" },
          hints: { type: "integer", minimum: 0, maximum: 3 },
          technique: { type: "string" },
        },
        required: ["skill", "score", "hesitation", "transfer", "phrase", "context", "nextMove", "hints", "technique"],
      },
    }],
  };
  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(session));
  const baseUrl = String(env.OPENAI_REALTIME_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/realtime/calls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "OpenAI-Safety-Identifier": safetyIdentifier,
    },
    body: form,
  });
  const answer = await response.text();
  if (!response.ok) return json(request, { error: "Realtime session creation failed.", detail: answer.slice(0, 500) }, response.status);
  return new Response(answer, {
    status: 200,
    headers: { ...corsHeaders(request), "Content-Type": "application/sdp" },
  });
}

function coachInstructions(target, nativeLanguage) {
  return `You are Luma, an expert interactive second-language teacher for busy adults.
Your job is not to complete a chat turn; it is to build transferable listening, speaking, reading, and writing capability for this particular learner.
Continue a real conversation in ${target}; do not end after one answer. Ask exactly one short, relevant follow-up question in ${target} that adapts to what the learner said.
All explanations, meanings, and coaching must be in ${nativeLanguage}. The reply itself must be in ${target}, followed by its ${nativeLanguage} translation in replyTranslation.
For every learner response: confirm whether the intended meaning landed, identify the single highest-value grammar or clarity improvement, provide a natural corrected version in ${target}, and give one concrete pronunciation focus. Pronunciation guidance must honestly be based on the speech-recognition transcript—not claim acoustic analysis.
Explain one or two useful words from your reply in context, each with a short meaning in ${nativeLanguage} and an example in ${target}.
The reply field must contain only ${target}; never mix an explanation in ${nativeLanguage} into reply. Put explanations in grammarCorrection, vocabulary, and replyTranslation.
If intent is clarify, this is a comprehension repair—not a request to repeat. In grammarCorrection, give the complete meaning of the previous coach sentence in ${nativeLanguage}, then break it into short target-language chunks with ${nativeLanguage} meanings. In naturalVersion, provide a genuinely simpler target-language alternative. The reply must ask a different, shorter question using simpler vocabulary. Never repeat the same sentence or merely speak it more slowly. If intent is vocabulary, explain the important words in vocabulary before continuing.
The learner may use ${nativeLanguage}, Chinese, or another strongest language whenever they cannot yet express an important meaning in ${target}. This is a bridge, not a failure. If intent is bridge, detect the language actually used, infer the intended meaning, put one short natural ${target} version in naturalVersion, explain it briefly in that detected language, and ask the learner to personalize or reuse it. Do not correct the learner's bridge language. If the learner asks what something means—even without selecting a help button—answer the meaning question before continuing.
Be warm, concise, adult, and specific. Never overwhelm the learner with a list of every error. Return valid JSON only.`;
}

function normalizedHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-8).map((message) => ({
    role: message?.role === "coach" ? "assistant" : "user",
    content: String(message?.text || "").slice(0, 600),
  }));
}

function parseModelJson(text) {
  const clean = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(clean);
}

async function loadLanguagePulse(env, locale) {
  const endpoint = String(
    env.LANGUAGE_PULSE_URL ||
      "https://cuihaitao202.github.io/luma-language-agent/language-pulse.json",
  );
  try {
    const url = new URL(endpoint);
    if (env.LANGUAGE_PULSE_URL) url.searchParams.set("locale", locale || "en-US");
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("pulse unavailable");
    const data = await response.json();
    const selected = data.locales?.[locale] || data;
    return {
      live: Boolean(selected.live),
      source: String(selected.source || url.hostname).slice(0, 160),
      updatedAt: selected.updatedAt ? String(selected.updatedAt).slice(0, 40) : null,
      items: Array.isArray(selected.items) ? selected.items.slice(0, 12) : [],
    };
  } catch {
    return { live: false, source: "Live source unavailable; using baseline corpus guidance", updatedAt: null, items: [] };
  }
}

async function coach(request, env) {
  if (!env.OPENAI_API_KEY)
    return json(request, { demo: true, error: "Live coaching is not configured." }, 503);
  const body = await request.json();
  let cloudPrep = null;
  let cloudLearnerId = null;
  if (body.cloudLearnerId && body.cloudSecret) {
    const cloudAuth = await authorizeLearner(request, env, body);
    if (!cloudAuth.error) {
      cloudLearnerId = cloudAuth.learner.learner_id;
      cloudPrep = safeJson(cloudAuth.learner.prep_json, null);
    }
  }
  const target = String(body.targetLanguage || "Spanish").slice(0, 40);
  const nativeLanguage = String(body.nativeLanguage || "English").slice(0, 40);
  const scenario = String(body.scenario || "a daily real-life conversation").slice(0, 180);
  const utterance = String(body.utterance || "").slice(0, 1000);
  const intent = ["respond", "clarify", "vocabulary", "bridge"].includes(body.intent)
    ? body.intent
    : "respond";
  const confidence = Number(body.recognitionConfidence);
  const history = normalizedHistory(body.history);
  const learnerModel = body.learnerModel && typeof body.learnerModel === "object"
    ? JSON.stringify(body.learnerModel).slice(0, 2400)
    : "No prior learner evidence yet; diagnose gently through the task.";
  const socialContext = body.socialContext && typeof body.socialContext === "object"
    ? body.socialContext
    : null;
  const languagePulse = await loadLanguagePulse(
    env,
    socialContext?.localeCode || socialContext?.locale || "en-US",
  );
  const pulseContext = languagePulse.live
    ? JSON.stringify({ source: languagePulse.source, updatedAt: languagePulse.updatedAt, items: languagePulse.items }).slice(0, 2600)
    : "No verified live pulse. Do not call any slang, abbreviation, meme, or internet expression current or trending.";
  if (!utterance.trim()) return json(request, { error: "An utterance is required." }, 400);

  const baseUrl = String(env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const headers = {
    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  };
  const requestedModel = env.OPENAI_MODEL || "gpt-5.6-terra";
  const previousCoachSentence = [...history].reverse().find((message) => message.role === "assistant")?.content || "not available";
  const learnerContext = `Scenario: ${scenario}\nIntent: ${intent}\nPrevious coach sentence that may need explanation: ${previousCoachSentence}\nSpeech-recognition confidence: ${Number.isFinite(confidence) ? confidence : "not available"}\nLearner model: ${learnerModel}\nCloud pre-class brief: ${cloudPrep ? boundedJson(cloudPrep, 2400) : "not available"}\nSocial context: ${JSON.stringify(socialContext)}\nVerified language pulse: ${pulseContext}\nLatest learner message: ${utterance}\nUse the learner model and pre-class brief only as provisional hypotheses. Keep the task meaningful, tune support to observed hesitation, retrieve previously learned language when relevant, and vary the context to test transfer. For rare professional language, teach a reusable phrase or collocation in its authentic rhetorical function—not an isolated definition. In AI and AR technical contexts, cycle through: infer the term from a paper-like sentence; give a precise plain-language explanation; notice its common collocations and contrast terms; ask the learner to explain the mechanism aloud; challenge one causal claim or trade-off; later retrieve it in a design review, paper Q&A, or written abstract. Distinguish an established technical term from a newly coined paper term, and never invent a paper citation. Simulate the relationship, channel, power distance, pace, and listener reaction turn by turn. Teach pragmatic moves such as entering a group, soft disagreement, repair, humor, and exiting naturally. For colloquialisms, abbreviations, or internet language, state the locale, relationship/channel fit, and whether the learner should actively use it or only recognize it. Treat language as current only when supported by the verified pulse above.`;

  let apiResponse = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: requestedModel,
      reasoning: { effort: "low" },
      instructions: coachInstructions(target, nativeLanguage),
      input: [
        ...history,
        { role: "user", content: learnerContext },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "luma_conversation_turn",
          strict: true,
          schema: coachSchema,
        },
      },
    }),
  });

  let outputText;
  let reportedModel;
  let apiSurface = "responses";
  if (apiResponse.status === 404 || apiResponse.status === 405) {
    apiSurface = "chat_completions";
    apiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: requestedModel,
        messages: [
          { role: "system", content: coachInstructions(target, nativeLanguage) },
          ...history,
          { role: "user", content: learnerContext },
        ],
        response_format: { type: "json_object" },
        max_tokens: 900,
      }),
    });
    const chatData = await apiResponse.json();
    outputText = chatData.choices?.[0]?.message?.content;
    reportedModel = chatData.model;
  } else if (apiResponse.ok) {
    const data = await apiResponse.json();
    outputText =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .find((item) => item.type === "output_text")?.text;
    reportedModel = data.model;
  }
  if (!apiResponse.ok || !outputText)
    return json(request, { error: "AI coaching request failed." }, 502);

  const result = parseModelJson(outputText);
  if (cloudLearnerId) {
    await saveCloudEvidence(env, cloudLearnerId, {
      type: "coach-turn",
      skill: "speaking",
      score: result.understood ? 0.78 : 0.38,
      hesitation: Number.isFinite(confidence) ? 1 - confidence : 0.2,
      transfer: Boolean(body.transfer),
      strategy: "focused-recast",
      context: scenario,
      memoryKey: result.naturalVersion,
    });
    await saveConsentedCorpus(env, cloudLearnerId, body, result);
    await env.DB.prepare("UPDATE learners SET last_active_at = ?, updated_at = ? WHERE learner_id = ?")
      .bind(Date.now(), Date.now(), cloudLearnerId).run();
  }
  return json(request, {
    ...result,
    _meta: {
      requestedModel,
      reportedModel: reportedModel || requestedModel,
      apiSurface,
      languagePulse: {
        live: languagePulse.live,
        source: languagePulse.source,
        updatedAt: languagePulse.updatedAt,
      },
    },
  });
}

async function contextualLookup(request, env) {
  if (!env.OPENAI_API_KEY) return json(request, { error: "Live contextual lookup is not configured." }, 503);
  const body = await request.json();
  const query = String(body.query || "").slice(0, 300);
  const context = String(body.context || "").slice(0, 4000);
  const image = String(body.image || "");
  const target = String(body.targetLanguage || "English").slice(0, 40);
  const nativeLanguage = String(body.nativeLanguage || "Mandarin Chinese").slice(0, 40);
  if (!query.trim() && !context.trim() && !image.startsWith("data:image/")) return json(request, { error: "Add a word, context, or screenshot." }, 400);
  if (image.length > 5_500_000) return json(request, { error: "Screenshot is too large." }, 413);
  const instructions = `You are a context-first lexicographer and language teacher. Identify the unknown or fuzzily typed ${target} word from the learner's text or screenshot. Infer its meaning in the supplied sentence and professional domain before giving its general dictionary meaning. Explain fully in ${nativeLanguage}, then explain again in very simple ${target}. Distinguish literal dictionary sense from the sense actually used here. In software, finance, AI, optics, engineering, and research, treat ordinary words used metaphorically or as domain labels carefully. Do not invent missing context: state ambiguity and lower confidence. Give natural, corpus-like examples and collocations, not translated word salad. End with one short recall prompt that will let the learner reconstruct the meaning later. Return JSON only.`;
  const content = [{ type: "input_text", text: `Fuzzy word or hint: ${query || "not supplied"}\nPasted context: ${context || "not supplied"}` }];
  if (image.startsWith("data:image/")) content.push({ type: "input_image", image_url: image });
  const baseUrl = String(env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5.6-terra",
      reasoning: { effort: "low" },
      instructions,
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "contextual_word_lookup", strict: true, schema: lookupSchema } },
    }),
  });
  const data = await response.json();
  if (!response.ok) return json(request, { error: "Context analysis failed." }, 502);
  const outputText = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!outputText) return json(request, { error: "No contextual explanation was returned." }, 502);
  return json(request, parseModelJson(outputText));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (env.DB && ctx?.waitUntil) {
      ctx.waitUntil(prepareInactiveLearners(env).catch(() => 0));
    }
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (url.pathname === "/api/health")
      return json(request, {
        ok: true,
        liveCoach: Boolean(env.OPENAI_API_KEY),
        configuredModel: env.OPENAI_MODEL || "gpt-5.6-terra",
        apiStrategy: "responses_with_chat_completions_fallback",
        coachingMode: "multi_turn_interactive",
        cloudLearning: Boolean(env.DB),
        realtimeVoice: Boolean(env.OPENAI_API_KEY),
        realtimeModel: env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
      });
    if (url.pathname === "/api/realtime/session" && request.method === "POST") {
      try {
        return await realtimeSession(request, env);
      } catch (error) {
        return json(request, { error: "Realtime voice unavailable.", detail: String(error?.message || error) }, 500);
      }
    }
    if (url.pathname === "/api/learner" && ["GET", "POST"].includes(request.method)) {
      try {
        return await cloudLearner(request, env);
      } catch (error) {
        return json(request, { error: "Cloud learning unavailable.", detail: String(error?.message || error) }, 500);
      }
    }
    if (url.pathname === "/api/learner" && request.method === "DELETE") {
      try {
        return await deleteCloudLearner(request, env);
      } catch (error) {
        return json(request, { error: "Cloud learning deletion failed.", detail: String(error?.message || error) }, 500);
      }
    }
    if (url.pathname === "/api/coach" && request.method === "POST") {
      try {
        return await coach(request, env);
      } catch (error) {
        return json(
          request,
          { error: "Coach unavailable.", detail: String(error?.message || error) },
          500,
        );
      }
    }
    if (url.pathname === "/api/lookup" && request.method === "POST") {
      try {
        return await contextualLookup(request, env);
      } catch (error) {
        return json(request, { error: "Context lookup unavailable.", detail: String(error?.message || error) }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(prepareInactiveLearners(env));
  },
};
