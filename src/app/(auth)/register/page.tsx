"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { register } from "@/actions/auth";
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

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    const formData = new FormData(e.currentTarget);

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      const msg = "Password dan Ulangi Password tidak sama!";
      setGeneralError(msg);
      setErrors({ confirmPassword: [msg] });
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      const res = await register(formData);
      if (res && !res.ok) {
        if (res.errors) {
          setErrors(res.errors);
          const firstError = Object.values(res.errors).flat()[0];
          if (firstError) {
            toast.error(firstError);
          }
        }
        if (res.message && !res.errors) {
          setGeneralError(res.message);
          toast.error(res.message);
        }
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
          <CardTitle className="text-2xl font-bold">Daftar Akun Baru</CardTitle>
          <CardDescription>
            Mulai catat tugas kuliah dan aktifkan pengingat Telegram.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {generalError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{generalError}</span>
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
              {errors.phone?.[0] && (
                <p className="text-xs text-red-600">{errors.phone[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password?.[0] && (
                <p className="text-xs text-red-600">{errors.password[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Ulangi Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Ketik ulang password"
                required
              />
              {errors.confirmPassword?.[0] && (
                <p className="text-xs text-red-600">
                  {errors.confirmPassword[0]}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Mendaftarkan..." : "Daftar"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
