const SKILLS = ["listening", "speaking", "reading", "writing"];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createLearnerModel(profile = {}) {
  return {
    version: 2,
    createdAt: Date.now(),
    profile: {
      goal: profile.goal || "communicate in real life",
      domain: profile.domain || "daily life",
      difficultMoment: profile.difficultMoment || "finding words quickly",
      focusTracks: profile.focusTracks || ["life", "ai-research", "ar-waveguide"],
      technicalDomains: profile.technicalDomains || {
        embodiedAI: ["VLM training", "VLA training", "world model training"],
        arOptics: ["array waveguide", "PVG volume holographic waveguide", "slanted and gradient SRG"],
      },
      localeProfile: profile.localeProfile || null,
    },
    skills: Object.fromEntries(
      SKILLS.map((skill) => [skill, { estimate: 0.45, evidence: 0 }]),
    ),
    memories: {},
    recentSignals: [],
    learningPolicy: {
      desiredRetention: 0.88,
      maxNewMemoriesPerSession: 3,
      preferGenerationBeforeExplanation: true,
      interleaveAfterSuccesses: 2,
    },
  };
}

export function retrievability(memory, now = Date.now()) {
  if (!memory?.lastSeenAt) return 0;
  const elapsedHours = Math.max(0, now - memory.lastSeenAt) / 36e5;
  return Math.exp(-elapsedHours / Math.max(1, memory.stabilityHours || 18));
}

export function recordEvidence(model, evidence, now = Date.now()) {
  const next = structuredClone(model || createLearnerModel());
  next.version = 2;
  next.learningPolicy ||= {
    desiredRetention: 0.88,
    maxNewMemoriesPerSession: 3,
    preferGenerationBeforeExplanation: true,
    interleaveAfterSuccesses: 2,
  };
  const skill = SKILLS.includes(evidence.skill) ? evidence.skill : "speaking";
  const score = clamp(Number(evidence.score ?? 0.5), 0, 1);
  const hesitation = clamp(Number(evidence.hesitation ?? 0), 0, 1);
  const transfer = Boolean(evidence.transfer);
  const hints = clamp(Number(evidence.hints ?? 0), 0, 3);
  const latencyMs = Math.max(0, Number(evidence.responseLatencyMs ?? 0));
  const latencyPenalty = latencyMs > 0 ? clamp((latencyMs - 1800) / 18000, 0, 0.22) : 0;
  const current = next.skills[skill] || { estimate: 0.45, evidence: 0 };
  const weight = Math.min(0.32, 0.14 + current.evidence * 0.015);
  current.estimate = clamp(
    current.estimate * (1 - weight) + (score - hesitation * 0.15 - hints * 0.06 - latencyPenalty) * weight,
    0.05,
    0.98,
  );
  current.evidence += 1;
  next.skills[skill] = current;

  const key = String(evidence.memoryKey || evidence.intent || "useful-language");
  const previous = next.memories[key] || {
    key,
    intent: evidence.intent || key,
    phrase: evidence.phrase || key,
    contexts: [],
    stabilityHours: 18,
    successfulRetrievals: 0,
    difficulty: 5,
    lapses: 0,
    retrievalHistory: [],
  };
  const priorR = retrievability(previous, now);
  const unaided = hints === 0;
  const quality = clamp(score - hesitation * 0.2 - hints * 0.1 - latencyPenalty + (transfer ? 0.12 : 0), 0, 1);
  previous.difficulty = clamp(
    Number(previous.difficulty || 5) + (0.68 - quality) * 1.6 - (transfer ? 0.18 : 0),
    1,
    10,
  );
  const desirableDifficultyBonus = priorR >= 0.35 && priorR <= 0.82 && quality >= 0.72 ? 0.35 : 0;
  const growth = quality >= 0.72
    ? 1.45 + priorR * 0.55 + desirableDifficultyBonus + (unaided ? 0.18 : 0)
    : quality >= 0.45 ? 1.08 : 0.55;
  previous.stabilityHours = clamp(previous.stabilityHours * growth, 4, 24 * 180);
  previous.lastSeenAt = now;
  previous.nextDueAt = now + previous.stabilityHours * 36e5 * 0.72;
  previous.lastScore = score;
  previous.hesitation = hesitation;
  previous.successfulRetrievals += quality >= 0.65 ? 1 : 0;
  previous.lapses = Number(previous.lapses || 0) + (quality < 0.45 ? 1 : 0);
  previous.lastQuality = quality;
  previous.lastLatencyMs = latencyMs || null;
  previous.lastHints = hints;
  previous.retrievalHistory = [
    ...(previous.retrievalHistory || []),
    { at: now, quality, unaided, transfer, latencyMs: latencyMs || null },
  ].slice(-12);
  previous.phrase = evidence.phrase || previous.phrase;
  if (evidence.context && !previous.contexts.includes(evidence.context)) {
    previous.contexts = [...previous.contexts, evidence.context].slice(-5);
  }
  next.memories[key] = previous;
  next.recentSignals = [
    { skill, score, hesitation, transfer, hints, latencyMs: latencyMs || null, at: now },
    ...(next.recentSignals || []),
  ].slice(0, 20);
  return next;
}

