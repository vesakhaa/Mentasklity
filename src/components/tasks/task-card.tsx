"use client";

import { useState, useTransition } from "react";
import { TaskStatus } from "@prisma/client";
import {
  CalendarClock,
  Check,
  MoreVertical,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteTask } from "@/actions/task";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDeadlineWib, getRelativeRemainingTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface TaskItemData {
  id: string;
  title: string;
  deadline: string | Date;
  status: TaskStatus;
  completedAt: string | Date | null;
  courseId: string;
  courseName: string;
}

interface TaskCardProps {
  task: TaskItemData;
  onToggleStatus: (taskId: string, nextStatus: TaskStatus) => void;
  onEdit: (task: TaskItemData) => void;
}

export function TaskCard({ task, onToggleStatus, onEdit }: TaskCardProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const isCompleted = task.status === "SELESAI";
  const isInProgress = task.status === "DIKERJAKAN";
  const isNotStarted = task.status === "BELUM_DIKERJAKAN";
  const remaining = getRelativeRemainingTime(task.deadline);

  // Indikator warna berlaku untuk semua tugas yang belum selesai (status !== "SELESAI"):
  // - Hijau/redup: SELESAI
  // - Merah: belum selesai dan sudah lewat deadline ("Terlambat")
  // - Oranye: belum selesai dan deadline <= 24 jam
  // - Indigo tipis: sedang dikerjakan (deadline > 24 jam)
  // - Netral: belum dikerjakan (deadline > 24 jam)
  const cardBorderClass = isCompleted
    ? "border-emerald-200/70 bg-emerald-50/20 opacity-80 dark:border-emerald-950/60 dark:bg-emerald-950/10"
    : remaining.isOverdue
    ? "border-l-4 border-l-red-500 border-red-200 bg-red-50/20 dark:border-red-900/60 dark:bg-red-950/10"
    : remaining.isUnder24h
    ? "border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/20 dark:border-amber-900/60 dark:bg-amber-950/10"
    : isInProgress
    ? "border-l-4 border-l-indigo-500 border-border"
    : "border-border";

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const res = await deleteTask(task.id);
      if (!res.ok) {
        toast.error(res.message || "Gagal menghapus tugas");
        return;
      }
      toast.success("Tugas dihapus");
      setConfirmDeleteOpen(false);
    });
  };

  return (
    <>
      <Card className={cn("transition-all", cardBorderClass)}>
        <CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{task.courseName}</Badge>

              {isCompleted ? (
                <Badge variant="success">Selesai</Badge>
              ) : isNotStarted ? (
                <Badge variant="outline">Belum Dikerjakan</Badge>
              ) : (
                <Badge className="border-transparent bg-indigo-100 text-indigo-700 hover:bg-indigo-100/80 dark:bg-indigo-950/60 dark:text-indigo-400">
                  Sedang Dikerjakan
                </Badge>
              )}

              {!isCompleted && remaining.isOverdue && (
                <Badge variant="destructive">Terlambat</Badge>
              )}
              {!isCompleted && !remaining.isOverdue && remaining.isUnder24h && (
                <Badge variant="warning">Segera (&le; 24 Jam)</Badge>
              )}
            </div>

            <h4
              className={cn(
                "text-base font-semibold",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h4>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatDeadlineWib(task.deadline)}
              </span>
              {!isCompleted && (
                <>
                  <span>&bull;</span>
                  <span
                    className={cn(
                      "font-medium",
                      remaining.isOverdue
                        ? "text-red-600 dark:text-red-400"
                        : remaining.isUnder24h
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {remaining.text}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(task)}
              title="Edit tugas atau ubah deadline"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>

            {isNotStarted && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onToggleStatus(task.id, "DIKERJAKAN")}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Mulai Kerjakan
              </Button>
            )}

            {isInProgress && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onToggleStatus(task.id, "SELESAI")}
              >
                <Check className="mr-1.5 h-4 w-4" />
                Tandai Selesai
              </Button>
            )}

            {isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(task.id, "DIKERJAKAN")}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Kerjakan Lagi
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu aksi tugas">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Tugas / Deadline
                </DropdownMenuItem>
                {!isNotStarted && (
                  <DropdownMenuItem
                    onClick={() => onToggleStatus(task.id, "BELUM_DIKERJAKAN")}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Ubah ke Belum Dikerjakan
                  </DropdownMenuItem>
                )}
                {!isCompleted && (
                  <DropdownMenuItem
                    onClick={() => onToggleStatus(task.id, "SELESAI")}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Tandai Selesai
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tugas?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah kamu yakin ingin menghapus tugas{" "}
              <strong>{task.title}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
