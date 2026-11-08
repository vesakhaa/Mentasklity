"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mentasklity_hide_telegram_banner";

export function TelegramBanner({ isConnected }: { isConnected: boolean }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isConnected) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    setDismissed(saved === "1");
  }, [isConnected]);

  if (isConnected || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-900 dark:bg-indigo-950/40 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3 sm:items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Send className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-indigo-950 dark:text-indigo-100">
            Hubungkan Telegram untuk menerima pengingat deadline
          </p>
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            Dapatkan notifikasi otomatis saat sisa waktu tugas kurang dari 24 jam.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button asChild size="sm">
          <Link href="/settings">Hubungkan Sekarang</Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label="Tutup banner"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
