import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { ProtectedRoute } from "@/components/app-layout";
import { useQuery, api } from "@/lib/api-client";
import { fmtUSD, fmtDate } from "@/utils/billingCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reports/collection")({
  component: () => <ProtectedRoute allow={["Finance Manager"]}><CollectionPage /></ProtectedRoute>,
});

const COLORS = ["var(--color-primary)", "var(--color-secondary)", "var(--color-accent)", "var(--color-chart-5)"];

function CollectionPage() {
  const [from, setFrom] = useState("2026-06-01");
  const [to, setTo] = useState("2026-06-30");
  const allPayments = useQuery(api.payments.list) || [];
  const allConsumers = useQuery(api.consumers.list) || [];

  const filtered = useMemo(() => allPayments.filter((p: any) => p.paymentDate >= from && p.paymentDate <= to), [allPayments, from, to]);
  const byMethod = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of filtered) m.set(p.paymentMethod, (m.get(p.paymentMethod) ?? 0) + (p.amount || 0));
    return Array.from(m.entries()).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [filtered]);

  const exportCSV = () => {
    const header = "Date,Account No,Consumer,Amount,Method,Reference,Received By\n";
    const rows = filtered.map((p: any) => {
      const c = allConsumers.find((c: any) => c._id === p.consumerId) || { accountNumber: "N/A", fullName: "Unknown" };
      return `${p.paymentDate},${c.accountNumber},"${c.fullName}",${(p.amount || 0).toFixed(2)},${p.paymentMethod},${p.referenceNumber || ""},"${p.receivedBy}"`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `collections-${from}-to-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div><Label>From Date</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>To Date</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="md:col-span-2 flex justify-end">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="font-semibold mb-4">Payment Method Breakdown</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byMethod} dataKey="value" nameKey="name" outerRadius={100} label={(e) => `${e.name}: ${fmtUSD(e.value as number)}`}>
                {byMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtUSD(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Date</th>
              <th className="text-left px-4 py-2 font-medium">Account No.</th>
              <th className="text-left px-4 py-2 font-medium">Consumer</th>
              <th className="text-right px-4 py-2 font-medium">Amount</th>
              <th className="text-left px-4 py-2 font-medium">Method</th>
              <th className="text-left px-4 py-2 font-medium">Reference</th>
              <th className="text-left px-4 py-2 font-medium">Received By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No payments in this range.</td></tr>}
            {filtered.map((p: any) => {
              const c = allConsumers.find((c: any) => c._id === p.consumerId) || { accountNumber: "N/A", fullName: "Unknown" };
              return (
                <tr key={p._id} className="border-t border-border">
                  <td className="px-4 py-2">{fmtDate(p.paymentDate)}</td>
                  <td className="px-4 py-2 font-mono">{c.accountNumber}</td>
                  <td className="px-4 py-2">{c.fullName}</td>
                  <td className="px-4 py-2 text-right font-medium">{fmtUSD(p.amount || 0)}</td>
                  <td className="px-4 py-2">{p.paymentMethod}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.referenceNumber || "-"}</td>
                  <td className="px-4 py-2">{p.receivedBy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
