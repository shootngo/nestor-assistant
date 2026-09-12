export type ListenMode = 'listening' | 'thinking' | 'talking';

export type ConversationTurn = {
  role: 'user' | 'model';
  text: string;
};

export type GeminiPart = {
  text?: string;
  thoughtSignature?: string;
  functionCall?: {
    name?: string;
    args?: Record<string, unknown>;
    id?: string;
  };
  functionResponse?: {
    name?: string;
    response?: Record<string, unknown>;
    id?: string;
  };
};

export type GeminiContent = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

export type FunctionCall = {
  name: string;
  args: Record<string, unknown>;
  id?: string;
};
