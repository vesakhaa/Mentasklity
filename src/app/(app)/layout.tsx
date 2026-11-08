import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Guard onboarding (Bagian 7): jika onboardingDone = false, arahkan ke /onboarding
  if (!user.onboardingDone) {
    redirect("/onboarding");
  }

  const activeSemester = await prisma.semester.findFirst({
    where: { userId: user.id, isActive: true },
  });

  const activeSemesterLabel = activeSemester
    ? `Semester ${activeSemester.number} · ${activeSemester.academicYear}`
    : null;

  return (
    <div className="min-h-screen bg-muted/20">
      <AppHeader
        fullName={user.fullName}
        activeSemesterLabel={activeSemesterLabel}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
