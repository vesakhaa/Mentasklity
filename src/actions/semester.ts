"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { courseNameSchema, semesterInputSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

export async function createSemester(input: {
  number: number;
  academicYear: string;
  courses: string[];
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = semesterInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { number, academicYear, courses } = parsed.data;

  const existing = await prisma.semester.findUnique({
    where: {
      userId_number_academicYear: {
        userId: user.id,
        number,
        academicYear,
      },
    },
  });

  if (existing) {
    return {
      ok: false,
      message: `Semester ${number} (${academicYear}) sudah ada.`,
    };
  }

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
  });

  revalidatePath("/semesters");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setActiveSemester(
  semesterId: string
): Promise<ActionResult> {
  const user = await requireUser();

  const target = await prisma.semester.findFirst({
    where: { id: semesterId, userId: user.id },
  });

  if (!target) {
    return { ok: false, message: "Semester tidak ditemukan" };
  }

  await prisma.$transaction([
    prisma.semester.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    }),
    prisma.semester.update({
      where: { id: target.id },
      data: { isActive: true },
    }),
  ]);

  revalidatePath("/semesters");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteSemester(
  semesterId: string
): Promise<ActionResult> {
  const user = await requireUser();

  const allSemesters = await prisma.semester.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (allSemesters.length <= 1) {
    return {
      ok: false,
      message: "Semester tidak bisa dihapus karena merupakan satu-satunya semester.",
    };
  }

  const target = allSemesters.find((s) => s.id === semesterId);
  if (!target) {
    return { ok: false, message: "Semester tidak ditemukan" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.semester.delete({
      where: { id: target.id },
    });

    if (target.isActive) {
      const fallback = allSemesters.find((s) => s.id !== target.id);
      if (fallback) {
        await tx.semester.update({
          where: { id: fallback.id },
          data: { isActive: true },
        });
      }
    }
  });

  revalidatePath("/semesters");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addCourse(input: {
  semesterId: string;
  name: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsedName = courseNameSchema.safeParse(input.name);
  if (!parsedName.success) {
    return {
      ok: false,
      message: parsedName.error.issues[0]?.message ?? "Nama mata kuliah tidak valid",
    };
  }

  const semester = await prisma.semester.findFirst({
    where: { id: input.semesterId, userId: user.id },
    include: { courses: true },
  });

  if (!semester) {
    return { ok: false, message: "Semester tidak ditemukan" };
  }

  if (semester.courses.length >= 15) {
    return { ok: false, message: "Maksimal 15 mata kuliah per semester" };
  }

  const duplicate = semester.courses.some(
    (c) => c.name.toLowerCase() === parsedName.data.toLowerCase()
  );
  if (duplicate) {
    return {
      ok: false,
      message: "Nama mata kuliah sudah ada di semester ini",
    };
  }

  await prisma.course.create({
    data: {
      semesterId: semester.id,
      name: parsedName.data,
    },
  });

  revalidatePath("/semesters");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function renameCourse(input: {
  courseId: string;
  name: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsedName = courseNameSchema.safeParse(input.name);
  if (!parsedName.success) {
    return {
      ok: false,
      message: parsedName.error.issues[0]?.message ?? "Nama mata kuliah tidak valid",
    };
  }

  const course = await prisma.course.findFirst({
    where: {
      id: input.courseId,
      semester: { userId: user.id },
    },
    include: {
      semester: { include: { courses: true } },
    },
  });

  if (!course) {
    return { ok: false, message: "Mata kuliah tidak ditemukan" };
  }

  const duplicate = course.semester.courses.some(
    (c) =>
      c.id !== course.id &&
      c.name.toLowerCase() === parsedName.data.toLowerCase()
  );
  if (duplicate) {
    return {
      ok: false,
      message: "Nama mata kuliah sudah digunakan di semester ini",
    };
  }

  await prisma.course.update({
    where: { id: course.id },
    data: { name: parsedName.data },
  });

  revalidatePath("/semesters");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteCourse(courseId: string): Promise<ActionResult> {
  const user = await requireUser();

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      semester: { userId: user.id },
    },
    include: {
      semester: { include: { courses: true } },
    },
  });

  if (!course) {
    return { ok: false, message: "Mata kuliah tidak ditemukan" };
  }

  if (course.semester.courses.length <= 1) {
    return {
      ok: false,
      message: "Semester harus memiliki minimal 1 mata kuliah",
    };
  }

  await prisma.course.delete({
    where: { id: course.id },
  });

  revalidatePath("/semesters");
  revalidatePath("/dashboard");
  return { ok: true };
}
