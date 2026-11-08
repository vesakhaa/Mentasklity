"use server";

import { revalidatePath } from "next/cache";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

export async function createTask(input: {
  courseId: string;
  title: string;
  deadline: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  // Pastikan courseId milik semester aktif user yang sedang login (Bagian 6)
  const course = await prisma.course.findFirst({
    where: {
      id: parsed.data.courseId,
      semester: {
        userId: user.id,
        isActive: true,
      },
    },
  });

  if (!course) {
    return {
      ok: false,
      errors: {
        courseId: ["Mata kuliah harus berasal dari semester aktif Anda"],
      },
    };
  }

  await prisma.task.create({
    data: {
      userId: user.id,
      courseId: course.id,
      title: parsed.data.title,
      deadline: parsed.data.deadline,
      status: "BELUM_DIKERJAKAN",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/semesters");
  return { ok: true };
}

export async function updateTask(input: {
  taskId: string;
  courseId: string;
  title: string;
  deadline: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingTask = await prisma.task.findFirst({
    where: {
      id: parsed.data.taskId,
      userId: user.id,
    },
  });

  if (!existingTask) {
    return { ok: false, message: "Tugas tidak ditemukan" };
  }

  // Pastikan courseId milik semester aktif user
  const course = await prisma.course.findFirst({
    where: {
      id: parsed.data.courseId,
      semester: {
        userId: user.id,
        isActive: true,
      },
    },
  });

  if (!course) {
    return {
      ok: false,
      errors: {
        courseId: ["Mata kuliah harus berasal dari semester aktif Anda"],
      },
    };
  }

  // Aturan Bagian 5: Jika deadline diubah -> set reminderSent = false dan reminderSentAt = null
  const deadlineChanged =
    existingTask.deadline.getTime() !== parsed.data.deadline.getTime();

  await prisma.task.update({
    where: { id: existingTask.id },
    data: {
      courseId: course.id,
      title: parsed.data.title,
      deadline: parsed.data.deadline,
      ...(deadlineChanged
        ? { reminderSent: false, reminderSentAt: null }
        : {}),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/semesters");
  return { ok: true };
}

export async function setTaskStatus(input: {
  taskId: string;
  status: TaskStatus;
}): Promise<ActionResult> {
  const user = await requireUser();

  const existingTask = await prisma.task.findFirst({
    where: {
      id: input.taskId,
      userId: user.id,
    },
  });

  if (!existingTask) {
    return { ok: false, message: "Tugas tidak ditemukan" };
  }

  // Aturan:
  // - Saat status diubah ke SELESAI -> isi completedAt = now()
  // - Saat kembali ke BELUM_DIKERJAKAN atau DIKERJAKAN dari SELESAI -> completedAt = null, set reminderSent = false
  const isCompleting = input.status === "SELESAI";
  const isReopeningFromDone =
    existingTask.status === "SELESAI" &&
    (input.status === "BELUM_DIKERJAKAN" || input.status === "DIKERJAKAN");

  await prisma.task.update({
    where: { id: existingTask.id },
    data: {
      status: input.status,
      completedAt: isCompleting ? new Date() : null,
      ...(isReopeningFromDone
        ? { reminderSent: false, reminderSentAt: null }
        : {}),
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const user = await requireUser();

  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId: user.id,
    },
  });

  if (!existingTask) {
    return { ok: false, message: "Tugas tidak ditemukan" };
  }

  await prisma.task.delete({
    where: { id: existingTask.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/semesters");
  return { ok: true };
}
