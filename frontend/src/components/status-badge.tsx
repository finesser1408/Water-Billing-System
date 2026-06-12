
import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  Active: "bg-success/15 text-success border-success/30",
  Inactive: "bg-muted text-muted-foreground border-border",
  Disconnected: "bg-destructive/15 text-destructive border-destructive/30",
  Paid: "bg-success/15 text-success border-success/30",
  Unpaid: "bg-accent/20 text-foreground border-accent/40",
  "Partially Paid": "bg-blue-100 text-blue-800 border-blue-300",
  Overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", MAP[status] ?? "bg-muted text-muted-foreground border-border")}>
      {status}
    </span>
  );
}
