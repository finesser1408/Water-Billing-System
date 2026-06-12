import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/app-layout";
import { SYSTEM_LOGS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/logs")({
  component: () => <ProtectedRoute allow={["System Administrator"]}><LogsPage /></ProtectedRoute>,
});

function LogsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mod, setMod] = useState("All");

  const filtered = useMemo(() => SYSTEM_LOGS.filter((l) => {
    if (mod !== "All" && l.module !== mod) return false;
    if (from && l.ts < from) return false;
    if (to && l.ts > to + " 23:59") return false;
    return true;
  }), [from, to, mod]);

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div>
          <Label>Module</Label>
          <Select value={mod} onValueChange={setMod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["All", "Auth", "Meter Readings", "Payments", "Billing", "Tariff", "Users"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date/Time</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Module</th>
              <th className="text-left px-4 py-3 font-medium">Details</th>
              <th className="text-left px-4 py-3 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No logs match these filters.</td></tr>}
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">{l.ts}</td>
                <td className="px-4 py-2">{l.user}</td>
                <td className="px-4 py-2"><span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{l.action}</span></td>
                <td className="px-4 py-2">{l.module}</td>
                <td className="px-4 py-2 text-muted-foreground">{l.details}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
