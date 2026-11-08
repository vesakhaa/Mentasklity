export const APP_TIMEZONE = "Asia/Jakarta";

/**
 * Mengubah nilai input <input type="datetime-local"> (mis. "2026-11-10T23:59")
 * menjadi objek Date UTC dengan menafsirkannya sebagai waktu WIB (UTC+7).
 */
export function parseWibDateTimeLocal(value: string): Date {
  const trimmed = value.trim();
  // Jika format YYYY-MM-DDTHH:mm (panjang 16), tambahkan :00
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed}:00`
    : trimmed;
  return new Date(`${withSeconds}+07:00`);
}

/**
 * Mengubah Date ke format string untuk nilai default <input type="datetime-local"> dalam WIB.
 */
export function toDateTimeLocalWib(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

/**
 * Format tampil deadline sesuai Bagian 3:
 * "Sen, 10 Nov 2026 · 23.59 WIB" (locale id-ID)
 */
export function formatDeadlineWib(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const datePart = new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(":", ".");

  return `${datePart} · ${timePart} WIB`;
}

/**
 * Menghasilkan teks sisa waktu relatif ("2 hari lagi", "5 jam lagi", "Terlambat 3 jam")
 */
export function getRelativeRemainingTime(
  deadline: Date | string,
  now: Date = new Date()
): {
  text: string;
  isOverdue: boolean;
  isUnder24h: boolean;
  hours: number;
  minutes: number;
} {
  const target = typeof deadline === "string" ? new Date(deadline) : deadline;
  const diffMs = target.getTime() - now.getTime();
  const absMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));
  const days = Math.floor(absMinutes / (60 * 24));
  const hours = Math.floor((absMinutes % (60 * 24)) / 60);
  const totalHours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;

  if (diffMs < 0) {
    if (days > 0) {
      return {
        text: `Terlambat ${days} hari ${hours > 0 ? `${hours} jam` : ""}`.trim(),
        isOverdue: true,
        isUnder24h: false,
        hours: 0,
        minutes: 0,
      };
    }
    if (totalHours > 0) {
      return {
        text: `Terlambat ${totalHours} jam`,
        isOverdue: true,
        isUnder24h: false,
        hours: 0,
        minutes: 0,
      };
    }
    return {
      text: `Terlambat ${Math.max(1, minutes)} menit`,
      isOverdue: true,
      isUnder24h: false,
      hours: 0,
      minutes: 0,
    };
  }

  const isUnder24h = diffMs <= 24 * 60 * 60 * 1000;

  if (days >= 1 && !isUnder24h) {
    return {
      text: `${days} hari lagi`,
      isOverdue: false,
      isUnder24h: false,
      hours: totalHours,
      minutes,
    };
  }

  if (totalHours >= 1) {
    return {
      text: `${totalHours} jam ${minutes > 0 ? `${minutes} menit ` : ""}lagi`,
      isOverdue: false,
      isUnder24h,
      hours: totalHours,
      minutes,
    };
  }

  return {
    text: `${Math.max(1, minutes)} menit lagi`,
    isOverdue: false,
    isUnder24h: true,
    hours: 0,
    minutes: Math.max(1, minutes),
  };
}
