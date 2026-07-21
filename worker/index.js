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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(request, data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

function coachInstructions(target, nativeLanguage) {
  return `You are Luma, an expert interactive second-language teacher for busy adults.
Your job is not to complete a chat turn; it is to build transferable listening, speaking, reading, and writing capability for this particular learner.
Continue a real conversation in ${target}; do not end after one answer. Ask exactly one short, relevant follow-up question in ${target} that adapts to what the learner said.
All explanations, meanings, and coaching must be in ${nativeLanguage}. The reply itself must be in ${target}, followed by its ${nativeLanguage} translation in replyTranslation.
For every learner response: confirm whether the intended meaning landed, identify the single highest-value grammar or clarity improvement, provide a natural corrected version in ${target}, and give one concrete pronunciation focus. Pronunciation guidance must honestly be based on the speech-recognition transcript—not claim acoustic analysis.
Explain one or two useful words from your reply in context, each with a short meaning in ${nativeLanguage} and an example in ${target}.
The reply field must contain only ${target}; never mix an explanation in ${nativeLanguage} into reply. Put explanations in grammarCorrection, vocabulary, and replyTranslation.
If intent is clarify, use grammarCorrection to explain the previous sentence phrase by phrase in ${nativeLanguage}, then use reply to ask the question again more simply in ${target}. If intent is vocabulary, explain the important words in vocabulary before continuing.
The learner may use ${nativeLanguage} whenever they cannot yet express an important meaning in ${target}. This is a bridge, not a failure. If intent is bridge, infer the intended meaning, put one short natural ${target} version in naturalVersion, explain it briefly in ${nativeLanguage}, and ask the learner to personalize or reuse it. Do not correct the learner's ${nativeLanguage}. If the learner asks what something means—even without selecting a help button—answer the meaning question before continuing.
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
  const learnerContext = `Scenario: ${scenario}\nIntent: ${intent}\nSpeech-recognition confidence: ${Number.isFinite(confidence) ? confidence : "not available"}\nLearner model: ${learnerModel}\nSocial context: ${JSON.stringify(socialContext)}\nVerified language pulse: ${pulseContext}\nLatest learner message: ${utterance}\nUse the learner model only as a provisional hypothesis. Keep the task meaningful, tune support to observed hesitation, retrieve previously learned language when relevant, and vary the context to test transfer. For rare professional language, teach a reusable phrase or collocation in its authentic rhetorical function—not an isolated definition. In AI and AR technical contexts, cycle through: infer the term from a paper-like sentence; give a precise plain-language explanation; notice its common collocations and contrast terms; ask the learner to explain the mechanism aloud; challenge one causal claim or trade-off; later retrieve it in a design review, paper Q&A, or written abstract. Distinguish an established technical term from a newly coined paper term, and never invent a paper citation. Simulate the relationship, channel, power distance, pace, and listener reaction turn by turn. Teach pragmatic moves such as entering a group, soft disagreement, repair, humor, and exiting naturally. For colloquialisms, abbreviations, or internet language, state the locale, relationship/channel fit, and whether the learner should actively use it or only recognize it. Treat language as current only when supported by the verified pulse above.`;

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
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (url.pathname === "/api/health")
      return json(request, {
        ok: true,
        liveCoach: Boolean(env.OPENAI_API_KEY),
        configuredModel: env.OPENAI_MODEL || "gpt-5.6-terra",
        apiStrategy: "responses_with_chat_completions_fallback",
        coachingMode: "multi_turn_interactive",
      });
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
};