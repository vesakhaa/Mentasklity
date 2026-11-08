import { webhookCallback } from "grammy";
import { getBot } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secretHeader = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret || secretHeader !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const bot = getBot();
  const handleUpdate = webhookCallback(bot, "std/http");
  return handleUpdate(req);
}
