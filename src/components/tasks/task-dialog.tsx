"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createTask, updateTask } from "@/actions/task";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseWibDateTimeLocal, toDateTimeLocalWib } from "@/lib/time";

export interface EditableTask {
  id: string;
  courseId: string;
  title: string;
  deadline: string | Date;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: { id: string; name: string }[];
  taskToEdit?: EditableTask | null;
}

export function TaskDialog({
  open,
  onOpenChange,
  courses,
  taskToEdit,
}: TaskDialogProps) {
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setErrors({});
      if (taskToEdit) {
        setCourseId(taskToEdit.courseId);
        setTitle(taskToEdit.title);
        setDeadline(toDateTimeLocalWib(taskToEdit.deadline));
      } else {
        setCourseId(courses[0]?.id ?? "");
        setTitle("");
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        setDeadline(toDateTimeLocalWib(tomorrow));
      }
    }
  }, [open, taskToEdit, courses]);

  const handleShiftDeadlineDays = (days: number) => {
    const baseDate = deadline ? parseWibDateTimeLocal(deadline) : new Date();
    const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const shifted = new Date(validBase.getTime() + days * 24 * 60 * 60 * 1000);
    setDeadline(toDateTimeLocalWib(shifted));
  };

  const handleSetTomorrow2359 = () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const datePrefix = toDateTimeLocalWib(tomorrow).slice(0, 10);
    setDeadline(`${datePrefix}T23:59`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    startTransition(async () => {
      if (taskToEdit) {
        const res = await updateTask({
          taskId: taskToEdit.id,
          courseId,
          title,
          deadline,
        });
        if (!res.ok) {
          if (res.errors) setErrors(res.errors);
          if (res.message) toast.error(res.message);
          return;
        }
        toast.success("Tugas berhasil diperbarui");
        onOpenChange(false);
      } else {
        const res = await createTask({
          courseId,
          title,
          deadline,
        });
        if (!res.ok) {
          if (res.errors) setErrors(res.errors);
          if (res.message) toast.error(res.message);
          return;
        }
        toast.success("Tugas ditambahkan");
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {taskToEdit ? "Edit Tugas" : "Tambah Tugas Baru"}
          </DialogTitle>
          <DialogDescription>
            Pilih mata kuliah, masukkan nama tugas, dan tentukan deadline (WIB).
          </DialogDescription>
        </DialogHeader>

        {courses.length === 0 ? (
          <div className="rounded-xl border p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Belum ada mata kuliah pada semester aktif ini.
            </p>
            <Button asChild size="sm">
              <Link href="/semesters">Tambah Mata Kuliah di Semester</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Mata Kuliah */}
            <div className="space-y-1.5">
              <Label htmlFor="courseId">1. Mata Kuliah</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger id="courseId">
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.courseId?.[0] && (
                <p className="text-xs text-red-600">{errors.courseId[0]}</p>
              )}
            </div>

            {/* 2. Nama Tugas */}
            <div className="space-y-1.5">
              <Label htmlFor="title">2. Nama Tugas</Label>
              <Input
                id="title"
                placeholder="Contoh: Laporan Praktikum Modul 3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {errors.title?.[0] && (
                <p className="text-xs text-red-600">{errors.title[0]}</p>
              )}
            </div>

            {/* 3. Deadline (datetime-local WIB) */}
            <div className="space-y-2">
              <Label htmlFor="deadline">3. Deadline (WIB)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-xs text-muted-foreground mr-1">
                  Pintasan:
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => handleShiftDeadlineDays(1)}
                >
                  +1 Hari
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => handleShiftDeadlineDays(3)}
                >
                  +3 Hari
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={handleSetTomorrow2359}
                >
                  Besok 23:59
                </Button>
              </div>
              {errors.deadline?.[0] && (
                <p className="text-xs text-red-600">{errors.deadline[0]}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Tugas"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
