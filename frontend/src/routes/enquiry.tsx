import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Search, Printer } from "lucide-react";
import { ProtectedRoute } from "@/components/app-layout";
import { CONSUMERS, BILLS, PAYMENTS, type Consumer } from "@/lib/mock-data";
import { fmtUSD, fmtDate } from "@/utils/billingCalculator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/enquiry")({
  component: () => <ProtectedRoute><EnquiryPage /></ProtectedRoute>,
});

function EnquiryPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<Consumer | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(query), 300); return () => clearTimeout(t); }, [query]);

  const results = useMemo(() => {
    const q = debounced.toLowerCase().trim();
    if (!q || selected) return [];
    return CONSUMERS.filter((c) => c.accountNumber.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q)).slice(0, 8);
  }, [debounced, selected]);

  const data = useMemo(() => {
    if (!selected) return null;
    const bills = BILLS.filter((b) => b.consumerId === selected.consumerId);
    const payments = PAYMENTS.filter((p) => p.consumerId === selected.consumerId);
    const outstanding = bills.reduce((s, b) => s + (b.amountDue - b.amountPaid), 0);
    const overdue = bills.some((b) => b.status === "Overdue");
    const txns = [
      ...bills.map((b) => ({ date: b.dueDate, type: "Bill", desc: `Bill ${b.billingPeriod}`, amount: b.amountDue, sign: +1 })),
      ...payments.map((p) => ({ date: p.paymentDate, type: "Payment", desc: `${p.paymentMethod} · ${p.referenceNumber}`, amount: p.amountPaid, sign: -1 })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    const withBalance = txns.map((t) => { running += t.sign * t.amount; return { ...t, balance: running }; });
    return { bills, payments, outstanding, overdue, txns: withBalance };
  }, [selected]);

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by account number or consumer name..."
          value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md shadow-lg">
            {results.map((c) => (
              <button key={c.consumerId} onClick={() => { setSelected(c); setQuery(`${c.accountNumber} — ${c.fullName}`); }}
                className="w-full text-left px-3 py-2 hover:bg-muted text-sm">
                <span className="font-mono text-muted-foreground">{c.accountNumber}</span> · {c.fullName}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && data && (
        <div className="print-area">
          <div className="bg-surface border border-border rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <h2 className="text-xl font-semibold">{selected.fullName}</h2>
              <p className="text-sm text-muted-foreground">{selected.accountNumber} · {selected.meterNumber}</p>
              <p className="text-sm">{selected.address}</p>
              <p className="text-sm">Ward {selected.wardId} · <StatusBadge status={selected.status} /></p>
            </div>
            <div className="text-right md:border-l md:border-border md:pl-4">
              <p className="text-xs uppercase text-muted-foreground">Outstanding Balance</p>
              <p className={`text-3xl font-bold ${data.overdue && data.outstanding > 0 ? "text-destructive" : "text-foreground"}`}>
                {fmtUSD(data.outstanding)}
              </p>
              {data.overdue && data.outstanding > 0 && <p className="text-xs text-destructive font-medium mt-1">Overdue</p>}
              <Button size="sm" variant="outline" className="mt-3 no-print" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1" /> Print Statement
              </Button>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg overflow-hidden mt-4">
            <div className="px-4 py-3 border-b border-border font-semibold">Transaction History</div>
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                  <th className="text-right px-4 py-2 font-medium">Amount (USD)</th>
                  <th className="text-right px-4 py-2 font-medium">Balance (USD)</th>
                </tr>
              </thead>
              <tbody>
                {data.txns.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No transactions.</td></tr>}
                {data.txns.map((t, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2">{fmtDate(t.date)}</td>
                    <td className="px-4 py-2">{t.type}</td>
                    <td className="px-4 py-2">{t.desc}</td>
                    <td className={`px-4 py-2 text-right font-medium ${t.sign > 0 ? "text-foreground" : "text-success"}`}>
                      {t.sign > 0 ? "+" : "-"}{t.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">{t.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
