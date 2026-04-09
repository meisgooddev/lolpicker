import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import {
  GamePlanError,
  GamePlanErrorPayload,
  USER_MESSAGES,
  generateRequestId,
} from './gamePlanErrors.js';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 5;

export interface GamePlanRequest {
  playerChampion: string;
  playerRole: string;
  playerSummonerSpells?: string[];
  allies: { name: string; role: string }[];
  enemies: { name: string; role: string }[];
  alliedBans: string[];
  enemyBans: string[];
}

// ── Prompt construction per stage ──────────────────────────────────────────

function buildStrategicCoreSystemPrompt(): string {
  return `You are an elite League of Legends coach.
Your job is to produce the high-level strategic core layer of a pre-game brief.

Rules:
- CRITICAL: Be extremely concise to conserve tokens. Use 1 short sentence per string. No fluff.
- Respond ONLY with a valid JSON object matching the following structure:

{
  "mission": "string",
  "compIdentity": "string",
  "laneApproach": "string",
  "midGameFocus": "string",
  "winCondition": "string",
  "dangerList": ["string"]
}`;
}

function buildExecutionLayerSystemPrompt(): string {
  return `You are an elite League of Legends coach.
Your job is to produce the tactical execution layer of a pre-game brief.

Rules:
- CRITICAL: Be extremely concise to conserve tokens.
- You MUST explicitly follow and support the Strategic Core provided by the user. Do exactly what it says.
- DO NOT override strategic decisions from the core. Only operationalize them.
- Respond ONLY with a valid JSON object matching the following structure:

{
  "jungleTracking": { "likelyStart": "string", "path": "string", "firstGankTiming": "string", "howToPlay": "string" },
  "priorityTargets": [ { "target": "string", "reason": "string" } ],
  "build": {
    "startItems": ["string"],
    "firstRecall": { "items": ["string"], "minGold": "string", "timing": "string" },
    "firstItem": { "name": "string", "why": "string", "spike": "string" },
    "coreItems": [ { "name": "string", "why": "string", "spike": "string" } ],
    "situational": [ { "name": "string", "why": "string" } ]
  },
  "microTips": ["string"]
}`;
}

function buildUserMessage(draft: GamePlanRequest, strategicCoreJson?: string): string {
  let msg = `DRAFT INFORMATION:

My champion: ${draft.playerChampion} (${draft.playerRole})
My summoner spells: ${draft.playerSummonerSpells?.join(', ') || 'Unknown'}

Allied team:
${draft.allies.map(a => `- ${a.name} (${a.role})`).join('\n')}

Enemy team:
${draft.enemies.map(e => `- ${e.name} (${e.role})`).join('\n')}

Bans (allied side): ${draft.alliedBans.join(', ')}
Bans (enemy side): ${draft.enemyBans.join(', ')}`;

  if (strategicCoreJson) {
    msg += `\n\nSTRATEGIC CORE (FOLLOW THIS EXACTLY):\n${strategicCoreJson}`;
  }

  return msg;
}

// ── Response shape validation ────────────────────────────────────────────

function extractTextFromGeminiResponse(data: unknown, requestId: string): string {
  if (!data || typeof data !== 'object') {
    throw new GamePlanError({
      status: 502,
      code: 'INVALID_PROVIDER_RESPONSE',
      source: 'provider',
      retryable: false,
      userMessage: USER_MESSAGES.INVALID_PROVIDER_RESPONSE,
      debugMessage: 'Provider response body is null or not an object.',
      requestId,
    });
  }

  const body = data as Record<string, any>;
  const candidates = body.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new GamePlanError({
      status: 502,
      code: 'INVALID_PROVIDER_RESPONSE',
      source: 'provider',
      retryable: false,
      userMessage: USER_MESSAGES.INVALID_PROVIDER_RESPONSE,
      debugMessage: `Provider response missing 'candidates' array. Keys: ${Object.keys(body).join(', ')}`,
      requestId,
      details: { promptFeedback: body.promptFeedback },
    });
  }

  const first = candidates[0];
  const text = first?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new GamePlanError({
      status: 502,
      code: 'INVALID_PROVIDER_RESPONSE',
      source: 'provider',
      retryable: false,
      userMessage: USER_MESSAGES.INVALID_PROVIDER_RESPONSE,
      debugMessage: `Provider candidate did not contain a text part. finishReason=${first?.finishReason}`,
      requestId,
      details: { finishReason: first?.finishReason, safetyRatings: first?.safetyRatings },
    });
  }

  return text;
}

