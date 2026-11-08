import {
  SemesterList,
  SemesterItem,
} from "@/components/semesters/semester-list";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function SemestersPage() {
  const user = await requireUser();

  const semesters = await prisma.semester.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }],
    include: {
      courses: {
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { tasks: true },
          },
        },
      },
    },
  });

  const formatted: SemesterItem[] = semesters.map((sem) => {
    const courses = sem.courses.map((c) => ({
      id: c.id,
      name: c.name,
      taskCount: c._count.tasks,
    }));
    const taskCount = courses.reduce((acc, c) => acc + c.taskCount, 0);

    return {
      id: sem.id,
      number: sem.number,
      academicYear: sem.academicYear,
      isActive: sem.isActive,
      taskCount,
      courses,
    };
  });

  return <SemesterList semesters={formatted} />;
}
