import OpenAI from 'openai';
import dotenv from 'dotenv';
import {
  GamePlanError,
  USER_MESSAGES,
} from './gamePlanErrors.js';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'gpt-5.4';
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 60_000;

// ── Types ────────────────────────────────────────────────────────────────

export interface GamePlanRequest {
  playerChampion: string;
  playerRole: string;
  playerSummonerSpells?: string[];
  allies: { name: string; role: string }[];
  enemies: { name: string; role: string }[];
  alliedBans: string[];
  enemyBans: string[];
}

// ── JSON Schema for Structured Output ────────────────────────────────────

const GAME_PLAN_SCHEMA = {
  name: 'game_plan',
  type: 'json_schema' as const,
  strict: true,
  schema: {
    type: 'object',
    properties: {
      mission: { type: 'string' },
      compIdentity: { type: 'string' },
      bestPlay: { type: 'string' },
      why: { type: 'string' },
      alternative: { type: 'string' },
      build: {
        type: 'object',
        properties: {
          startItems: { type: 'array', items: { type: 'string' } },
          firstRecall: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'string' } },
              minGold: { type: 'string' },
              timing: { type: 'string' },
            },
            required: ['items', 'minGold', 'timing'],
            additionalProperties: false,
          },
          firstItem: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              why: { type: 'string' },
              spike: { type: 'string' },
            },
            required: ['name', 'why', 'spike'],
            additionalProperties: false,
          },
          coreItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                why: { type: 'string' },
                spike: { type: 'string' },
              },
              required: ['name', 'why', 'spike'],
              additionalProperties: false,
            },
          },
          situational: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                why: { type: 'string' },
              },
              required: ['name', 'why'],
              additionalProperties: false,
            },
          },
        },
        required: ['startItems', 'firstRecall', 'firstItem', 'coreItems', 'situational'],
        additionalProperties: false,
      },
      warnings: { type: 'array', items: { type: 'string' } },
      microTips: { type: 'array', items: { type: 'string' } },
      extraTips: { type: 'array', items: { type: 'string' } },
      winCondition: { type: 'string' },
      lanePlan: {
        type: 'object',
        properties: {
          levelOneToThree: {
            type: 'object',
            properties: {
              waveManagement: { type: 'string' },
              bestPlay: { type: 'string' },
              why: { type: 'string' },
              alternative: { type: 'string' },
              warnings: { type: 'array', items: { type: 'string' } },
            },
            required: ['waveManagement', 'bestPlay', 'why', 'alternative', 'warnings'],
            additionalProperties: false,
          },
          levelThreeToFive: {
            type: 'object',
            properties: {
              waveManagement: { type: 'string' },
              bestPlay: { type: 'string' },
              why: { type: 'string' },
              alternative: { type: 'string' },
              warnings: { type: 'array', items: { type: 'string' } },
            },
            required: ['waveManagement', 'bestPlay', 'why', 'alternative', 'warnings'],
            additionalProperties: false,
          },
          powerSpikes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                spike: { type: 'string' },
                whatToDo: { type: 'string' },
                why: { type: 'string' },
              },
              required: ['spike', 'whatToDo', 'why'],
              additionalProperties: false,
            },
          },
        },
        required: ['levelOneToThree', 'levelThreeToFive', 'powerSpikes'],
        additionalProperties: false,
      },
      midGamePlan: {
        type: 'object',
        properties: {
          bestPlay: { type: 'string' },
          why: { type: 'string' },
          alternative: { type: 'string' },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        required: ['bestPlay', 'why', 'alternative', 'warnings'],
        additionalProperties: false,
      },
      priorityTargets: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            target: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['target', 'reason'],
          additionalProperties: false,
        },
      },
    },
    required: [
      'mission', 'compIdentity', 'bestPlay', 'why', 'alternative',
      'build', 'warnings', 'microTips', 'extraTips', 'winCondition',
      'lanePlan', 'midGamePlan', 'priorityTargets',
    ],
    additionalProperties: false,
  },
};

// ── Prompt construction ──────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are an elite League of Legends coach with the combined knowledge of Challenger players, pro coaches, and analysts.

You are a real-time in-game coach. Your job: produce one complete, specific, actionable pre-game strategic brief for the player's exact draft.

Rules:
- Be concise. Short keywords or 1 sentence per field. No fluff.
- Every piece of advice MUST be specific to this exact draft. No generic advice.
- Prioritize the highest win-probability play. Always commit to a decision.
- No hesitation, no uncertainty.

