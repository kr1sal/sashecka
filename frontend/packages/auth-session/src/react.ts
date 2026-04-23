import { useSyncExternalStore } from "react";

import {
  getAuthSession,
  subscribeToAuthSession,
  type AuthSessionState,
} from "./index";

export function useAuthSession(): AuthSessionState {
  return useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSession,
    getAuthSession,
  );
}