export function practiceTechnique(memory, skill = "speaking", now = Date.now()) {
  if (!memory) return { mode: "generation-first", reason: "Attempt meaning before seeing a model." };
  const r = retrievability(memory, now);
  if (skill === "speaking" && (memory.lastScore || 0) < 0.72) {
    return { mode: "listen-contrast-shadow-transfer", reason: "Hear varied models, discriminate the contrast, shadow briefly, then speak freely." };
  }
  if (r < 0.45 || Number(memory.lapses || 0) > 1) {
    return { mode: "cue-fade-repair", reason: "Start with a semantic cue, repair one error, then remove the cue immediately." };
  }
  if (r < 0.82) {
    return { mode: "free-recall", reason: "Retrieval is effortful enough to strengthen memory without a hint." };
  }
  if ((memory.successfulRetrievals || 0) >= 2) {
    return { mode: "interleaved-transfer", reason: "Contrast it with a confusable expression inside a changed role and situation." };
  }
  return { mode: "generation-first", reason: "Produce a personal example before receiving explanation." };
}

export function learningPlan(model, now = Date.now(), localHour = new Date(now).getHours()) {
  const action = nextBestAction(model, now);
  const technique = practiceTechnique(action.memory, action.skill, now);
  const beforeSleep = localHour >= 20 || localHour <= 1;
  return {
    targetSkill: action.skill,
    memoryKey: action.memory?.key || null,
    technique: technique.mode,
    why: technique.reason,
    steps: [
      "generation-before-model",
      technique.mode,
      "immediate-corrected-retry",
      "changed-context-transfer",
      beforeSleep ? "short-successful-bedtime-retrieval" : "schedule-at-desirable-difficulty",
    ],
    limits: { newMemories: 3, correctionsPerTurn: 1, hintsBeforeRetry: 1 },
    beforeSleep,
  };
}

export function nextBestAction(model, now = Date.now()) {
  const safe = model || createLearnerModel();
  const weakSkill = Object.entries(safe.skills || {})
    .sort((a, b) => a[1].estimate - b[1].estimate)[0]?.[0] || "speaking";
  const memories = Object.values(safe.memories || {});
  const due = memories
    .map((memory) => {
      const r = retrievability(memory, now);
      const desirableGap = Math.abs(r - Number(safe.learningPolicy?.desiredRetention || 0.88));
      const lapsePriority = Math.min(0.25, Number(memory.lapses || 0) * 0.06);
      return { ...memory, r, priority: desirableGap - lapsePriority };
    })
    .sort((a, b) => a.priority - b.priority)[0];
  if (due && (due.nextDueAt <= now || due.r < 0.62)) {
    return {
      mode: "transfer-retrieval",
      skill: weakSkill,
      memory: due,
      reason: `Recall “${due.phrase}” in a new situation before it fades.`,
    };
  }
  return {
    mode: "diagnostic-mission",
    skill: weakSkill,
    memory: due || null,
    reason: `Collect one useful piece of ${weakSkill} evidence inside a real task.`,
  };
}

export function learnerSnapshot(model) {
  const safe = model || createLearnerModel();
  const action = nextBestAction(safe);
  return {
    goal: safe.profile?.goal,
    domain: safe.profile?.domain,
    difficultMoment: safe.profile?.difficultMoment,
    focusTracks: safe.profile?.focusTracks || ["life", "ai-research", "ar-waveguide"],
    technicalDomains: safe.profile?.technicalDomains,
    localeProfile: safe.profile?.localeProfile,
    skillEstimates: Object.fromEntries(
      Object.entries(safe.skills || {}).map(([key, value]) => [
        key,
        Math.round(value.estimate * 100),
      ]),
    ),
    nextAction: {
      mode: action.mode,
      skill: action.skill,
      phrase: action.memory?.phrase || null,
      knownContexts: action.memory?.contexts || [],
    },
    learningPlan: learningPlan(safe),
    instruction:
      "Treat these estimates as provisional. Elicit evidence through a meaningful task, adapt difficulty from success and hesitation, and test transfer rather than recognition.",
  };
}

export function saveContextualLookup(model, lookup, now = Date.now()) {
  const next = structuredClone(model || createLearnerModel());
  const term = String(lookup?.term || "").trim();
  if (!term) return next;
  const domain = String(lookup.domain || lookup.detectedDomain || "general");
  const key = `lookup:${term.toLocaleLowerCase()}:${domain.toLocaleLowerCase()}`;
  const existing = next.memories[key] || {
    key,
    intent: `understand and use “${term}” in ${domain}`,
    phrase: lookup.naturalExample || term,
    contexts: [],
    stabilityHours: 8,
    successfulRetrievals: 0,
  };
  existing.term = term;
  existing.lookup = {
    sourceText: String(lookup.sourceText || "").slice(0, 800),
    detectedDomain: domain,
    nativeExplanation: String(lookup.nativeExplanation || ""),
    plainExplanation: String(lookup.plainExplanation || ""),
    contextualMeaning: String(lookup.contextualMeaning || ""),
    dictionaryContrast: String(lookup.dictionaryContrast || ""),
    commonCollocations: Array.isArray(lookup.commonCollocations) ? lookup.commonCollocations.slice(0, 8) : [],
    examples: Array.isArray(lookup.examples) ? lookup.examples.slice(0, 5) : [],
    usageNote: String(lookup.usageNote || ""),
  };
  existing.lastSeenAt = now;
  existing.nextDueAt = now + 8 * 36e5;
  existing.stabilityHours = Math.max(8, existing.stabilityHours || 8);
  existing.experiment = {
    stage: "meaning-understood",
    nextTest: "context-reconstruction",
    variant: Object.keys(next.memories).length % 2 === 0 ? "example-first" : "contrast-first",
  };
  if (!existing.contexts.includes(domain)) existing.contexts = [...existing.contexts, domain].slice(-5);
  next.memories[key] = existing;
  next.recentSignals = [
    { skill: "reading", score: 0.45, hesitation: 0.5, transfer: false, at: now, source: "contextual-lookup", memoryKey: key },
    ...(next.recentSignals || []),
  ].slice(0, 20);
  return next;
}
