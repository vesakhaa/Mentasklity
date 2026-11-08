import { prisma } from "@/lib/prisma";
import {
  sendReminder,
  TelegramForbiddenError,
} from "@/lib/telegram/send";

export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ["BELUM_DIKERJAKAN", "DIKERJAKAN"] },
      reminderSent: false,
      deadline: { gt: now, lte: in24h },
      user: {
        telegramChatId: { not: null },
        telegramLinkedAt: { not: null },
      },
    },
    include: { user: true, course: true },
    orderBy: { deadline: "asc" },
    take: 50,
  });

  let sentCount = 0;

  for (const task of tasks) {
    try {
      await sendReminder(task);
      await prisma.task.update({
        where: { id: task.id },
        data: {
          reminderSent: true,
          reminderSentAt: new Date(),
        },
      });
      sentCount += 1;
    } catch (err) {
      if (err instanceof TelegramForbiddenError) {
        // Jika Telegram membalas 403 (bot diblokir / chat tidak ada):
        // putuskan koneksi user (telegramChatId, telegramLinkedAt = null)
        await prisma.user.update({
          where: { id: task.userId },
          data: {
            telegramChatId: null,
            telegramLinkedAt: null,
          },
        });
      } else {
        console.error(
          `Gagal mengirim pengingat untuk task ${task.id}:`,
          err
        );
      }
    }

    // Jeda +-50 ms agar tidak melewati rate limit Telegram
    await sleep(50);
  }

  return Response.json({ checked: tasks.length, sent: sentCount });
}
