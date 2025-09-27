
import { NextResponse } from "next/server";

import { clearAuthCookies, getRefreshToken } from "@/src/lib/auth-cookies";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(
  /\/$/,
  "",
);

const buildUrl = (path: string) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const readJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse JSON from logout response", error);
    return null;
  }
};

export async function POST() {
  const refreshToken = await getRefreshToken();

  let upstreamStatus = 204;
  let payload: unknown = null;

  if (refreshToken) {
    try {
      const upstream = await fetch(buildUrl("/auth/logout/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: "no-store",
      });

      upstreamStatus = upstream.status;
      payload = await readJson(upstream);
    } catch (error) {
      console.error("Failed to reach logout endpoint", error);
      upstreamStatus = 503;
      payload = { detail: "upstream_unreachable" };
    }
  }

  await clearAuthCookies();

  if (upstreamStatus >= 400) {
    return NextResponse.json(payload ?? { detail: "logout_failed" }, {
      status: upstreamStatus,
    });
  }

  return NextResponse.json({ success: true });

}
