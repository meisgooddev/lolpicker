// ── Strict Error Model for the GamePlan generation pipeline ────────────────

export type GamePlanErrorSource =
  | 'config'
  | 'validation'
  | 'network'
  | 'provider'
  | 'parser'
  | 'backend'
  | 'unknown';

export type GamePlanErrorCode =
  | 'CONFIG_MISSING_API_KEY'
  | 'VALIDATION_MISSING_FIELDS'
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_UNREACHABLE'
  | 'PROVIDER_OVERLOADED'
  | 'PROVIDER_RATE_LIMIT'
  | 'PROVIDER_AUTH'
  | 'PROVIDER_BAD_REQUEST'
  | 'PROVIDER_UNKNOWN_HTTP'
  | 'INVALID_PROVIDER_RESPONSE'
  | 'PARSE_FAILURE'
  | 'INTERNAL_UNKNOWN';

export interface GamePlanErrorPayload {
  status: number;
  code: GamePlanErrorCode;
  source: GamePlanErrorSource;
  retryable: boolean;
  userMessage: string;
  debugMessage: string;
  providerStatus?: number;
  providerCode?: string;
  providerMessage?: string;
  requestId: string;
  details?: unknown;
}

/**
 * Custom error class that carries the full structured payload.
 * Thrown by gamePlanService, caught and serialized by server.ts.
 */
export class GamePlanError extends Error {
  public readonly payload: GamePlanErrorPayload;

  constructor(payload: GamePlanErrorPayload) {
    super(payload.debugMessage);
    this.name = 'GamePlanError';
    this.payload = payload;
    Object.setPrototypeOf(this, GamePlanError.prototype);
  }
}

// ── User-facing message map ──────────────────────────────────────────────

export const USER_MESSAGES: Record<GamePlanErrorCode, string> = {
  CONFIG_MISSING_API_KEY:
    'The server is missing the Gemini API key configuration.',
  VALIDATION_MISSING_FIELDS:
    'The request sent by the app was incomplete or invalid.',
  NETWORK_TIMEOUT:
    'The request to the AI service took too long and timed out.',
  NETWORK_UNREACHABLE:
    'The AI service could not be reached. Check network connectivity.',
  PROVIDER_OVERLOADED:
    'The model is temporarily overloaded due to high demand. Try again in a few moments.',
  PROVIDER_RATE_LIMIT:
    'The API quota or rate limit has been reached. Please wait and try again later.',
  PROVIDER_AUTH:
    'The AI service rejected the request due to authentication or permission settings.',
  PROVIDER_BAD_REQUEST:
    'The AI service rejected the request payload as invalid.',
  PROVIDER_UNKNOWN_HTTP:
    'The AI service returned an unexpected error.',
  INVALID_PROVIDER_RESPONSE:
    'The AI service returned an unexpected response format.',
  PARSE_FAILURE:
    'The model responded, but the response was not valid JSON.',
  INTERNAL_UNKNOWN:
    'An unexpected internal error occurred while generating the strategic brief.',
};

// ── Helper to generate a short random request id ─────────────────────────

export function generateRequestId(): string {
  return `gp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
