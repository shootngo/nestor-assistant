import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import {
  isHouseholdEmail,
} from './config';
import { NOT_SIGNED_IN_REPLY, WRONG_EMAIL_REPLY } from './copy';
import { getHouseholdAuth } from './firebase';
import { actorFrom } from './ids';
import { runtimeTabletCredentials } from './runtime';
import type { Actor } from './types';

export type AuthStatus =
  | { state: 'signed_in'; actor: Actor }
  | { state: 'missing_credentials' }
  | { state: 'wrong_email' }
  | { state: 'failed'; message: string };

let cached: AuthStatus | null = null;
let inFlight: Promise<AuthStatus> | null = null;

function waitForUser(): Promise<User | null> {
  const auth = getHouseholdAuth();
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

function asSignedIn(user: User): AuthStatus | null {
  const actor = actorFrom(user);
  if (!actor) {
    return null;
  }
  if (!isHouseholdEmail(actor.email)) {
    return { state: 'wrong_email' };
  }
  return { state: 'signed_in', actor };
}

async function signInOnce(): Promise<AuthStatus> {
  try {
    const restored = await waitForUser();
    if (restored) {
      const status = asSignedIn(restored);
      if (status?.state === 'signed_in') {
        return status;
      }
      await signOut(getHouseholdAuth());
      if (status?.state === 'wrong_email') {
        return status;
      }
    }

    const { email, password } = runtimeTabletCredentials();
    if (!email || !password) {
      return { state: 'missing_credentials' };
    }
    if (!isHouseholdEmail(email)) {
      return { state: 'wrong_email' };
    }

    const cred = await signInWithEmailAndPassword(getHouseholdAuth(), email, password);
    const status = asSignedIn(cred.user);
    if (status?.state === 'signed_in') {
      return status;
    }
    await signOut(getHouseholdAuth());
    return { state: 'wrong_email' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'sign-in failed';
    return { state: 'failed', message };
  }
}

export async function ensureTabletAuth(): Promise<AuthStatus> {
  if (cached?.state === 'signed_in' || cached?.state === 'missing_credentials' || cached?.state === 'wrong_email') {
    return cached;
  }
  if (!inFlight) {
    inFlight = signInOnce()
      .then((status) => {
        cached = status;
        return status;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function getCachedActor(): Actor | null {
  return cached?.state === 'signed_in' ? cached.actor : null;
}

export function authSpokenError(status: AuthStatus): string {
  if (status.state === 'wrong_email') {
    return WRONG_EMAIL_REPLY;
  }
  return NOT_SIGNED_IN_REPLY;
}

export function resetAuthCache(): void {
  cached = null;
  inFlight = null;
}