function parseJsonFromText(rawText: string, requestId: string): any {
  const match = rawText.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : rawText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e: any) {
    throw new GamePlanError({
      status: 502,
      code: 'PARSE_FAILURE',
      source: 'parser',
      retryable: true, // Retry malformed outputs
      userMessage: USER_MESSAGES.PARSE_FAILURE,
      debugMessage: `JSON.parse failed: ${e.message}. First 300 chars: ${rawText.slice(0, 300)}`,
      requestId,
    });
  }
}

// ── Classify Axios / network errors into GamePlanError ───────────────────

function classifyAxiosError(err: AxiosError, requestId: string): GamePlanError {
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return new GamePlanError({
      status: 504,
      code: 'NETWORK_TIMEOUT',
      source: 'network',
      retryable: true,
      userMessage: USER_MESSAGES.NETWORK_TIMEOUT,
      debugMessage: `Axios timeout after ${REQUEST_TIMEOUT_MS}ms: ${err.message}`,
      requestId,
    });
  }

  if (!err.response) {
    return new GamePlanError({
      status: 503,
      code: 'NETWORK_UNREACHABLE',
      source: 'network',
      retryable: true,
      userMessage: USER_MESSAGES.NETWORK_UNREACHABLE,
      debugMessage: `No response received from provider: ${err.code || err.message}`,
      requestId,
    });
  }

  const httpStatus = err.response.status;
  const providerBody = err.response.data as any;
  const providerMsg = providerBody?.error?.message || JSON.stringify(providerBody).slice(0, 500);
  const providerCode = providerBody?.error?.status || '';

  if (httpStatus === 503) {
    return new GamePlanError({
      status: 503, code: 'PROVIDER_OVERLOADED', source: 'provider', retryable: true,
      userMessage: USER_MESSAGES.PROVIDER_OVERLOADED, debugMessage: `Gemini returned 503: ${providerMsg}`, providerStatus: 503, providerCode, providerMessage: providerMsg, requestId,
    });
  }

  if (httpStatus === 429) {
    return new GamePlanError({
      status: 429, code: 'PROVIDER_RATE_LIMIT', source: 'provider', retryable: true,
      userMessage: USER_MESSAGES.PROVIDER_RATE_LIMIT, debugMessage: `Gemini returned 429: ${providerMsg}`, providerStatus: 429, providerCode, providerMessage: providerMsg, requestId,
    });
  }

  if (httpStatus === 401 || httpStatus === 403) {
    return new GamePlanError({
      status: httpStatus, code: 'PROVIDER_AUTH', source: 'provider', retryable: false,
      userMessage: USER_MESSAGES.PROVIDER_AUTH, debugMessage: `Gemini returned ${httpStatus}: ${providerMsg}`, providerStatus: httpStatus, providerCode, providerMessage: providerMsg, requestId,
    });
  }

  if (httpStatus === 400) {
    return new GamePlanError({
      status: 400, code: 'PROVIDER_BAD_REQUEST', source: 'provider', retryable: false,
      userMessage: USER_MESSAGES.PROVIDER_BAD_REQUEST, debugMessage: `Gemini returned 400: ${providerMsg}`, providerStatus: 400, providerCode, providerMessage: providerMsg, requestId,
    });
  }

  return new GamePlanError({
    status: httpStatus, code: 'PROVIDER_UNKNOWN_HTTP', source: 'provider', retryable: false,
    userMessage: USER_MESSAGES.PROVIDER_UNKNOWN_HTTP, debugMessage: `Unexpected HTTP ${httpStatus}: ${providerMsg}`, providerStatus: httpStatus, providerCode, providerMessage: providerMsg, requestId,
  });
}

function getRetryDelay(attempt: number): number {
  const baseDelay = Math.min(1000 * Math.pow(2, attempt), 8000);
  const jitter = Math.floor(Math.random() * 300);
  return baseDelay + jitter;
}

// ── Orchestrator specific stage caller ────────────────────────────────────

