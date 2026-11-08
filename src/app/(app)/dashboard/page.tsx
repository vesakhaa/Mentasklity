import { TelegramBanner } from "@/components/layout/telegram-banner";
import { TaskList } from "@/components/tasks/task-list";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();

  const activeSemester = await prisma.semester.findFirst({
    where: { userId: user.id, isActive: true },
    include: {
      courses: {
        orderBy: { name: "asc" },
        include: {
          tasks: true,
        },
      },
    },
  });

  const initialTasks = activeSemester
    ? activeSemester.courses.flatMap((course) =>
        course.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          deadline: t.deadline.toISOString(),
          status: t.status,
          completedAt: t.completedAt ? t.completedAt.toISOString() : null,
          courseId: course.id,
          courseName: course.name,
        }))
      )
    : [];

  const firstName = user.fullName?.trim().split(/\s+/)[0] || "Mahasiswa";
  const isTelegramConnected = Boolean(
    user.telegramChatId && user.telegramLinkedAt
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Halo, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeSemester
              ? `Semester ${activeSemester.number} · ${activeSemester.academicYear}`
              : "Belum ada semester aktif"}
          </p>
        </div>
      </div>

      <TelegramBanner isConnected={isTelegramConnected} />

      <TaskList
        initialTasks={initialTasks}
        courses={
          activeSemester?.courses.map((c) => ({
            id: c.id,
            name: c.name,
          })) ?? []
        }
      />
    </div>
  );
}
