import { clearAuthSession, getAuthSession } from "@sashecka/auth-session";

export const API_ERROR_EVENT = "sashecka:api-error";

export type ApiErrorNotification = {
  id: string;
  title: string;
  message: string;
  status: number;
  path: string;
};

export class ApiRequestError extends Error {
  status: number;
  path: string;
  payload: unknown;

  constructor(message: string, status: number, path: string, payload: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.path = path;
    this.payload = payload;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

export type User = {
  id: number;
  email: string;
  username: string;
  full_name?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type UserUpdatePayload = {
  email: string;
  username: string;
  full_name?: string | null;
};

export type UserGroupAccess = {
  id: number;
  user_id: number | null;
  group_id: number;
  is_active: boolean;
  grants: string[];
  created_at: string;
  updated_at: string | null;
};

export type Group = {
  id: number;
  owner_id?: number;
  name: string;
  description?: string | null;
  accesses: UserGroupAccess[];
  created_at: string;
  updated_at: string | null;
};

export type GroupUpdatePayload = {
  name: string;
  description?: string | null;
  accesses: Array<{
    user_id: number | null;
    group_id?: number;
    grants: string[];
  }>;
};

type ApiClientConfig = {
  baseUrl: string;
};

type RequestOptions = {
  includeAuth?: boolean;
  notifyOnError?: boolean;
};

const apiConfig: ApiClientConfig = {
  baseUrl: "/api/v1",
};

let lastUnauthorizedNotificationAt = 0;

function toQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function resolveUrl(path: string): string {
  const normalizedBase = apiConfig.baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function buildValidationMessage(detail: unknown[]): string {
  return detail
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "Некорректные данные запроса";
      }

      const loc = Array.isArray((item as { loc?: unknown }).loc)
        ? (item as { loc: Array<string | number> }).loc.join(".")
        : "field";
      const message =
        typeof (item as { msg?: unknown }).msg === "string"
          ? (item as { msg: string }).msg
          : "Некорректное значение";

      return `${loc}: ${message}`;
    })
    .join("; ");
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    Array.isArray(payload.detail)
  ) {
    return buildValidationMessage(payload.detail);
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  return `Request failed with status ${status}`;
}

function getErrorTitle(status: number): string {
  switch (status) {
    case 401:
      return "Ошибка авторизации";
    case 403:
      return "Недостаточно прав";
    case 404:
      return "Ресурс не найден";
    case 409:
      return "Конфликт данных";
    case 422:
      return "Ошибка валидации";
    default:
      return "Ошибка запроса";
  }
}

function emitApiError(detail: Omit<ApiErrorNotification, "id">): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ApiErrorNotification>(API_ERROR_EVENT, {
      detail: {
        ...detail,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
    }),
  );
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  return await response.text();
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const includeAuth = options.includeAuth ?? true;
  const notifyOnError = options.notifyOnError ?? true;
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (includeAuth) {
    const { token } = getAuthSession();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(resolveUrl(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const message = extractErrorMessage(payload, response.status);

    if (response.status === 401 && includeAuth) {
      clearAuthSession();
    }

    const shouldNotifyUnauthorized =
      response.status !== 401 ||
      Date.now() - lastUnauthorizedNotificationAt > 1500;

    if (notifyOnError && shouldNotifyUnauthorized) {
      if (response.status === 401) {
        lastUnauthorizedNotificationAt = Date.now();
      }

      emitApiError({
        title: getErrorTitle(response.status),
        message,
        status: response.status,
        path,
      });
    }

    throw new ApiRequestError(message, response.status, path, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function configureApiClient(config: Partial<ApiClientConfig>): void {
  if (config.baseUrl) {
    apiConfig.baseUrl = config.baseUrl;
  }
}

export function registerUser(payload: {
  email: string;
  username: string;
  full_name?: string | null;
  password: string;
}): Promise<User> {
  return request<User>(
    "/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    { includeAuth: false, notifyOnError: false },
  );
}

// Username is email or username
export function loginUser(payload: { username: string; password: string }): Promise<AuthResponse> {
  const body = new URLSearchParams();
  body.set("username", payload.username.trim());
  body.set("password", payload.password.trim());

  return request<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    },
    { includeAuth: false, notifyOnError: false },
  );
}

export function getCurrentUser(): Promise<User> {
  return request<User>("/users/current");
}

export function updateCurrentUser(payload: UserUpdatePayload): Promise<User> {
  return request<User>("/users/current", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function deleteCurrentUser(): Promise<void> {
  return request<void>("/users/current", {
    method: "DELETE",
  });
}

export function listUsers(query?: string): Promise<User[]> {
  return request<User[]>(`/users${toQueryString({ q: query })}`);
}

export function getUser(userId: number): Promise<User> {
  return request<User>(`/users/${userId}`);
}

export function listGroups(query?: string): Promise<Group[]> {
  return request<Group[]>(`/groups${toQueryString({ q: query })}`);
}

export function getGroup(groupId: number): Promise<Group> {
  return request<Group>(`/groups/${groupId}`);
}

export function updateGroup(groupId: number, payload: GroupUpdatePayload): Promise<Group> {
  return request<Group>(`/groups/${groupId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function deleteGroup(groupId: number): Promise<void> {
  return request<void>(`/groups/${groupId}`, {
    method: "DELETE",
  });
}