async function callGeminiModel(
  requestId: string,
  model: string,
  systemInstruction: string,
  userMessage: string
): Promise<any> {
  const url = `${GEMINI_BASE}/${model}:generateContent`;
  const headers = {
    'x-goog-api-key': GEMINI_API_KEY,
    'Content-Type': 'application/json'
  };
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 400, // Reduced heavily since payloads are now split
    },
  };

  let lastError: GamePlanError | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(url, body, { headers, timeout: REQUEST_TIMEOUT_MS });
      const rawText = extractTextFromGeminiResponse(response.data, requestId);
      const parsed = parseJsonFromText(rawText, requestId);
      console.log(`[GamePlan][${requestId}] Successfully generated stage using ${model} on attempt ${attempt + 1}`);
      return parsed;
    } catch (err: any) {
      if (err instanceof GamePlanError) {
        lastError = err;
      } else if (err.isAxiosError) {
        lastError = classifyAxiosError(err as AxiosError, requestId);
      } else {
        lastError = new GamePlanError({
          status: 500, code: 'INTERNAL_UNKNOWN', source: 'unknown', retryable: false,
          userMessage: USER_MESSAGES.INTERNAL_UNKNOWN, debugMessage: `Unexpected error: ${err.message || String(err)}`, requestId,
        });
      }

      if (!lastError.payload.retryable || attempt === MAX_ATTEMPTS - 1) {
        throw lastError;
      }

      const delay = getRetryDelay(attempt);
      console.log(`[GamePlan][${requestId}][${model}] Attempt ${attempt + 1}/${MAX_ATTEMPTS} failed (${lastError.payload.status || lastError.payload.code}) -> retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError!;
}

// Wraps the multi-model fallback for a single stage
async function executeStageWithFallbacks(
  requestId: string,
  systemInstruction: string,
  userMessage: string
): Promise<any> {
  try {
    return await callGeminiModel(requestId, 'gemini-2.5-flash', systemInstruction, userMessage);
  } catch (err: any) {
    if (err instanceof GamePlanError && !err.payload.retryable && err.payload.code !== 'PARSE_FAILURE') {
      console.log(`[GamePlan][${requestId}] Non-retryable error on flash: ${err.payload.code}`);
    } else {
      console.log(`[GamePlan][${requestId}] All retries failed for gemini-2.5-flash. Switching to fallback model: gemini-2.5-flash-lite`);
    }

    try {
      return await callGeminiModel(requestId, 'gemini-2.5-flash-lite', systemInstruction, userMessage);
    } catch (liteErr: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[GamePlan][${requestId}] DEV MODE: Final provider error in stage ->`, liteErr);
      }
      throw liteErr; // Bubble up so the pipeline controller can apply deterministic local fallbacks
    }
  }
}


// ── Final Assembly & Fallback Strategies ─────────────────────────────────

function assembleFinalGamePlan(draft: GamePlanRequest, stage1: any, stage2: any): any {
  // Extract with robust types
  const dangerList = Array.isArray(stage1.dangerList) ? stage1.dangerList : [];
  const laneApproach = stage1.laneApproach || "Farm safely and adapt to opponent pacing.";
  const midGameFocus = stage1.midGameFocus || "Group for objectives and play around vision.";

  return {
    mission: stage1.mission || `Establish control and execute win conditions as ${draft.playerChampion}.`,
    compIdentity: stage1.compIdentity || "Standard Draft Composition",

    // Assembling Lane Plan deterministically from Stage 1's laneApproach
    lanePlan: {
      levelOneToThree: {
        waveManagement: "Adapt to the matchup dynamics",
        bestPlay: laneApproach,
        why: "Adheres to the primary lane approach strategy.",
        alternative: "Conserve HP and wait for jungle pressure.",
        warnings: dangerList.slice(0, 1) // Distribute warnings cleanly
      },
      levelThreeToSix: {
        waveManagement: "Maintain control and prioritize vision",
        bestPlay: laneApproach,
        why: "Preparation for mid-game transitions.",
        alternative: "Look for quick skirmishes if forced by the enemy.",
        warnings: dangerList.slice(1, 2)
      },
      powerSpikes: [
        { spike: "Level 6 / Core Item Spike", whatToDo: "Look for high-impact plays aligned with win condition", why: "Core champion power spike" }
      ]
    },

    // Sourced entirely from Stage 2 (or its fallback)
    jungleTracking: stage2.jungleTracking || {
      likelyStart: "Unknown", path: "Variable paths", firstGankTiming: "Variable", howToPlay: "Prioritize deep wards"
    },

    // Assembling Mid Game Plan deterministically from Stage 1's midGameFocus
    midGamePlan: {
      bestPlay: midGameFocus,
      why: "This directly serves the team win condition.",
      alternative: "Catch sidelanes safely and push waves.",
      warnings: dangerList
    },

    winCondition: stage1.winCondition || "Play around strongest ally and secure major objectives.",
    priorityTargets: Array.isArray(stage2.priorityTargets) ? stage2.priorityTargets : [],

    // Sourced entirely from Stage 2 (or its fallback)
    build: stage2.build || {
      startItems: [`Standard start for ${draft.playerChampion}`],
      firstRecall: { items: [], minGold: "Variable", timing: "Variable" },
      firstItem: { name: "Standard Core Item", why: "Baseline power", spike: "Medium" },
      coreItems: [],
      situational: []
    },

    warnings: dangerList.length > 0 ? dangerList : ["Ensure solid vision coverage."],
    microTips: Array.isArray(stage2.microTips) ? stage2.microTips : [`Focus on CSing and map awareness specific to ${draft.playerRole}.`],
    extraTips: ["Generated using the Multi-Stage Analytical Pipeline."]
  };
}

