import { z } from "zod";
import { normalizePhone } from "./phone";
import { parseWibDateTimeLocal } from "./time";

export const phoneSchema = z
  .string()
  .min(1, "Nomor HP wajib diisi")
  .transform((val, ctx) => {
    const normalized = normalizePhone(val);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nomor HP tidak valid. Contoh: 081234567890",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter");

export const registerSchema = z
  .object({
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password wajib diisi"),
});

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(80, "Nama lengkap maksimal 80 karakter"),
  university: z
    .string()
    .trim()
    .min(2, "Nama universitas minimal 2 karakter")
    .max(100, "Nama universitas maksimal 100 karakter"),
  major: z
    .string()
    .trim()
    .min(2, "Program studi minimal 2 karakter")
    .max(100, "Program studi maksimal 100 karakter"),
});

export const academicYearSchema = z
  .string()
  .trim()
  .regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY (contoh: 2026/2027)")
  .refine(
    (val) => {
      const [y1, y2] = val.split("/").map(Number);
      return y2 === y1 + 1;
    },
    { message: "Tahun kedua harus sama dengan tahun pertama + 1 (contoh: 2026/2027)" }
  );

export const courseNameSchema = z
  .string()
  .trim()
  .min(2, "Nama mata kuliah minimal 2 karakter")
  .max(80, "Nama mata kuliah maksimal 80 karakter");

export const coursesArraySchema = z
  .array(courseNameSchema)
  .min(1, "Minimal harus ada 1 mata kuliah")
  .max(15, "Maksimal 15 mata kuliah per semester")
  .refine(
    (courses) => {
      const lower = courses.map((c) => c.toLowerCase());
      return new Set(lower).size === lower.length;
    },
    { message: "Nama mata kuliah tidak boleh duplikat dalam satu semester" }
  );

export const semesterInputSchema = z.object({
  number: z.coerce
    .number()
    .int("Semester harus berupa bilangan bulat")
    .min(1, "Semester minimal 1")
    .max(14, "Semester maksimal 14"),
  academicYear: academicYearSchema,
  courses: coursesArraySchema,
});

export const onboardingCompleteSchema = profileSchema.merge(semesterInputSchema);

export const createTaskSchema = z.object({
  courseId: z.string().min(1, "Mata kuliah wajib dipilih"),
  title: z
    .string()
    .trim()
    .min(2, "Nama tugas minimal 2 karakter")
    .max(120, "Nama tugas maksimal 120 karakter"),
  deadline: z
    .string()
    .min(1, "Deadline wajib diisi")
    .transform((val, ctx) => {
      const d = parseWibDateTimeLocal(val);
      if (isNaN(d.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Format tanggal deadline tidak valid",
        });
        return z.NEVER;
      }
      if (d.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Deadline harus berada di masa depan saat tugas dibuat",
        });
        return z.NEVER;
      }
      return d;
    }),
});

export const updateTaskSchema = z.object({
  taskId: z.string().min(1, "ID tugas tidak valid"),
  courseId: z.string().min(1, "Mata kuliah wajib dipilih"),
  title: z
    .string()
    .trim()
    .min(2, "Nama tugas minimal 2 karakter")
    .max(120, "Nama tugas maksimal 120 karakter"),
  deadline: z
    .string()
    .min(1, "Deadline wajib diisi")
    .transform((val, ctx) => {
      const d = parseWibDateTimeLocal(val);
      if (isNaN(d.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Format tanggal deadline tidak valid",
        });
        return z.NEVER;
      }
      return d;
    }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Konfirmasi password baru wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Konfirmasi password baru tidak sama",
  });
