import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Grid2X2, Flame, CalendarClock, Users, Archive } from "lucide-react";

import type { Task } from "@/features/tasks/task.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export interface DashboardPriorityMatrixProps {
  tasks: Task[];
}

export function DashboardPriorityMatrix({ tasks }: DashboardPriorityMatrixProps) {
  const navigate = useNavigate();

  const quadrants = useMemo(() => {
    const active = tasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "ARCHIVED",
    );

    const doFirst = active.filter(
      (t) => t.priority === "URGENT" || (t.priority === "HIGH" && Boolean(t.dueDate)),
    );
    const schedule = active.filter(
      (t) => t.priority === "HIGH" && !t.dueDate,
    );
    const delegate = active.filter((t) => t.priority === "MEDIUM");
    const backlog = active.filter((t) => t.priority === "LOW");

    return [
      {
        title: "Do First",
        count: doFirst.length,
        badge: doFirst[0]?.title ?? "Urgent & due",
        icon: Flame,
        pillClass: "bg-primary text-primary-foreground",
        filter: "/tasks?priority=URGENT",
      },
      {
        title: "Schedule",
        count: schedule.length,
        badge: schedule[0]?.title ?? "Plan focus time",
        icon: CalendarClock,
        pillClass: "bg-primary/15 text-primary ring-1 ring-primary/25",
        filter: "/tasks?priority=HIGH",
      },
      {
        title: "Delegate",
        count: delegate.length,
        badge: delegate[0]?.title ?? "Medium priority",
        icon: Users,
        pillClass: "bg-secondary text-secondary-foreground",
        filter: "/tasks?priority=MEDIUM",
      },
      {
        title: "Backlog",
        count: backlog.length,
        badge: backlog[0]?.title ?? "Low priority",
        icon: Archive,
        pillClass: "bg-muted text-muted-foreground",
        filter: "/tasks?priority=LOW",
      },
    ];
  }, [tasks]);

  return (
    <Card className="rounded-xl border-border/70 bg-card shadow-2xs">
      <CardHeader className="p-3 sm:p-3.5 pb-2 flex flex-row items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md bg-primary/15 flex items-center justify-center text-primary">
            <Grid2X2 className="size-3" />
          </div>
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
            Priority Matrix
          </CardTitle>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">Live 2×2</span>
      </CardHeader>

      <CardContent className="p-3 sm:p-3.5 grid grid-cols-2 gap-2">
        {quadrants.map(({ title, count, badge, icon: Icon, pillClass, filter }) => (
          <button
            key={title}
            type="button"
            onClick={() => navigate(filter)}
            className="group flex flex-col justify-between gap-2 rounded-lg border border-border/60 bg-background/60 p-2.5 text-left transition-all hover:border-primary/45 hover:bg-accent/50 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Icon className="size-3 text-primary" />
                {title}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                {count}
              </span>
            </div>
            <span
              className={`inline-block w-full truncate rounded-md px-2 py-1 text-[10px] font-medium ${pillClass}`}
            >
              {badge}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

export default DashboardPriorityMatrix;
