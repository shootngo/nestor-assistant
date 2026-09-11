import Constants from 'expo-constants';
import { chicagoLongDate } from '../household/dates';
import { executeHouseholdTool, HOUSEHOLD_FUNCTION_DECLARATIONS } from '../household/tools';
import { FETCH_TIMEOUT_MS, HOUSEHOLD_TIMEZONE } from '../config';
import { extraGeminiApiKey, resolveKitchenBrainKey } from './apiKey';
import {
  BUSY_REPLY,
  EMPTY_REPLY,
  NETWORK_REPLY,
  NO_KEY_REPLY,
  TIMEOUT_REPLY,
} from './copy';
import { NESTOR_SYSTEM_PROMPT } from './prompt';
import type { ConversationTurn, GeminiContent, GeminiPart } from './types';
import { collectFunctionCalls, contentsFromTurns, functionResponseContent } from './geminiParts';

export const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'] as const;

export const GEMINI_TIMEOUT_MS = 40_000;

export const GEMINI_MAX_OUTPUT_TOKENS = 512;

export const GEMINI_MAX_TOOL_ROUNDS = 4;

const GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export function getGeminiApiKey(): string {
  const extra = extraGeminiApiKey(Constants.expoConfig?.extra);
  return resolveKitchenBrainKey(process.env, extra);
}

type GeminiCandidate = {
  content?: { parts?: GeminiPart[]; role?: string };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string; status?: string };
};

type GenerateResult =
  | { ok: true; text: string; parts: GeminiPart[] }
  | { ok: false; status: number; reason: string };

export { collectFunctionCalls, contentsFromTurns, functionResponseContent } from './geminiParts';

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

function extractText(parts: GeminiPart[]): string {
  return screenText(parts.map((part) => part.text ?? '').join('\n'));
}

function systemPrompt(): string {
  return `${NESTOR_SYSTEM_PROMPT}

Today in Southaven is ${chicagoLongDate()} (${HOUSEHOLD_TIMEZONE}). Calendar tool dates must be YYYY-MM-DD.`;
}

function buildTools(includeSearch: boolean): object[] {
  const tools: object[] = [{ functionDeclarations: HOUSEHOLD_FUNCTION_DECLARATIONS }];
  if (includeSearch) {
    tools.push({ google_search: {} });
  }
  return tools;
}

function isRetryableStatus(status: number): boolean {
  return status === 404 || status === 429 || status >= 500;
}

function toolsIncompatible(status: number, reason: string): boolean {
  if (status !== 400) {
    return false;
  }
  return /tool|function|search|incompatible|cannot be used/i.test(reason);
}

async function generateOnce(
  model: string,
  key: string,
  contents: GeminiContent[],
  includeSearch: boolean,
  signal: AbortSignal,
): Promise<GenerateResult> {
  const response = await fetch(`${GENERATE_URL}/${model}:generateContent`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt() }] },
      contents,
      tools: buildTools(includeSearch),
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      generationConfig: {
        temperature: 0.45,
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
      reason: payload.error?.message ?? payload.error?.status ?? `HTTP ${response.status}`,
    };
  }

  const finish = payload.candidates?.[0]?.finishReason ?? '';
  if (finish === 'SAFETY' || finish === 'BLOCKLIST' || finish === 'PROHIBITED_CONTENT') {
    return { ok: true, text: BUSY_REPLY, parts: [{ text: BUSY_REPLY }] };
  }

  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return { ok: true, text: extractText(parts), parts };
}

async function generateWithToolFallback(
  model: string,
  key: string,
  contents: GeminiContent[],
  signal: AbortSignal,
): Promise<GenerateResult> {
  const first = await generateOnce(model, key, contents, true, signal);
  if (first.ok || !toolsIncompatible(first.status, first.reason)) {
    return first;
  }
  return generateOnce(model, key, contents, false, signal);
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
  const contents = contentsFromTurns(turns);

  try {
    let lastError = NETWORK_REPLY;
    for (const model of GEMINI_MODELS) {
      try {
        for (let round = 0; round < GEMINI_MAX_TOOL_ROUNDS; round += 1) {
          const result = await generateWithToolFallback(model, key, contents, controller.signal);
          if (!result.ok) {
            lastError = result.status === 403 || result.status === 401 ? NO_KEY_REPLY : NETWORK_REPLY;
            if (!isRetryableStatus(result.status)) {
              return lastError;
            }
            break;
          }

          const calls = collectFunctionCalls(result.parts);
          if (calls.length === 0) {
            return result.text || EMPTY_REPLY;
          }

          contents.push({ role: 'model', parts: result.parts });
          const results = [];
          for (const call of calls) {
            const executed = await executeHouseholdTool(call.name, call.args);
            results.push(executed);
          }
          contents.push(functionResponseContent(calls, results));
        }
        return EMPTY_REPLY;
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
