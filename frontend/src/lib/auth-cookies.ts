import { cookies } from "next/headers";

const isProd = process.env.NODE_ENV === "production";

export const ACCESS_TOKEN_COOKIE = "exam_access_token";
export const REFRESH_TOKEN_COOKIE = "exam_refresh_token";

const DEFAULT_ACCESS_MAX_AGE = 60 * 5; // 5 minutes
const DEFAULT_REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface TokenPayload {
  access?: string;
  refresh?: string;
  access_expires_in?: number;
  refresh_expires_in?: number;
}

export function parseTokenPayload(data: unknown): TokenPayload {
  if (!data || typeof data !== "object") {
    return {};
  }
  const record = data as Record<string, unknown>;
  return {
    access:
      typeof record.access === "string" ? (record.access as string) : undefined,
    refresh:
      typeof record.refresh === "string"
        ? (record.refresh as string)
        : undefined,
    access_expires_in:
      typeof record.access_expires_in === "number"
        ? (record.access_expires_in as number)
        : undefined,
    refresh_expires_in:
      typeof record.refresh_expires_in === "number"
        ? (record.refresh_expires_in as number)
        : undefined,
  };
}

export async function setAuthCookies(payload: TokenPayload) {
  const store = await cookies();

  if (payload.access) {
    store.set({
      name: ACCESS_TOKEN_COOKIE,
      value: payload.access,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: payload.access_expires_in ?? DEFAULT_ACCESS_MAX_AGE,
    });
  }

  if (payload.refresh) {
    store.set({
      name: REFRESH_TOKEN_COOKIE,
      value: payload.refresh,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: payload.refresh_expires_in ?? DEFAULT_REFRESH_MAX_AGE,
    });
  }
}

export async function clearAuthCookies() {
  const store = await cookies();
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    path: "/",
    maxAge: 0,
  };
  store.set({ name: ACCESS_TOKEN_COOKIE, value: "", ...base });
  store.set({ name: REFRESH_TOKEN_COOKIE, value: "", ...base });
}

export async function getRefreshToken() {
  const store = await cookies();
  return store.get(REFRESH_TOKEN_COOKIE)?.value;
}
