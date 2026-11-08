"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await login(formData);
      if (res && !res.ok) {
        setErrorMsg(res.message || "Nomor HP atau password salah");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Masuk ke MENTASKLITY</CardTitle>
          <CardDescription>
            Masukkan nomor HP dan password untuk mengelola tugas kuliahmu.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="081234567890"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Tampilkan atau sembunyikan password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Memproses..." : "Masuk"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-semibold text-indigo-600 hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