You must account for:
1. Champion identities and win conditions
2. Lane state and matchup dynamics
3. Gold/item power spikes
4. Summoner spell advantages
5. Vision and map pressure
6. Jungle tracking and pathing
7. Objective control timers
8. Team comp win conditions
9. Risk vs reward assessment`;

function buildUserMessage(draft: GamePlanRequest): string {
  return `DRAFT:
Champion: ${draft.playerChampion} (${draft.playerRole})
Summoners: ${draft.playerSummonerSpells?.join(', ') || 'Unknown'}

Allies:
${draft.allies.map(a => `- ${a.name} (${a.role})`).join('\n')}

Enemies:
${draft.enemies.map(e => `- ${e.name} (${e.role})`).join('\n')}

Allied bans: ${draft.alliedBans.join(', ') || 'None'}
Enemy bans: ${draft.enemyBans.join(', ') || 'None'}`;
}

// ── Retry helpers ────────────────────────────────────────────────────────

function getRetryDelay(attempt: number): number {
  const baseDelay = Math.min(1000 * Math.pow(2, attempt), 8000);
  const jitter = Math.floor(Math.random() * 300);
  return baseDelay + jitter;
}

function isRetryableError(err: any): boolean {
  // OpenAI SDK errors expose a `status` property
  const status = err?.status ?? err?.response?.status;
  if (status === 429 || status === 503) return true;
  // Timeout / network errors
  if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT') return true;
  if (err?.message?.includes('timeout')) return true;
  if (err?.message?.includes('ECONNREFUSED')) return true;
  return false;
}

function classifyError(err: any, requestId: string): GamePlanError {
  const status = err?.status ?? err?.response?.status;

  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return new GamePlanError({
      status: 504, code: 'NETWORK_TIMEOUT', source: 'network', retryable: true,
      userMessage: USER_MESSAGES.NETWORK_TIMEOUT,
      debugMessage: `Timeout: ${err.message}`, requestId,
    });
  }

  if (!status && (err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT')) {
    return new GamePlanError({
      status: 503, code: 'NETWORK_UNREACHABLE', source: 'network', retryable: true,
      userMessage: USER_MESSAGES.NETWORK_UNREACHABLE,
      debugMessage: `Network error: ${err.code || err.message}`, requestId,
    });
  }

  if (status === 503) {
    return new GamePlanError({
      status: 503, code: 'PROVIDER_OVERLOADED', source: 'provider', retryable: true,
      userMessage: USER_MESSAGES.PROVIDER_OVERLOADED,
      debugMessage: `OpenAI returned 503: ${err.message}`, requestId,
    });
  }

  if (status === 429) {
    return new GamePlanError({
      status: 429, code: 'PROVIDER_RATE_LIMIT', source: 'provider', retryable: true,
      userMessage: USER_MESSAGES.PROVIDER_RATE_LIMIT,
      debugMessage: `OpenAI returned 429: ${err.message}`, requestId,
    });
  }

  if (status === 401 || status === 403) {
    return new GamePlanError({
      status: status, code: 'PROVIDER_AUTH', source: 'provider', retryable: false,
      userMessage: USER_MESSAGES.PROVIDER_AUTH,
      debugMessage: `OpenAI returned ${status}: ${err.message}`, requestId,
    });
  }

  if (status === 400) {
    return new GamePlanError({
      status: 400, code: 'PROVIDER_BAD_REQUEST', source: 'provider', retryable: false,
      userMessage: USER_MESSAGES.PROVIDER_BAD_REQUEST,
      debugMessage: `OpenAI returned 400: ${err.message}`, requestId,
    });
  }

  return new GamePlanError({
    status: status || 500, code: 'INTERNAL_UNKNOWN', source: 'unknown', retryable: false,
    userMessage: USER_MESSAGES.INTERNAL_UNKNOWN,
    debugMessage: `Unexpected error: ${err.message || String(err)}`, requestId,
  });
}

// ── OpenAI call with retry ───────────────────────────────────────────────

async function callOpenAI(draft: GamePlanRequest, requestId: string): Promise<any> {
  const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
    timeout: REQUEST_TIMEOUT_MS,
  });

  let lastError: GamePlanError | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[GamePlan][${requestId}] Attempt ${attempt + 1}/${MAX_ATTEMPTS} using ${MODEL}`);

      const response = await client.responses.create({
        model: MODEL,
        instructions: SYSTEM_INSTRUCTION,
        input: buildUserMessage(draft),
        text: {
          format: GAME_PLAN_SCHEMA,
        },
      });

      // Extract the output text from the response
      const outputText = response.output_text;

      if (!outputText || outputText.trim().length === 0) {
        throw new GamePlanError({
          status: 502, code: 'INVALID_PROVIDER_RESPONSE', source: 'provider', retryable: true,
          userMessage: USER_MESSAGES.INVALID_PROVIDER_RESPONSE,
          debugMessage: 'OpenAI returned empty output_text.', requestId,
        });
      }

      const parsed = JSON.parse(outputText);
      console.log(`[GamePlan][${requestId}] Successfully generated on attempt ${attempt + 1}`);
      return parsed;

    } catch (err: any) {
      if (err instanceof GamePlanError) {
        lastError = err;
      } else {
        lastError = classifyError(err, requestId);
      }

      if (!isRetryableError(err) && !(err instanceof GamePlanError && err.payload.retryable)) {
        console.log(`[GamePlan][${requestId}] Non-retryable error: ${lastError.payload.code}`);
        break;
      }

      if (attempt === MAX_ATTEMPTS - 1) {
        console.log(`[GamePlan][${requestId}] All ${MAX_ATTEMPTS} attempts exhausted`);
        break;
      }

      const delay = getRetryDelay(attempt);
      console.log(`[GamePlan][${requestId}] Attempt ${attempt + 1}/${MAX_ATTEMPTS} failed (${lastError.payload.code}) -> retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError!;
}

// ── Graceful fallback ────────────────────────────────────────────────────

function getGracefulFallback(draft: GamePlanRequest, requestId: string): any {
  const champ = draft.playerChampion || 'your champion';
  const role = draft.playerRole || 'your role';

  let mission = `Play a disciplined game as ${champ} (${role}).`;
  if (role.toLowerCase() === 'jungle') mission = `Control tempo and secure early objectives as ${champ}.`;
  if (role.toLowerCase() === 'support') mission = `Establish vision control and enable win conditions as ${champ}.`;

  const warn = `AI Service unavailable (Req: ${requestId}). Showing fallback strategy.`;

  return {
    mission,
    compIdentity: 'Fallback Mode — AI unavailable',
    bestPlay: 'Farm safely and adapt to opponent pacing.',
    why: 'AI coaching service is temporarily unavailable.',
    alternative: 'Wait for jungle pressure or play for scaling.',
    build: {
      startItems: [`Standard start for ${champ}`],
      firstRecall: { items: [], minGold: 'Variable', timing: 'Variable' },
      firstItem: { name: 'Standard Core', why: 'Baseline power', spike: 'Medium' },
      coreItems: [],
      situational: [],
    },
    warnings: [warn],
    microTips: [`Focus on CSing and map awareness for ${role}.`],
    extraTips: ['Retry generating your game plan in the next lobby.'],
    winCondition: 'Play around your strongest ally and secure objectives.',
    lanePlan: {
      levelOneToThree: { waveManagement: 'Play defensively', bestPlay: 'Farm safely', why: 'No matchup intel available.', alternative: 'Wait for gank', warnings: [warn] },
      levelThreeToFive: { waveManagement: 'Maintain vision', bestPlay: 'Scale or follow jungle plays', why: 'No detailed intel.', alternative: 'Look for skirmishes if forced', warnings: [] },
      powerSpikes: [{ spike: 'Core item completion', whatToDo: 'Group for objectives', why: 'Standard scaling.' }],
    },
    midGamePlan: { bestPlay: 'Group and focus objectives', why: 'Standard mid-game.', alternative: 'Catch sidelanes safely', warnings: [warn] },
    priorityTargets: [],
  };
}

// ── Public API ───────────────────────────────────────────────────────────

export async function generateGamePlan(draft: GamePlanRequest, requestId: string): Promise<any> {
  if (!OPENAI_API_KEY) {
    throw new GamePlanError({
      status: 500, code: 'CONFIG_MISSING_API_KEY', source: 'config', retryable: false,
      userMessage: USER_MESSAGES.CONFIG_MISSING_API_KEY,
      debugMessage: 'OPENAI_API_KEY environment variable is not set.', requestId,
    });
  }

  try {
    return await callOpenAI(draft, requestId);
  } catch (err: any) {
    console.log(`[GamePlan][${requestId}] All attempts failed -> using local fallback`);
    if (process.env.NODE_ENV === 'development') {
      console.error(`[GamePlan][${requestId}] DEV: Final error ->`, err);
    }
    return getGracefulFallback(draft, requestId);
  }
}
