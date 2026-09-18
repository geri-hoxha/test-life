/** HTTP client for ESIG Life API. Bearer token is restored from localStorage. */

import {
  clearAuthSession,
  isAuthExpired,
  LOGIN_PATH,
  persistAuthSession,
  readAuthSession,
  type AuthSession,
} from "@/lib/auth";

export type { Ulid } from "./types";

const REMOTE_BASE_URL = "https://esiglife-api-dev.silvernet.al";

/** In Vite dev, call same-origin `/api` so the proxy handles CORS. */
const DEFAULT_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? "" : REMOTE_BASE_URL);

let baseUrl = DEFAULT_BASE_URL.replace(/\/$/, "");
let accessToken: string | null = null;

const hydrateAccessToken = () => {
  const session = readAuthSession();
  if (!session || isAuthExpired(session.expiresOnUtc)) {
    if (session) clearAuthSession();
    accessToken = null;
    return;
  }
  accessToken = session.accessToken;
};

hydrateAccessToken();

export const setApiBaseUrl = (url: string) => {
  baseUrl = url.replace(/\/$/, "");
};

export const getApiBaseUrl = () => baseUrl || REMOTE_BASE_URL;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const applyAuthSession = (session: AuthSession) => {
  persistAuthSession(session);
  accessToken = session.accessToken;
};

export const clearSession = () => {
  clearAuthSession();
  accessToken = null;
};

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname === LOGIN_PATH) return;
  window.location.assign(LOGIN_PATH);
};

type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
};

const parseProblemDetails = (body: unknown): ProblemDetails => {
  if (typeof body === "string" && body.trim()) {
    return { detail: body.trim() };
  }
  if (!body || typeof body !== "object") return {};
  const o = body as Record<string, unknown>;
  return {
    title: typeof o.title === "string" ? o.title : undefined,
    detail:
      typeof o.detail === "string"
        ? o.detail
        : typeof o.message === "string"
          ? o.message
          : undefined,
    status: typeof o.status === "number" ? o.status : undefined,
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly title?: string;
  readonly detail?: string;

  constructor(status: number, message: string, body: unknown, problem?: ProblemDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.title = problem?.title;
    this.detail = problem?.detail;
  }
}

export type RequestOptions = {
  method?: string;
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  /** When true, sends body as FormData / multipart without JSON Content-Type. */
  multipart?: boolean;
  /** When true, returns response as Blob (e.g. file download). */
  binary?: boolean;
  /** When true, omit Authorization (login / public endpoints). */
  skipAuth?: boolean;
  signal?: AbortSignal;
};

const buildUrl = (apiPath: string, query?: RequestOptions["query"]) => {
  const pathWithBase = apiPath.startsWith("http") ? apiPath : `${baseUrl}${apiPath}`;
  // Relative URLs (dev proxy) need a base; absolute URLs do not.
  const url = pathWithBase.startsWith("http")
    ? new URL(pathWithBase)
    : new URL(pathWithBase, typeof window !== "undefined" ? window.location.origin : "http://localhost");

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  // Keep relative when using the Vite proxy so the browser stays same-origin.
  if (!pathWithBase.startsWith("http")) {
    return `${url.pathname}${url.search}`;
  }
  return url.toString();
};

export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    Accept: options.binary ? "*/*" : "application/json",
  };

  if (!options.skipAuth) {
    hydrateAccessToken();
    if (!accessToken) {
      redirectToLogin();
      throw new ApiError(401, "Session expired", null, {
        title: "Session expired",
        detail: "Please sign in again.",
        status: 401,
      });
    }
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null) {
    if (options.multipart) {
      body = options.body as BodyInit;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(buildUrl(options.path, options.query), {
    method: options.method ?? "GET",
    headers,
    body,
    signal: options.signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipAuth) {
      clearSession();
      redirectToLogin();
    }
    let errorBody: unknown = null;
    const contentType = response.headers.get("content-type") ?? "";
    try {
      errorBody = contentType.includes("json")
        ? await response.json()
        : await response.text();
    } catch {
      errorBody = null;
    }
    const problem = parseProblemDetails(errorBody);
    const message =
      problem.detail?.trim() ||
      problem.title?.trim() ||
      `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, errorBody, problem);
  }

  if (options.binary) {
    return (await response.blob()) as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

export const apiKeys = {
  all: ["esiglife"] as const,
};
