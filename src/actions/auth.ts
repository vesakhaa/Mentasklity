"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validations";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; errors?: Record<string, string[]>; message?: string };

// Rate limit sederhana in-memory per IP untuk login (maks 10 percobaan/menit)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function register(formData: FormData): Promise<ActionResult> {
  const raw = {
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { phone },
  });

  if (existing) {
    return {
      ok: false,
      errors: { phone: ["Nomor HP sudah terdaftar"] },
      message: "Nomor HP sudah terdaftar",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash,
      onboardingDone: false,
    },
  });

  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(formData: FormData): Promise<ActionResult> {
  const headerStore = headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!checkLoginRateLimit(ip)) {
    return {
      ok: false,
      message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.",
    };
  }

  const raw = {
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Nomor HP atau password salah",
    };
  }

  const { phone, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    return {
      ok: false,
      message: "Nomor HP atau password salah",
    };
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return {
      ok: false,
      message: "Nomor HP atau password salah",
    };
  }

  await createSession(user.id);
  redirect(user.onboardingDone ? "/dashboard" : "/onboarding");
}

export async function logout(): Promise<void> {
  deleteSession();
  redirect("/login");
}
