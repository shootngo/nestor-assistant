import type { Actor } from './types';

export function nowIso(now = new Date()): string {
  return now.toISOString();
}

export function uid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function actorFrom(user: { uid?: string; email?: string | null; displayName?: string | null } | null): Actor | null {
  if (!user?.uid) {
    return null;
  }
  const email = String(user.email ?? '').trim();
  return {
    uid: user.uid,
    email,
    displayName: String(user.displayName ?? '').trim() || email.split('@')[0] || 'Nestor',
  };
}

export function stampNew(actor: Actor, at = nowIso()): {
  createdBy: Actor;
  createdAt: string;
  updatedBy: Actor;
  updatedAt: string;
} {
  return {
    createdBy: actor,
    createdAt: at,
    updatedBy: actor,
    updatedAt: at,
  };
}
