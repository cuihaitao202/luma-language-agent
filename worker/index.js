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
Continue a real conversation in ${target}; do not end after one answer. Ask exactly one short, relevant follow-up question in ${target} that adapts to what the learner said.
All explanations, meanings, and coaching must be in ${nativeLanguage}. The reply itself must be in ${target}, followed by its ${nativeLanguage} translation in replyTranslation.
For every learner response: confirm whether the intended meaning landed, identify the single highest-value grammar or clarity improvement, provide a natural corrected version in ${target}, and give one concrete pronunciation focus. Pronunciation guidance must honestly be based on the speech-recognition transcript—not claim acoustic analysis.
Explain one or two useful words from your reply in context, each with a short meaning in ${nativeLanguage} and an example in ${target}.
The reply field must contain only ${target}; never mix an explanation in ${nativeLanguage} into reply. Put explanations in grammarCorrection, vocabulary, and replyTranslation.
If intent is clarify, use grammarCorrection to explain the previous sentence phrase by phrase in ${nativeLanguage}, then use reply to ask the question again more simply in ${target}. If intent is vocabulary, explain the important words in vocabulary before continuing.
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

async function coach(request, env) {
  if (!env.OPENAI_API_KEY)
    return json(request, { demo: true, error: "Live coaching is not configured." }, 503);
  const body = await request.json();
  const target = String(body.targetLanguage || "Spanish").slice(0, 40);
  const nativeLanguage = String(body.nativeLanguage || "English").slice(0, 40);
  const scenario = String(body.scenario || "a daily real-life conversation").slice(0, 180);
  const utterance = String(body.utterance || "").slice(0, 1000);
  const intent = ["respond", "clarify", "vocabulary"].includes(body.intent)
    ? body.intent
    : "respond";
  const confidence = Number(body.recognitionConfidence);
  const history = normalizedHistory(body.history);
  if (!utterance.trim()) return json(request, { error: "An utterance is required." }, 400);

  const baseUrl = String(env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const headers = {
    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  };
  const requestedModel = env.OPENAI_MODEL || "gpt-5.6-terra";
  const learnerContext = `Scenario: ${scenario}\nIntent: ${intent}\nSpeech-recognition confidence: ${Number.isFinite(confidence) ? confidence : "not available"}\nLatest learner message: ${utterance}`;

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
    },
  });
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
    return env.ASSETS.fetch(request);
  },
};
