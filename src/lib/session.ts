import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 hari

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET harus diset dan minimal 32 karakter");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string" || !payload.userId) {
      return null;
    }
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken({ userId });
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function deleteSession(): void {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const getSession = cache(
  async (): Promise<SessionPayload | null> => {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  }
);

export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
});
