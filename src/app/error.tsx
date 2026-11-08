"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Maaf, terjadi gangguan saat memuat halaman. Silakan coba lagi.
      </p>
      <Button className="mt-4" onClick={() => reset()}>
        Muat Ulang
      </Button>
    </div>
  );
}
