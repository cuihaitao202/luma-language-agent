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
      preferredSkill: profile.preferredSkill || "adaptive",
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
  const preferredSkill = SKILLS.includes(safe.profile?.preferredSkill)
    ? safe.profile.preferredSkill
    : weakSkill;
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
    if (due.lookup?.status === "unresolved") {
      return {
        mode: "knowledge-gap-repair",
        skill: "reading",
        memory: due,
        reason: `Resolve the unanswered question about “${due.term || due.phrase}” before adding new material.`,
      };
    }
    return {
      mode: "transfer-retrieval",
      skill: preferredSkill,
      memory: due,
      reason: `Recall “${due.phrase}” in a new situation before it fades.`,
    };
  }
  return {
    mode: "diagnostic-mission",
    skill: preferredSkill,
    memory: due || null,
    reason: `Collect one useful piece of ${preferredSkill} evidence inside a real task.`,
  };
}

export function learnerSnapshot(model) {
  const safe = model || createLearnerModel();
  const action = nextBestAction(safe);
  const knowledgeGaps = Object.values(safe.memories || {})
    .filter((memory) => memory?.lookup?.status !== "unresolved")
    .map((memory) => ({
      term: memory.term || memory.phrase || memory.intent,
      lookupCount: Number(memory.lookupCount || 0),
      lapses: Number(memory.lapses || 0),
      lastScore: Number(memory.lastScore ?? 0.5),
      knownContexts: memory.contexts || [],
      contextualMeaning: memory.lookup?.contextualMeaning || "",
    }))
    .filter((memory) => memory.term)
    .sort((a, b) => (
      b.lookupCount * 2.4 + b.lapses * 1.8 + Math.max(0, 0.7 - b.lastScore) * 5
    ) - (
      a.lookupCount * 2.4 + a.lapses * 1.8 + Math.max(0, 0.7 - a.lastScore) * 5
    ))
    .slice(0, 3);
  return {
    goal: safe.profile?.goal,
    domain: safe.profile?.domain,
    difficultMoment: safe.profile?.difficultMoment,
    focusTracks: safe.profile?.focusTracks || ["life", "ai-research", "ar-waveguide"],
    technicalDomains: safe.profile?.technicalDomains,
    localeProfile: safe.profile?.localeProfile,
    knowledgeGaps,
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
      lookup: action.memory?.lookup ? {
        term: action.memory.term,
        status: action.memory.lookup.status,
        contextualMeaning: action.memory.lookup.contextualMeaning,
        retrievalPrompt: action.memory.lookup.retrievalPrompt,
        pronunciationText: action.memory.lookup.pronunciationText,
        phonetic: action.memory.lookup.phonetic,
      } : null,
    },
    learningPlan: learningPlan(safe),
    instruction:
      "Treat these estimates as provisional. Elicit evidence through a meaningful task, adapt difficulty from success and hesitation, and test transfer rather than recognition.",
  };
}

export function recentLookupHistory(model, limit = 50) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
  const stored = Array.isArray(model?.lookupHistory) ? model.lookupHistory : [];
  if (stored.length) {
    return [...stored]
      .sort((a, b) => Number(b.at || 0) - Number(a.at || 0))
      .slice(0, safeLimit);
  }
  return Object.values(model?.memories || {})
    .filter((memory) => memory?.lookup)
    .map((memory) => ({
      id: `${memory.key}:${memory.lastLookupAt || memory.lastSeenAt || 0}`,
      key: memory.key,
      at: memory.lastLookupAt || memory.lastSeenAt || 0,
      status: memory.lookup.status,
      term: memory.term || memory.phrase,
      query: memory.lookup.originalQuestion || memory.term || "",
      context: memory.lookup.sourceText || "",
      imageName: memory.lookup.sourceType === "image" ? memory.lookup.originalQuestion : "",
      sourceType: memory.lookup.sourceType || "text",
      result: memory.lookup.status === "resolved" ? {
        term: memory.term || memory.phrase,
        ...memory.lookup,
      } : null,
    }))
    .sort((a, b) => Number(b.at || 0) - Number(a.at || 0))
    .slice(0, safeLimit);
}

