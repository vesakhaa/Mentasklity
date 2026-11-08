"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { onboardingCompleteSchema, profileSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

export async function saveProfile(input: {
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

  return { ok: true };
}

export async function completeOnboarding(input: {
  fullName: string;
  university: string;
  major: string;
  number: number;
  academicYear: string;
  courses: string[];
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = onboardingCompleteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { fullName, university, major, number, academicYear, courses } =
    parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.semester.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });

      const semester = await tx.semester.create({
        data: {
          userId: user.id,
          number,
          academicYear,
          isActive: true,
        },
      });

      await tx.course.createMany({
        data: courses.map((name) => ({
          semesterId: semester.id,
          name,
        })),
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          fullName,
          university,
          major,
          onboardingDone: true,
        },
      });
    });
  } catch {
    return {
      ok: false,
      message: "Gagal menyimpan data onboarding. Pastikan semester belum duplikat.",
    };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
