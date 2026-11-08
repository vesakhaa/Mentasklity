import { CheckCircle2, Clock, ListTodo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TaskStatsProps {
  notStartedCount?: number;
  inProgressCount: number;
  completedCount: number;
  urgent24hCount: number;
}

export function TaskStats({
  notStartedCount = 0,
  inProgressCount,
  completedCount,
  urgent24hCount,
}: TaskStatsProps) {
  const activeTotal = notStartedCount + inProgressCount;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Tugas Aktif
            </p>
            <p className="mt-1 text-3xl font-bold">{activeTotal}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {notStartedCount} belum &bull; {inProgressCount} dikerjakan
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <ListTodo className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Selesai</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Deadline &lt; 24 Jam
            </p>
            <p className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">
              {urgent24hCount}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
