import { cookies } from "next/headers";

export const VISITOR_COOKIE = "visitor_session";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getVisitorId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE)?.value;

  if (existing) {
    return existing;
  }

  const visitorId = crypto.randomUUID();

  cookieStore.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  return visitorId;
}
