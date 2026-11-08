"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeOnboarding, saveProfile } from "@/actions/onboarding";
import { CourseFields } from "@/components/semesters/course-fields";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OnboardingWizardProps {
  initialFullName: string;
  initialUniversity: string;
  initialMajor: string;
}

export function OnboardingWizard({
  initialFullName,
  initialUniversity,
  initialMajor,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [fullName, setFullName] = useState(initialFullName);
  const [university, setUniversity] = useState(initialUniversity);
  const [major, setMajor] = useState(initialMajor);

  const [number, setNumber] = useState("1");
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [courses, setCourses] = useState<string[]>([""]);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    startTransition(async () => {
      const res = await saveProfile({ fullName, university, major });
      if (!res.ok) {
        if (res.errors) setErrors(res.errors);
        return;
      }
      setStep(2);
    });
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    startTransition(async () => {
      const cleanedCourses = courses.map((c) => c.trim()).filter(Boolean);
      const res = await completeOnboarding({
        fullName,
        university,
        major,
        number: Number(number),
        academicYear,
        courses: cleanedCourses,
      });

      if (!res.ok) {
        if (res.errors) setErrors(res.errors);
        if (res.message) toast.error(res.message);
        return;
      }

      toast.success("Selamat datang! Profil akademik berhasil disimpan.");
      router.push("/dashboard");
    });
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Langkah {step} dari 2</span>
          <span>{step === 1 ? "Data Diri" : "Data Akademik"}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        <CardTitle className="pt-3 text-xl">
          {step === 1
            ? "Lengkapi Data Diri"
            : "Semester & Mata Kuliah Saat Ini"}
        </CardTitle>
        <CardDescription>
          {step === 1
            ? "Informasi ini digunakan untuk mempersonalisasi dashboard kuliahmu."
            : "Masukkan semester aktif beserta daftar mata kuliah yang kamu ambil."}
        </CardDescription>
      </CardHeader>

      {step === 1 ? (
        <form onSubmit={handleNextStep}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                placeholder="Contoh: Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              {errors.fullName?.[0] && (
                <p className="text-xs text-red-600">{errors.fullName[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="university">Universitas</Label>
              <Input
                id="university"
                placeholder="Contoh: Universitas Indonesia"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                required
              />
              {errors.university?.[0] && (
                <p className="text-xs text-red-600">{errors.university[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="major">Program Studi</Label>
              <Input
                id="major"
                placeholder="Contoh: Ilmu Komputer"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                required
              />
              {errors.major?.[0] && (
                <p className="text-xs text-red-600">{errors.major[0]}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Lanjut ke Data Akademik"}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleFinish}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Semester Saat Ini</Label>
                <Select value={number} onValueChange={setNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Semester {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.number?.[0] && (
                  <p className="text-xs text-red-600">{errors.number[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="academicYear">Tahun Ajaran</Label>
                <Input
                  id="academicYear"
                  placeholder="2026/2027"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                />
                {errors.academicYear?.[0] && (
                  <p className="text-xs text-red-600">
                    {errors.academicYear[0]}
                  </p>
                )}
              </div>
            </div>

            <CourseFields
              courses={courses}
              onChange={setCourses}
              error={errors.courses?.[0]}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isPending}
            >
              Kembali
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Selesai"}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
