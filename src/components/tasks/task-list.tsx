"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { TaskStatus } from "@prisma/client";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { setTaskStatus } from "@/actions/task";
import { Button } from "@/components/ui/button";
import { TaskFilters, StatusFilter } from "./filters";
import { TaskCard, TaskItemData } from "./task-card";
import { TaskDialog } from "./task-dialog";
import { TaskStats } from "./stats";

interface TaskListProps {
  initialTasks: TaskItemData[];
  courses: { id: string; name: string }[];
}

export function TaskList({ initialTasks, courses }: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItemData | null>(null);
  const [, startTransition] = useTransition();

  const [optimisticTasks, updateOptimisticTask] = useOptimistic(
    initialTasks,
    (
      state: TaskItemData[],
      action: { taskId: string; status: TaskStatus }
    ) =>
      state.map((t) =>
        t.id === action.taskId
          ? {
              ...t,
              status: action.status,
              completedAt:
                action.status === "SELESAI" ? new Date().toISOString() : null,
            }
          : t
      )
  );

  const handleToggleStatus = (taskId: string, nextStatus: TaskStatus) => {
    startTransition(async () => {
      updateOptimisticTask({ taskId, status: nextStatus });
      const res = await setTaskStatus({ taskId, status: nextStatus });
      if (!res.ok) {
        toast.error(res.message || "Gagal mengubah status tugas");
        return;
      }
      if (nextStatus === "DIKERJAKAN") {
        toast.success("Status tugas: Sedang Dikerjakan");
      } else if (nextStatus === "SELESAI") {
        toast.success("Tugas selesai!");
      } else {
        toast.success("Status tugas: Belum Dikerjakan");
      }
    });
  };

  // Hitung statistik untuk semester aktif
  const stats = useMemo(() => {
    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;

    let notStartedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let urgent24hCount = 0;

    for (const t of optimisticTasks) {
      if (t.status === "SELESAI") {
        completedCount += 1;
      } else {
        if (t.status === "BELUM_DIKERJAKAN") {
          notStartedCount += 1;
        } else {
          inProgressCount += 1;
        }
        const dl = new Date(t.deadline).getTime();
        if (dl > now && dl <= in24h) {
          urgent24hCount += 1;
        }
      }
    }

    return { notStartedCount, inProgressCount, completedCount, urgent24hCount };
  }, [optimisticTasks]);

  // Filter dan urutkan:
  // 1. Tugas belum selesai (DIKERJAKAN & BELUM_DIKERJAKAN) berada di atas, diurutkan deadline terdekat
  // 2. SELESAI berada di paling bawah, diurutkan completedAt terbaru
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = optimisticTasks.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (courseFilter !== "ALL" && t.courseId !== courseFilter) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const aDone = a.status === "SELESAI";
      const bDone = b.status === "SELESAI";

      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }

      if (!aDone && !bDone) {
        return (
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
      }

      const compA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const compB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return compB - compA;
    });
  }, [optimisticTasks, statusFilter, courseFilter]);

  return (
    <div className="space-y-6">
      <TaskStats
        notStartedCount={stats.notStartedCount}
        inProgressCount={stats.inProgressCount}
        completedCount={stats.completedCount}
        urgent24hCount={stats.urgent24hCount}
      />

      <TaskFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        courses={courses}
        onAddClick={() => {
          setTaskToEdit(null);
          setDialogOpen(true);
        }}
      />

      {filteredAndSortedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <ClipboardList className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-medium">
            Belum ada tugas. Tambahkan tugas pertamamu!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Catat tugas kuliahmu agar tidak ada deadline yang terlewat.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setTaskToEdit(null);
              setDialogOpen(true);
            }}
          >
            + Tambah Tugas
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleStatus={handleToggleStatus}
              onEdit={(item) => {
                setTaskToEdit(item);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courses={courses}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