export function lookupReviewQueue(model, now = Date.now(), limit = 10) {
  const safeLimit = Math.max(1, Math.min(30, Number(limit) || 10));
  return Object.values(model?.memories || {})
    .filter((memory) => memory?.lookup?.status === "resolved")
    .map((memory) => {
      const recall = retrievability(memory, now);
      const overdueHours = Math.max(0, now - Number(memory.nextDueAt || 0)) / 36e5;
      const weakness =
        (1 - recall) * 5
        + Math.min(3, Number(memory.lapses || 0)) * 1.2
        + Math.min(4, Number(memory.lookupCount || 0)) * 0.35
        + Math.max(0, 0.72 - Number(memory.lastScore ?? 0.45)) * 3
        + Math.min(3, overdueHours / 24);
      return {
        ...memory,
        recall,
        due: Number(memory.nextDueAt || 0) <= now,
        reviewPriority: weakness,
      };
    })
    .sort((a, b) => Number(b.due) - Number(a.due)
      || b.reviewPriority - a.reviewPriority
      || Number(b.lastLookupAt || 0) - Number(a.lastLookupAt || 0))
    .slice(0, safeLimit);
}

export function gradeLookupMemory(model, memoryKey, rating, now = Date.now()) {
  const current = model?.memories?.[memoryKey];
  if (!current?.lookup || current.lookup.status !== "resolved") return structuredClone(model);
  const grade = {
    again: { score: 0.2, hints: 2, hours: 1 / 6 },
    hard: { score: 0.55, hints: 1, hours: 24 },
    good: { score: 0.82, hints: 0, hours: Math.max(48, Number(current.stabilityHours || 8) * 0.72) },
    easy: { score: 0.96, hints: 0, hours: Math.max(96, Number(current.stabilityHours || 8) * 1.2) },
  }[String(rating).toLowerCase()] || { score: 0.55, hints: 1, hours: 24 };
  const next = recordEvidence(model, {
    skill: "reading",
    score: grade.score,
    hints: grade.hints,
    transfer: rating === "easy",
    memoryKey,
    phrase: current.phrase,
    context: current.contexts?.at(-1) || current.lookup.detectedDomain || "context lookup review",
  }, now);
  next.memories[memoryKey].nextDueAt = now + grade.hours * 36e5;
  next.memories[memoryKey].lastReviewRating = String(rating).toLowerCase();
  return next;
}

