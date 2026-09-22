const ACCESS_TOKEN_KEY = "esiglife.accessToken";
const EXPIRES_ON_UTC_KEY = "esiglife.expiresOnUtc";
const USERNAME_KEY = "esiglife.username";
const SALES_ACCESS_KEY = "esiglife.salesAccess";

export const LOGIN_PATH = "/login";

export type AuthSession = {
  accessToken: string;
  expiresOnUtc: string;
  username?: string;
};

const parseExpiresOnUtc = (value: string): number => {
  const ms = Date.parse(value);
  if (!Number.isNaN(ms)) return ms;
  // Some APIs emit >3 fractional-second digits; JS Date only guarantees milliseconds.
  return Date.parse(value.replace(/(\.\d{3})\d+/, "$1"));
};

export const isAuthExpired = (expiresOnUtc: string): boolean => {
  const ms = parseExpiresOnUtc(expiresOnUtc);
  if (Number.isNaN(ms)) return true;
  return ms <= Date.now();
};

export const readAuthSession = (): AuthSession | null => {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresOnUtc = localStorage.getItem(EXPIRES_ON_UTC_KEY);
  if (!accessToken || !expiresOnUtc) return null;
  const username = localStorage.getItem(USERNAME_KEY)?.trim() || undefined;
  return { accessToken, expiresOnUtc, username };
};

export const persistAuthSession = (session: AuthSession) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(EXPIRES_ON_UTC_KEY, session.expiresOnUtc);
  const username = session.username?.trim();
  if (username) {
    localStorage.setItem(USERNAME_KEY, username);
  }
};

export const persistSalesAccess = (salesAccess: unknown) => {
  localStorage.setItem(SALES_ACCESS_KEY, JSON.stringify(salesAccess));
};

export const readSalesAccess = <T>(): T | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SALES_ACCESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_ON_UTC_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(SALES_ACCESS_KEY);
};

export const readDisplayUsername = (): string | null => {
  const session = readAuthSession();
  return session?.username?.trim() || null;
};

export const isAuthenticated = (): boolean => {
  const session = readAuthSession();
  if (!session) return false;
  if (isAuthExpired(session.expiresOnUtc)) {
    clearAuthSession();
    return false;
  }
  return true;
};

export const msUntilExpiry = (expiresOnUtc: string): number => {
  const ms = parseExpiresOnUtc(expiresOnUtc) - Date.now();
  return Number.isNaN(ms) ? 0 : Math.max(0, ms);
};
