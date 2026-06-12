import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ProtectedRoute } from "@/components/app-layout";
import { BILLS, CONSUMERS } from "@/lib/mock-data";
import { fmtUSD } from "@/utils/billingCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/reports/revenue")({
  component: () => <ProtectedRoute allow={["Finance Manager"]}><RevenuePage /></ProtectedRoute>,
});

function RevenuePage() {
  const [cycle, setCycle] = useState("2026-05");
  const [status, setStatus] = useState("All");

  const enriched = useMemo(() => BILLS.map((b) => ({ ...b, consumer: CONSUMERS.find((c) => c.consumerId === b.consumerId)! })), []);
  const filtered = useMemo(() => enriched.filter((b) => (status === "All" || b.status === status)), [enriched, status]);

  const totals = useMemo(() => {
    const billed = filtered.reduce((s, b) => s + b.amountDue, 0);
    const collected = filtered.reduce((s, b) => s + b.amountPaid, 0);
    return { billed, collected, outstanding: billed - collected, rate: billed ? (collected / billed) * 100 : 0 };
  }, [filtered]);

  const byWard = useMemo(() => {
    const map = new Map<number, { ward: number; bills: number; billed: number; collected: number }>();
    for (const b of filtered) {
      const w = b.consumer.wardId;
      const row = map.get(w) ?? { ward: w, bills: 0, billed: 0, collected: 0 };
      row.bills += 1; row.billed += b.amountDue; row.collected += b.amountPaid;
      map.set(w, row);
    }
    return Array.from(map.values()).sort((a, b) => a.ward - b.ward).map((r) => ({ ...r, name: `Ward ${r.ward}`, outstanding: r.billed - r.collected }));
  }, [filtered]);

  const exportCSV = () => {
    const header = "Ward,Bills Issued,Total Billed (USD),Total Collected (USD),Outstanding (USD)\n";
    const rows = byWard.map((r) => `${r.ward},${r.bills},${r.billed.toFixed(2)},${r.collected.toFixed(2)},${r.outstanding.toFixed(2)}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `revenue-${cycle}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div><Label>Billing Cycle</Label><Input type="month" value={cycle} onChange={(e) => setCycle(e.target.value)} /></div>
        <div>
          <Label>Bill Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Partially Paid">Partially Paid</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={exportCSV} variant="outline"><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Billed" value={fmtUSD(totals.billed)} />
        <Stat label="Total Collected" value={fmtUSD(totals.collected)} accent="success" />
        <Stat label="Outstanding" value={fmtUSD(totals.outstanding)} accent="destructive" />
        <Stat label="Collection Rate" value={`${totals.rate.toFixed(1)}%`} accent="primary" />
      </div>



      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Ward</th>
              <th className="text-right px-4 py-2 font-medium">Bills Issued</th>
              <th className="text-right px-4 py-2 font-medium">Total Billed</th>
              <th className="text-right px-4 py-2 font-medium">Total Collected</th>
              <th className="text-right px-4 py-2 font-medium">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {byWard.map((r) => (
              <tr key={r.ward} className="border-t border-border">
                <td className="px-4 py-2">Ward {r.ward}</td>
                <td className="px-4 py-2 text-right">{r.bills}</td>
                <td className="px-4 py-2 text-right">{fmtUSD(r.billed)}</td>
                <td className="px-4 py-2 text-right text-success">{fmtUSD(r.collected)}</td>
                <td className="px-4 py-2 text-right text-destructive">{fmtUSD(r.outstanding)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "success" | "destructive" | "primary" }) {
  const color = accent === "success" ? "text-success" : accent === "destructive" ? "text-destructive" : accent === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
