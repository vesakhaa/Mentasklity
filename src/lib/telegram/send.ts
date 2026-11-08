import { Course, Task, User } from "@prisma/client";
import { formatDeadlineWib, getRelativeRemainingTime } from "../time";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export class TelegramForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelegramForbiddenError";
  }
}

export async function sendTelegramMessage(
  chatId: string,
  htmlText: string
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN belum dikonfigurasi");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: htmlText,
      parse_mode: "HTML",
    }),
  });

  if (res.status === 403) {
    throw new TelegramForbiddenError("Bot diblokir oleh user atau chat tidak ditemukan (403)");
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gagal mengirim pesan Telegram (${res.status}): ${errBody}`);
  }
}

export type TaskWithUserAndCourse = Task & {
  user: User;
  course: Course;
};

/**
 * Mengirim pesan pengingat deadline sesuai format Bagian 9.3:
 * ⏰ <b>Pengingat Tugas</b>
 *
 * 📚 <b>{courseName}</b>
 * 📝 {taskTitle}
 * 🕒 Deadline: {Sen, 10 Nov 2026 · 23.59 WIB}
 * ⏳ Sisa waktu: ±{n} jam {m} menit
 *
 * Semangat mengerjakannya! 💪
 */
export async function sendReminder(task: TaskWithUserAndCourse): Promise<void> {
  if (!task.user.telegramChatId) {
    throw new Error("User tidak memiliki telegramChatId");
  }

  const remaining = getRelativeRemainingTime(task.deadline);
  const formattedDeadline = formatDeadlineWib(task.deadline);

  const message = [
    "⏰ <b>Pengingat Tugas</b>",
    "",
    `📚 <b>${escapeHtml(task.course.name)}</b>`,
    `📝 ${escapeHtml(task.title)}`,
    `🕒 Deadline: ${escapeHtml(formattedDeadline)}`,
    `⏳ Sisa waktu: ±${remaining.hours} jam ${remaining.minutes} menit`,
    "",
    "Semangat mengerjakannya! 💪",
  ].join("\n");

  await sendTelegramMessage(task.user.telegramChatId, message);
}
