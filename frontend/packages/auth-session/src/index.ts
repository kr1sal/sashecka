export type AuthUser = {
  id: number;
  email: string;
  username: string;
  full_name?: string | null;
};

export type AuthSessionState = {
  token: string | null;
  user: AuthUser | null;
};

const STORAGE_KEY = "sashecka.auth.session";
const EVENT_NAME = "sashecka:auth-updated";
const listeners = new Set<() => void>();

const isBrowser = typeof window !== "undefined";

function readStorage(): AuthSessionState {
  if (!isBrowser) {
    return { token: null, user: null };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { token: null, user: null };
  }

  try {
    return JSON.parse(raw) as AuthSessionState;
  } catch {
    return { token: null, user: null };
  }
}

let currentState: AuthSessionState = readStorage();

function persist(state: AuthSessionState): void {
  currentState = state;
  if (isBrowser) {
    if (state.token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
  }

  listeners.forEach((listener) => listener());
}

function syncFromStorage(): void {
  currentState = readStorage();
  listeners.forEach((listener) => listener());
}

if (isBrowser) {
  window.addEventListener(EVENT_NAME, syncFromStorage);
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      syncFromStorage();
    }
  });
}

export function getAuthSession(): AuthSessionState {
  return currentState;
}

export function subscribeToAuthSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function saveAuthSession(state: AuthSessionState): void {
  persist(state);
}

export function updateAuthUser(user: AuthUser | null): void {
  persist({ ...currentState, user });
}

export function clearAuthSession(): void {
  persist({ token: null, user: null });
}
