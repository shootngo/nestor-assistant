export type ListenMode = 'listening' | 'thinking' | 'talking';

export type ConversationTurn = {
  role: 'user' | 'model';
  text: string;
};