function getPartialFallbackForStage2(draft: GamePlanRequest): any {
  return {
    jungleTracking: { likelyStart: "Unknown", path: "Variable paths", firstGankTiming: "Variable", howToPlay: "Prioritize deep wards" },
    priorityTargets: [],
    build: {
      startItems: [`Standard start for ${draft.playerChampion}`],
      firstRecall: { items: [], minGold: "Variable", timing: "Variable" },
      firstItem: { name: "Standard Core Item", why: "Baseline power", spike: "Medium" },
      coreItems: [],
      situational: []
    },
    microTips: [`Focus on CSing and map awareness specific to ${draft.playerRole}.`]
  };
}

function getGracefulFallback(draft: GamePlanRequest, requestId: string): any {
  const champ = draft.playerChampion || 'your champion';
  const role = draft.playerRole || 'your role';

  let mission = `Play a highly disciplined game as ${champ} in the ${role} position.`;
  if (role.toLowerCase() === 'jungle') mission = `Control the map tempo and secure early objectives efficiently as ${champ}.`;
  if (role.toLowerCase() === 'support') mission = `Establish vision control and enable your win conditions as ${champ}.`;

  const fallbackWarn = `Gemini AI Service is currently unavailable (Req: ${requestId}). Displaying semi-intelligent fallback strategy.`;

  const stage1Fallback = {
    mission,
    compIdentity: "Fallback Mode - Standard Draft Protocol",
    laneApproach: "Farm safely and adapt to opponent pacing.",
    midGameFocus: "Group and focus primary objectives.",
    winCondition: "Play around your strongest ally, secure objectives, and scale properly.",
    dangerList: [fallbackWarn]
  };

  const stage2Fallback = getPartialFallbackForStage2(draft);

  // Assemble entirely out of the local pieces natively so it never crashes
  const finalPlan = assembleFinalGamePlan(draft, stage1Fallback, stage2Fallback);
  finalPlan.warnings = [fallbackWarn];
  return finalPlan;
}

// ── Public API ───────────────────────────────────────────────────────────

export async function generateGamePlan(draft: GamePlanRequest, requestId: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new GamePlanError({
      status: 500, code: 'CONFIG_MISSING_API_KEY', source: 'config', retryable: false,
      userMessage: USER_MESSAGES.CONFIG_MISSING_API_KEY, debugMessage: 'GEMINI_API_KEY environment variable is not set.', requestId,
    });
  }

  // STAGE 1: Strategic Core
  let stage1: any;
  try {
    console.log(`[GamePlan][${requestId}] Launching Stage 1: Strategic Core`);
    stage1 = await executeStageWithFallbacks(
      requestId,
      buildStrategicCoreSystemPrompt(),
      buildUserMessage(draft)
    );
  } catch (err: any) {
    console.log(`[GamePlan][${requestId}] Stage 1 failed entirely. Using total graceful fallback pipeline.`);
    return getGracefulFallback(draft, requestId);
  }

  // STAGE 2: Execution Layer (Dependent on Stage 1)
  let stage2: any;
  try {
    console.log(`[GamePlan][${requestId}] Launching Stage 2: Execution Layer`);
    stage2 = await executeStageWithFallbacks(
      requestId,
      buildExecutionLayerSystemPrompt(),
      buildUserMessage(draft, JSON.stringify(stage1)) // Stringifying the core to enforce consistency
    );
  } catch (err: any) {
    console.log(`[GamePlan][${requestId}] Stage 2 failed entirely. Assembling with Stage 1 + partial fallbacks.`);
    stage2 = getPartialFallbackForStage2(draft);
  }

  // STAGE 3: Final deterministic assembly ensuring strict output schema adherence
  console.log(`[GamePlan][${requestId}] Assembling final multidimensional payload`);
  return assembleFinalGamePlan(draft, stage1, stage2);
}
