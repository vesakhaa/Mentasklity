"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { changePasswordSchema, profileSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

export async function updateProfile(input: {
  fullName: string;
  university: string;
  major: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName: parsed.data.fullName,
      university: parsed.data.university,
      major: parsed.data.major,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const isCurrentValid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash
  );

  if (!isCurrentValid) {
    return {
      ok: false,
      errors: { currentPassword: ["Password lama tidak sesuai"] },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { ok: true };
}

export async function createTelegramLink(): Promise<
  ActionResult<{ url: string; expiresAt: string }>
> {
  const user = await requireUser();

  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramLinkToken: token,
      telegramLinkExpiresAt: expiresAt,
    },
  });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "TugasKuliahBot";
  const url = `https://t.me/${botUsername}?start=${token}`;

  revalidatePath("/settings");
  return {
    ok: true,
    data: { url, expiresAt: expiresAt.toISOString() },
  };
}

export async function disconnectTelegram(): Promise<ActionResult> {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: null,
      telegramLinkedAt: null,
      telegramLinkToken: null,
      telegramLinkExpiresAt: null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function checkTelegramConnection(): Promise<
  ActionResult<{ connected: boolean; linkedAt: string | null }>
> {
  const user = await requireUser();
  return {
    ok: true,
    data: {
      connected: Boolean(user.telegramChatId && user.telegramLinkedAt),
      linkedAt: user.telegramLinkedAt ? user.telegramLinkedAt.toISOString() : null,
    },
  };
}
