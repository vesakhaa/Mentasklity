"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type StatusFilter =
  | "ALL"
  | "BELUM_DIKERJAKAN"
  | "DIKERJAKAN"
  | "SELESAI";

interface TaskFiltersProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  courseFilter: string;
  onCourseFilterChange: (value: string) => void;
  courses: { id: string; name: string }[];
  onAddClick: () => void;
}

export function TaskFilters({
  statusFilter,
  onStatusFilterChange,
  courseFilter,
  onCourseFilterChange,
  courses,
  onAddClick,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
        >
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="ALL">Semua</TabsTrigger>
            <TabsTrigger value="BELUM_DIKERJAKAN">Belum Dikerjakan</TabsTrigger>
            <TabsTrigger value="DIKERJAKAN">Dikerjakan</TabsTrigger>
            <TabsTrigger value="SELESAI">Selesai</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={courseFilter} onValueChange={onCourseFilterChange}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Semua Mata Kuliah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Mata Kuliah</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onAddClick} className="w-full sm:w-auto">
        <Plus className="mr-1.5 h-4 w-4" />
        Tambah Tugas
      </Button>
    </div>
  );
}
