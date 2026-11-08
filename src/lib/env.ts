import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL wajib diisi"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET harus minimal 32 karakter"),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN wajib diisi"),
  TELEGRAM_BOT_USERNAME: z
    .string()
    .min(1, "TELEGRAM_BOT_USERNAME wajib diisi"),
  TELEGRAM_WEBHOOK_SECRET: z
    .string()
    .min(1, "TELEGRAM_WEBHOOK_SECRET wajib diisi"),
  REQUIRE_PHONE_MATCH: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  CRON_SECRET: z.string().min(1, "CRON_SECRET wajib diisi"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL harus berupa URL valid"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Konfigurasi environment variable tidak valid:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Environment variables tidak valid. Periksa file .env Anda.");
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}
