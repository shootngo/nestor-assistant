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

/**
 * PWA `actor()` / `actorFrom(user)`. Identity is the signed-in household email.
 * `createdBy` / `updatedBy` store this object (uid, email, displayName).
 */
export function actorFrom(user: { uid?: string; email?: string | null; displayName?: string | null } | null): Actor | null {
  const email = String(user?.email ?? '').trim();
  if (!user?.uid || !email) {
    return null;
  }
  return {
    uid: user.uid,
    email,
    displayName: String(user.displayName ?? '').trim() || email.split('@')[0] || 'Someone',
  };
}

export function actorEmail(actor: Actor): string {
  return actor.email.trim().toLowerCase();
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
