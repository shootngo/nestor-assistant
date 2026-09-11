import Constants from 'expo-constants';
import { FETCH_TIMEOUT_MS } from '../config';
import { extraGeminiApiKey, resolveKitchenBrainKey } from './apiKey';
import {
  BUSY_REPLY,
  EMPTY_REPLY,
  NETWORK_REPLY,
  NO_KEY_REPLY,
  TIMEOUT_REPLY,
} from './copy';
import { NESTOR_SYSTEM_PROMPT } from './prompt';
import type { ConversationTurn } from './types';

export const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'] as const;

export const GEMINI_TIMEOUT_MS = 25_000;

export const GEMINI_MAX_OUTPUT_TOKENS = 280;

const GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export function getGeminiApiKey(): string {
  const extra = extraGeminiApiKey(Constants.expoConfig?.extra);
  return resolveKitchenBrainKey(process.env, extra);
}

type GeminiPart = { text?: string };

type GeminiCandidate = {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string; status?: string };
};

export function screenText(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#>`]/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractText(payload: GeminiResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return screenText(parts.map((part) => part.text ?? '').join('\n'));
}

function isRetryableStatus(status: number): boolean {
  return status === 404 || status === 429 || status >= 500;
}

async function generateOnce(
  model: string,
  key: string,
  turns: ConversationTurn[],
  signal: AbortSignal,
): Promise<{ ok: true; text: string } | { ok: false; status: number; reason: string }> {
  const contents = turns.map((turn) => ({
    role: turn.role === 'model' ? 'model' : 'user',
    parts: [{ text: turn.text }],
  }));

  const response = await fetch(`${GENERATE_URL}/${model}:generateContent`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: NESTOR_SYSTEM_PROMPT }] },
      contents,
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.55,
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      },
    }),
  });

  let payload: GeminiResponse = {};
  try {
    payload = (await response.json()) as GeminiResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      reason: payload.error?.status ?? `HTTP ${response.status}`,
    };
  }

  const finish = payload.candidates?.[0]?.finishReason ?? '';
  if (finish === 'SAFETY' || finish === 'BLOCKLIST' || finish === 'PROHIBITED_CONTENT') {
    return { ok: true, text: BUSY_REPLY };
  }

  const text = extractText(payload);
  if (!text) {
    return { ok: true, text: EMPTY_REPLY };
  }
  return { ok: true, text };
}

export async function askNestor(
  turns: ConversationTurn[],
  timeoutMs = GEMINI_TIMEOUT_MS,
): Promise<string> {
  const key = getGeminiApiKey();
  if (!key) {
    return NO_KEY_REPLY;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(timeoutMs, FETCH_TIMEOUT_MS));

  try {
    let lastError = NETWORK_REPLY;
    for (const model of GEMINI_MODELS) {
      try {
        const result = await generateOnce(model, key, turns, controller.signal);
        if (result.ok) {
          return result.text;
        }
        lastError = result.status === 403 || result.status === 401 ? NO_KEY_REPLY : NETWORK_REPLY;
        if (!isRetryableStatus(result.status)) {
          return lastError;
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return TIMEOUT_REPLY;
        }
        lastError = error instanceof Error && /abort/i.test(error.message) ? TIMEOUT_REPLY : NETWORK_REPLY;
      }
    }
    return lastError;
  } finally {
    clearTimeout(timer);
  }
}