export function saveContextualLookup(model, lookup, now = Date.now()) {
  const next = structuredClone(model || createLearnerModel());
  const status = lookup?.status === "unresolved" ? "unresolved" : "resolved";
  const term = String(
    lookup?.term
      || lookup?.query
      || lookup?.context
      || lookup?.imageName
      || "unresolved image question",
  ).trim().slice(0, 120);
  if (!term) return next;
  const domain = String(lookup.domain || lookup.detectedDomain || "general");
  const key = String(
    lookup.blindSpotKey
      || `lookup:${term.toLocaleLowerCase()}:${domain.toLocaleLowerCase()}`,
  ).slice(0, 260);
  const existing = next.memories[key] || {
    key,
    intent: `understand and use “${term}” in ${domain}`,
    phrase: lookup.naturalExample || term,
    contexts: [],
    stabilityHours: 8,
    successfulRetrievals: 0,
    difficulty: 7,
    lapses: 0,
    retrievalHistory: [],
  };
  existing.term = term;
  existing.lookupCount = Number(existing.lookupCount || 0)
    + (status === "unresolved" || !existing.lookup ? 1 : 0);
  existing.lastLookupAt = now;
  existing.lookup = {
    status,
    sourceType: String(lookup.sourceType || (lookup.imageName ? "image" : "text")),
    originalQuestion: String(lookup.query || lookup.context || lookup.imageName || term).slice(0, 800),
    pronunciationText: String(lookup.pronunciationText || term),
    pronunciationLanguage: String(lookup.pronunciationLanguage || lookup.targetLanguage || ""),
    phonetic: String(lookup.phonetic || ""),
    pronunciation: String(lookup.pronunciation || ""),
    sourceText: String(lookup.sourceText || "").slice(0, 800),
    detectedDomain: domain,
    nativeExplanation: String(lookup.nativeExplanation || ""),
    plainExplanation: String(lookup.plainExplanation || ""),
    contextualMeaning: String(lookup.contextualMeaning || ""),
    dictionaryContrast: String(lookup.dictionaryContrast || ""),
    naturalExample: String(lookup.naturalExample || ""),
    commonCollocations: Array.isArray(lookup.commonCollocations) ? lookup.commonCollocations.slice(0, 8) : [],
    examples: Array.isArray(lookup.examples) ? lookup.examples.slice(0, 5) : [],
    usageNote: String(lookup.usageNote || ""),
    retrievalPrompt: String(lookup.retrievalPrompt || `What did “${term}” mean when you looked it up?`),
  };
  existing.lastSeenAt = now;
  if (status === "resolved") existing.phrase = String(lookup.naturalExample || term);
  existing.nextDueAt = now + (status === "unresolved" ? 1 : 8) * 36e5;
  existing.stabilityHours = status === "unresolved"
    ? 1
    : Math.max(8, existing.stabilityHours || 8);
  existing.difficulty = status === "unresolved" ? 9 : Math.max(6, Number(existing.difficulty || 7));
  existing.lapses = Number(existing.lapses || 0) + (status === "unresolved" ? 1 : 0);
  existing.experiment = {
    stage: status === "unresolved" ? "knowledge-gap-detected" : "meaning-understood",
    nextTest: status === "unresolved" ? "resolve-then-retrieve" : "context-reconstruction",
    variant: Object.keys(next.memories).length % 2 === 0 ? "example-first" : "contrast-first",
  };
  if (!existing.contexts.includes(domain)) existing.contexts = [...existing.contexts, domain].slice(-5);
  next.memories[key] = existing;
  next.lookupHistory = Array.isArray(next.lookupHistory) ? next.lookupHistory : [];
  const historyEntry = {
    id: `${key}:${now}`,
    key,
    at: now,
    status,
    term,
    query: String(lookup.query || term).slice(0, 800),
    context: String(lookup.context || lookup.sourceText || "").slice(0, 4000),
    imageName: String(lookup.imageName || "").slice(0, 240),
    sourceType: existing.lookup.sourceType,
    result: status === "resolved" ? {
      term,
      detectedDomain: domain,
      confidence: String(lookup.confidence || ""),
      ...existing.lookup,
    } : null,
  };
  if (status === "resolved") {
    const pendingIndex = next.lookupHistory.findIndex(
      (item) => item.key === key && item.status === "unresolved",
    );
    if (pendingIndex >= 0) {
      historyEntry.id = next.lookupHistory[pendingIndex].id;
      historyEntry.at = next.lookupHistory[pendingIndex].at || now;
      next.lookupHistory[pendingIndex] = historyEntry;
    } else {
      next.lookupHistory.unshift(historyEntry);
    }
  } else {
    next.lookupHistory.unshift(historyEntry);
  }
  next.lookupHistory = next.lookupHistory.slice(0, 100);
  next.recentSignals = [
    {
      skill: "reading",
      score: status === "unresolved" ? 0.2 : 0.45,
      hesitation: status === "unresolved" ? 0.8 : 0.5,
      transfer: false,
      at: now,
      source: status === "unresolved" ? "knowledge-gap" : "contextual-lookup",
      memoryKey: key,
    },
    ...(next.recentSignals || []),
  ].slice(0, 20);
  return next;
}
