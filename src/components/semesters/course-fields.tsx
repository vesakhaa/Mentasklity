"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CourseFieldsProps {
  courses: string[];
  onChange: (courses: string[]) => void;
  error?: string;
}

export function CourseFields({ courses, onChange, error }: CourseFieldsProps) {
  const handleCourseChange = (index: number, value: string) => {
    const updated = [...courses];
    updated[index] = value;
    onChange(updated);
  };

  const handleAddRow = () => {
    if (courses.length >= 15) return;
    onChange([...courses, ""]);
  };

  const handleRemoveRow = (index: number) => {
    if (courses.length <= 1) return;
    onChange(courses.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Daftar Mata Kuliah ({courses.length}/15)</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          disabled={courses.length >= 15}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Tambah Mata Kuliah
        </Button>
      </div>

      <div className="space-y-2.5 max-h-64 overflow-y-auto px-1.5 py-1.5 -mx-1.5">
        {courses.map((course, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              placeholder={`Mata kuliah ke-${idx + 1} (contoh: Struktur Data)`}
              value={course}
              onChange={(e) => handleCourseChange(idx, e.target.value)}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveRow(idx)}
              disabled={courses.length <= 1}
              className="shrink-0 text-muted-foreground hover:text-red-600"
              aria-label="Hapus baris mata kuliah"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
