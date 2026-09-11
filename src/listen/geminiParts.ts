import type { ConversationTurn, FunctionCall, GeminiContent, GeminiPart } from './types';

export function contentsFromTurns(turns: ConversationTurn[]): GeminiContent[] {
  return turns.map((turn) => ({
    role: turn.role === 'model' ? 'model' : 'user',
    parts: [{ text: turn.text }],
  }));
}

export function collectFunctionCalls(parts: GeminiPart[]): FunctionCall[] {
  const calls: FunctionCall[] = [];
  for (const part of parts) {
    const call = part.functionCall;
    if (!call?.name) {
      continue;
    }
    const args =
      call.args && typeof call.args === 'object' && !Array.isArray(call.args) ? call.args : {};
    calls.push({
      name: call.name,
      args,
      id: call.id,
    });
  }
  return calls;
}

export function functionResponseContent(
  calls: FunctionCall[],
  results: Record<string, unknown>[],
): GeminiContent {
  return {
    role: 'user',
    parts: calls.map((call, index) => ({
      functionResponse: {
        name: call.name,
        response: { result: results[index] ?? { ok: false } },
        ...(call.id ? { id: call.id } : {}),
      },
    })),
  };
}
