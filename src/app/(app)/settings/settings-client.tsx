"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  LogOut,
  Phone,
  Send,
  Unlink,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { logout } from "@/actions/auth";
import {
  changePassword,
  checkTelegramConnection,
  createTelegramLink,
  disconnectTelegram,
  updateProfile,
} from "@/actions/settings";
import { Badge } from "@/components/ui/badge";
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

interface SettingsClientProps {
  phoneDisplay: string;
  initialFullName: string;
  initialUniversity: string;
  initialMajor: string;
  initialTelegramConnected: boolean;
}

export function SettingsClient({
  phoneDisplay,
  initialFullName,
  initialUniversity,
  initialMajor,
  initialTelegramConnected,
}: SettingsClientProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [university, setUniversity] = useState(initialUniversity);
  const [major, setMajor] = useState(initialMajor);
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>(
    {}
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<
    Record<string, string[]>
  >({});

  const [telegramConnected, setTelegramConnected] = useState(
    initialTelegramConnected
  );
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Polling ringan tiap 5 detik selama menunggu koneksi Telegram terbuka (Bagian 8.3 langkah 5)
  useEffect(() => {
    if (!deepLinkUrl || telegramConnected) return;

    const interval = setInterval(async () => {
      const res = await checkTelegramConnection();
      if (res.ok && res.data?.connected) {
        setTelegramConnected(true);
        setDeepLinkUrl(null);
        toast.success("Telegram berhasil terhubung!");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [deepLinkUrl, telegramConnected]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});

    startTransition(async () => {
      const res = await updateProfile({ fullName, university, major });
      if (!res.ok) {
        if (res.errors) setProfileErrors(res.errors);
        return;
      }
      toast.success("Profil berhasil diperbarui");
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    startTransition(async () => {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      if (!res.ok) {
        if (res.errors) setPasswordErrors(res.errors);
        return;
      }
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    });
  };

  const handleCreateTelegramLink = () => {
    startTransition(async () => {
      const res = await createTelegramLink();
      if (!res.ok || !res.data) {
        toast.error("Gagal membuat link Telegram");
        return;
      }
      setDeepLinkUrl(res.data.url);
    });
  };

  const handleDisconnectTelegram = () => {
    startTransition(async () => {
      const res = await disconnectTelegram();
      if (!res.ok) {
        toast.error("Gagal memutuskan koneksi Telegram");
        return;
      }
      setTelegramConnected(false);
      setDeepLinkUrl(null);
      toast.success("Koneksi Telegram diputuskan");
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil akademik, integrasi bot Telegram, dan keamanan akunmu.
        </p>
      </div>

      {/* 1. Integrasi Telegram */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-600" />
              <CardTitle>Pengingat Bot Telegram</CardTitle>
            </div>
            {telegramConnected ? (
              <Badge variant="success">Terhubung</Badge>
            ) : (
              <Badge variant="secondary">Belum Terhubung</Badge>
            )}
          </div>
          <CardDescription>
            Terima pesan otomatis di Telegram ketika deadline tugas kurang dari
            24 jam.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {telegramConnected ? (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-950 dark:bg-emerald-950/20 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5 text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>
                  Akun Telegram kamu sudah tertaut dan siap menerima pengingat.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectTelegram}
                disabled={isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Unlink className="mr-1.5 h-4 w-4" />
                Putuskan Telegram
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleCreateTelegramLink} disabled={isPending}>
                <Send className="mr-2 h-4 w-4" />
                Hubungkan Telegram
              </Button>

              {deepLinkUrl && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <p className="text-sm font-medium">
                    Link penautan siap (berlaku 15 menit):
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Klik tombol di bawah untuk membuka Bot Telegram, tekan{" "}
                    <strong>Start</strong>, lalu tekan{" "}
                    <strong>📱 Bagikan Nomor HP</strong>. Halaman ini akan
                    otomatis memperbarui status setelah terhubung.
                  </p>
                  <Button asChild variant="default" size="sm">
                    <a
                      href={deepLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buka Bot Telegram
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Profil */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-indigo-600" />
            <CardTitle>Profil Mahasiswa</CardTitle>
          </div>
          <CardDescription>
            Perbarui nama lengkap, universitas, dan program studi.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              {profileErrors.fullName?.[0] && (
                <p className="text-xs text-red-600">
                  {profileErrors.fullName[0]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="university">Universitas</Label>
                <Input
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  required
                />
                {profileErrors.university?.[0] && (
                  <p className="text-xs text-red-600">
                    {profileErrors.university[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="major">Program Studi</Label>
                <Input
                  id="major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                />
                {profileErrors.major?.[0] && (
                  <p className="text-xs text-red-600">
                    {profileErrors.major[0]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isPending}>
              Simpan Perubahan
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* 3. Keamanan (Ubah Password) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-600" />
            <CardTitle>Keamanan & Password</CardTitle>
          </div>
          <CardDescription>
            Gunakan password minimal 8 karakter.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Password Lama</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              {passwordErrors.currentPassword?.[0] && (
                <p className="text-xs text-red-600">
                  {passwordErrors.currentPassword[0]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                {passwordErrors.newPassword?.[0] && (
                  <p className="text-xs text-red-600">
                    {passwordErrors.newPassword[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmNewPassword">Ulangi Password Baru</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
                {passwordErrors.confirmNewPassword?.[0] && (
                  <p className="text-xs text-red-600">
                    {passwordErrors.confirmNewPassword[0]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" variant="outline" disabled={isPending}>
              Perbarui Password
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* 4. Informasi Akun & Keluar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-indigo-600" />
            <CardTitle>Akun</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Label className="text-xs text-muted-foreground">
              Nomor HP Terdaftar (Read-only)
            </Label>
            <p className="text-base font-semibold">{phoneDisplay}</p>
          </div>

          <Button
            variant="destructive"
            onClick={() => logout()}
            className="self-start sm:self-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar dari Akun
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
