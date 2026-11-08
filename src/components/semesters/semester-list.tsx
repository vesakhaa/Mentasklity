"use client";

import { useState, useTransition } from "react";
import {
  BookOpen,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  addCourse,
  createSemester,
  deleteCourse,
  deleteSemester,
  renameCourse,
  setActiveSemester,
} from "@/actions/semester";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { CourseFields } from "./course-fields";

export interface SemesterItem {
  id: string;
  number: number;
  academicYear: string;
  isActive: boolean;
  taskCount: number;
  courses: {
    id: string;
    name: string;
    taskCount: number;
  }[];
}

export function SemesterList({
  semesters,
}: {
  semesters: SemesterItem[];
}) {
  const [addSemesterOpen, setAddSemesterOpen] = useState(false);
  const [number, setNumber] = useState("1");
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [courses, setCourses] = useState<string[]>([""]);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const [manageSemester, setManageSemester] = useState<SemesterItem | null>(
    null
  );
  const [newCourseName, setNewCourseName] = useState("");
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseName, setEditingCourseName] = useState("");
  const [courseToDelete, setCourseToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [semesterToDelete, setSemesterToDelete] =
    useState<SemesterItem | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleCreateSemester = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    startTransition(async () => {
      const res = await createSemester({
        number: Number(number),
        academicYear,
        courses: courses.map((c) => c.trim()).filter(Boolean),
      });

      if (!res.ok) {
        if (res.errors) setFormErrors(res.errors);
        if (res.message) toast.error(res.message);
        return;
      }

      toast.success("Semester baru ditambahkan dan dijadikan aktif");
      setAddSemesterOpen(false);
      setCourses([""]);
    });
  };

  const handleActivate = (semesterId: string) => {
    startTransition(async () => {
      const res = await setActiveSemester(semesterId);
      if (!res.ok) {
        toast.error(res.message || "Gagal mengaktifkan semester");
        return;
      }
      toast.success("Semester aktif berhasil diubah");
    });
  };

  const handleConfirmDeleteSemester = () => {
    if (!semesterToDelete) return;
    startTransition(async () => {
      const res = await deleteSemester(semesterToDelete.id);
      if (!res.ok) {
        toast.error(res.message || "Gagal menghapus semester");
        return;
      }
      toast.success("Semester dihapus");
      setSemesterToDelete(null);
    });
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageSemester || !newCourseName.trim()) return;

    startTransition(async () => {
      const res = await addCourse({
        semesterId: manageSemester.id,
        name: newCourseName.trim(),
      });
      if (!res.ok) {
        toast.error(res.message || "Gagal menambah mata kuliah");
        return;
      }
      toast.success("Mata kuliah ditambahkan");
      setNewCourseName("");
    });
  };

  const handleRenameCourse = (courseId: string) => {
    if (!editingCourseName.trim()) return;
    startTransition(async () => {
      const res = await renameCourse({
        courseId,
        name: editingCourseName.trim(),
      });
      if (!res.ok) {
        toast.error(res.message || "Gagal mengubah nama mata kuliah");
        return;
      }
      toast.success("Nama mata kuliah diperbarui");
      setEditingCourseId(null);
    });
  };

  const handleDeleteCourse = () => {
    if (!courseToDelete) return;
    startTransition(async () => {
      const res = await deleteCourse(courseToDelete.id);
      if (!res.ok) {
        toast.error(res.message || "Gagal menghapus mata kuliah");
        return;
      }
      toast.success("Mata kuliah dihapus");
      setCourseToDelete(null);
    });
  };

  // Sinkronkan dialog manageSemester dengan prop semesters terbaru
  const currentManaged = manageSemester
    ? semesters.find((s) => s.id === manageSemester.id) ?? null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Semester</h1>
          <p className="text-sm text-muted-foreground">
            Atur semester aktif dan daftar mata kuliah setiap tahun ajaran.
          </p>
        </div>

        <Button onClick={() => setAddSemesterOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Tambah Semester
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {semesters.map((sem) => (
          <Card
            key={sem.id}
            className={
              sem.isActive
                ? "border-indigo-500/60 ring-1 ring-indigo-500/30"
                : ""
            }
          >
            <CardHeader className="flex flex-col justify-between gap-3 pb-3 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <CardTitle>
                    Semester {sem.number} &middot; {sem.academicYear}
                  </CardTitle>
                  {sem.isActive && <Badge variant="default">Aktif</Badge>}
                </div>
                <CardDescription>
                  {sem.courses.length} mata kuliah &middot; {sem.taskCount} tugas
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!sem.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActivate(sem.id)}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4 text-indigo-600" />
                    Jadikan Aktif
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setManageSemester(sem)}
                >
                  <BookOpen className="mr-1.5 h-4 w-4" />
                  Kelola Mata Kuliah
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={semesters.length <= 1 || isPending}
                  onClick={() => setSemesterToDelete(sem)}
                  className="text-muted-foreground hover:text-red-600"
                  title={
                    semesters.length <= 1
                      ? "Satu-satunya semester tidak bisa dihapus"
                      : "Hapus semester"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {sem.courses.map((c) => (
                  <Badge key={c.id} variant="secondary">
                    {c.name} ({c.taskCount})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Tambah Semester */}
      <Dialog open={addSemesterOpen} onOpenChange={setAddSemesterOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Semester Baru</DialogTitle>
            <DialogDescription>
              Semester baru akan otomatis menjadi semester aktif.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSemester} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Semester</Label>
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
                {formErrors.number?.[0] && (
                  <p className="text-xs text-red-600">{formErrors.number[0]}</p>
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
                {formErrors.academicYear?.[0] && (
                  <p className="text-xs text-red-600">
                    {formErrors.academicYear[0]}
                  </p>
                )}
              </div>
            </div>

            <CourseFields
              courses={courses}
              onChange={setCourses}
              error={formErrors.courses?.[0]}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddSemesterOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan & Aktifkan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Kelola Mata Kuliah */}
      <Dialog
        open={Boolean(currentManaged)}
        onOpenChange={(open) => !open && setManageSemester(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Mata Kuliah &mdash; Semester {currentManaged?.number} (
              {currentManaged?.academicYear})
            </DialogTitle>
            <DialogDescription>
              Tambah, ubah nama, atau hapus mata kuliah pada semester ini.
            </DialogDescription>
          </DialogHeader>

          {currentManaged && (
            <div className="space-y-4">
              <form onSubmit={handleAddCourse} className="flex gap-2">
                <Input
                  placeholder="Tambah mata kuliah baru..."
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                />
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    !newCourseName.trim() ||
                    currentManaged.courses.length >= 15
                  }
                >
                  Tambah
                </Button>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentManaged.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between gap-2 rounded-xl border p-2.5"
                  >
                    {editingCourseId === course.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editingCourseName}
                          onChange={(e) =>
                            setEditingCourseName(e.target.value)
                          }
                          className="h-8"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleRenameCourse(course.id)}
                          disabled={isPending}
                        >
                          Simpan
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCourseId(null)}
                        >
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm font-medium">{course.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.taskCount} tugas
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingCourseId(course.id);
                              setEditingCourseName(course.name);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            disabled={currentManaged.courses.length <= 1}
                            onClick={() =>
                              setCourseToDelete({
                                id: course.id,
                                name: course.name,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Konfirmasi Hapus Mata Kuliah */}
      <AlertDialog
        open={Boolean(courseToDelete)}
        onOpenChange={(open) => !open && setCourseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Kuliah?</AlertDialogTitle>
            <AlertDialogDescription>
              Menghapus mata kuliah <strong>{courseToDelete?.name}</strong> akan
              ikut menghapus <strong>semua tugas</strong> di dalamnya secara
              permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Mata Kuliah
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi Hapus Semester */}
      <AlertDialog
        open={Boolean(semesterToDelete)}
        onOpenChange={(open) => !open && setSemesterToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semester?</AlertDialogTitle>
            <AlertDialogDescription>
              Semester {semesterToDelete?.number} (
              {semesterToDelete?.academicYear}) beserta seluruh mata kuliah dan
              tugas di dalamnya akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSemester}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Semester
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
