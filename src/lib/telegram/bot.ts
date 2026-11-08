import { Bot, Keyboard } from "grammy";
import { prisma } from "../prisma";
import { normalizePhone } from "../phone";
import { formatDeadlineWib } from "../time";
import { escapeHtml } from "./send";

let botInstance: Bot | null = null;

export function getBot(): Bot {
  if (botInstance) return botInstance;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN belum diset");
  }

  const bot = new Bot(token);

  // Perintah /start dan /start <token>
  bot.command("start", async (ctx) => {
    const tokenArg = ctx.match?.trim();
    const chatId = String(ctx.chat.id);

    if (!tokenArg) {
      await ctx.reply(
        "Halo! 👋\n\nHubungkan bot ini lewat tombol <b>'Hubungkan Telegram'</b> di halaman Pengaturan website.",
        { parse_mode: "HTML" }
      );
      return;
    }

    const now = new Date();
    const user = await prisma.user.findFirst({
      where: {
        telegramLinkToken: tokenArg,
        telegramLinkExpiresAt: { gt: now },
      },
    });

    if (!user) {
      await ctx.reply(
        "Link tidak valid atau sudah kedaluwarsa. Buat link baru dari website.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Cek apakah akun Telegram ini sudah tertaut ke user lain
    const existingLinkedUser = await prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });

    if (existingLinkedUser && existingLinkedUser.id !== user.id) {
      await ctx.reply("Akun Telegram ini sudah terhubung ke akun lain.", {
        parse_mode: "HTML",
      });
      return;
    }

    const requirePhoneMatch = process.env.REQUIRE_PHONE_MATCH !== "false";

    if (requirePhoneMatch) {
      // Simpan telegramChatId sementara, tetapi telegramLinkedAt tetap null sampai verifikasi kontak selesai
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId,
          telegramLinkedAt: null,
        },
      });

      const keyboard = new Keyboard()
        .requestContact("📱 Bagikan Nomor HP")
        .oneTime()
        .resized();

      await ctx.reply(
        "Untuk memverifikasi, bagikan nomor HP kamu dengan menekan tombol di bawah.",
        {
          parse_mode: "HTML",
          reply_markup: keyboard,
        }
      );
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId,
          telegramLinkedAt: new Date(),
          telegramLinkToken: null,
          telegramLinkExpiresAt: null,
        },
      });

      await ctx.reply(
        "✅ Telegram berhasil terhubung! Kamu akan menerima pengingat tugas di sini.",
        { parse_mode: "HTML" }
      );
    }
  });

  // Handler pesan berisi contact (Bagian 8.3 langkah 4)
  bot.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact;
    const fromId = ctx.from?.id;
    const chatId = String(ctx.chat.id);

    if (!fromId || contact.user_id !== fromId) {
      await ctx.reply(
        "Gunakan tombol Bagikan Nomor HP, bukan kontak orang lain.",
        { parse_mode: "HTML" }
      );
      return;
    }

    const now = new Date();
    const user = await prisma.user.findFirst({
      where: {
        telegramChatId: chatId,
        telegramLinkedAt: null,
        telegramLinkToken: { not: null },
        telegramLinkExpiresAt: { gt: now },
      },
    });

    if (!user) {
      await ctx.reply(
        "Link tidak valid atau sudah kedaluwarsa. Buat link baru dari website.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true },
        }
      );
      return;
    }

    const normalizedContactPhone = normalizePhone(contact.phone_number);

    if (normalizedContactPhone && normalizedContactPhone === user.phone) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramLinkedAt: new Date(),
          telegramLinkToken: null,
          telegramLinkExpiresAt: null,
        },
      });

      await ctx.reply(
        "✅ Telegram berhasil terhubung! Kamu akan menerima pengingat tugas di sini.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true },
        }
      );
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: null,
        },
      });

      await ctx.reply(
        "Nomor Telegram tidak sama dengan nomor yang terdaftar di website. Hubungi lewat pengaturan untuk mengubah nomor akun, atau gunakan akun Telegram dengan nomor yang sama.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true },
        }
      );
    }
  });

  // Perintah /tugas (Bagian 8.4)
  bot.command("tugas", async (ctx) => {
    const chatId = String(ctx.chat.id);
    const user = await prisma.user.findFirst({
      where: {
        telegramChatId: chatId,
        telegramLinkedAt: { not: null },
      },
    });

    if (!user) {
      await ctx.reply(
        "Akun Telegram kamu belum terhubung. Hubungkan lewat menu <b>Pengaturan</b> di website.",
        { parse_mode: "HTML" }
      );
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { in: ["BELUM_DIKERJAKAN", "DIKERJAKAN"] },
        course: {
          semester: { isActive: true },
        },
      },
      include: { course: true },
      orderBy: { deadline: "asc" },
      take: 10,
    });

    if (tasks.length === 0) {
      await ctx.reply(
        "🎉 Tidak ada tugas aktif pada semester aktif saat ini!",
        { parse_mode: "HTML" }
      );
      return;
    }

    const lines = tasks.map((t, idx) => {
      const statusLabel =
        t.status === "BELUM_DIKERJAKAN" ? "⏳ Belum Dikerjakan" : "🔨 Dikerjakan";
      return `${idx + 1}. <b>${escapeHtml(t.title)}</b> (${statusLabel})\n   📚 ${escapeHtml(
        t.course.name
      )}\n   🕒 ${escapeHtml(formatDeadlineWib(t.deadline))}`;
    });

    await ctx.reply(
      `📋 <b>Daftar Tugas Aktif (${tasks.length}):</b>\n\n${lines.join("\n\n")}`,
      { parse_mode: "HTML" }
    );
  });

  // Perintah /bantuan (Bagian 8.4)
  bot.command("bantuan", async (ctx) => {
    const helpText = [
      "🤖 <b>Daftar Perintah Bot Tugas Kuliah</b>",
      "",
      "/start — Memulai bot atau menautkan akun dari website",
      "/tugas — Menampilkan maksimal 10 tugas aktif terdekat",
      "/bantuan — Menampilkan daftar perintah ini",
    ].join("\n");

    await ctx.reply(helpText, { parse_mode: "HTML" });
  });

  botInstance = bot;
  return bot;
}
