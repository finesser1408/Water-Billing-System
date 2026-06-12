import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/app-layout";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { fmtUSD, fmtDate } from "@/utils/billingCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/payments")({
  component: () => <ProtectedRoute><PaymentsPage /></ProtectedRoute>,
});

type Method = "Cash" | "Bank Transfer" | "EcoCash" | "OneMoney";

function PaymentsPage() {
  const consumers = useQuery(api.consumers.list) || [];
  const bills = useQuery(api.bills.list) || [];
  const payments = useQuery(api.payments.list) || [];
  const createPayment = useMutation(api.payments.create);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<Method>("Cash");
  const [ref, setRef] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(query), 300); return () => clearTimeout(t); }, [query]);

  const results = useMemo(() => {
    const q = debounced.toLowerCase().trim();
    if (!q || selected) return [];
    return consumers.filter((c: any) => c.accountNumber.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q)).slice(0, 8);
  }, [debounced, selected, consumers]);

  const outstanding = useMemo(() => {
    if (!selected) return 0;
    const consumerBills = bills.filter((b: any) => b.consumer && b.consumer._id === selected._id);
    return consumerBills.reduce((s: number, b: any) => s + (b.amountDue || 0), 0);
  }, [selected, bills]);

  const history = useMemo(() => selected ? payments.filter((p: any) => p.consumer && p.consumer._id === selected._id) : [], [selected, payments]);

  useEffect(() => {
    if (amount && Number(amount) > outstanding) setWarning(`Amount exceeds outstanding balance of ${fmtUSD(outstanding)}`);
    else setWarning(null);
  }, [amount, outstanding]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !amount) { toast.error("Please complete all fields"); return; }
    if ((method === "EcoCash" || method === "OneMoney") && !ref) { toast.error("Reference number required for mobile money"); return; }
    if (warning) toast.warning(warning);
    try {
      await createPayment({
        paymentId: `PAY-${Date.now()}`,
        billId: selected._id,
        consumerId: selected._id,
        amount: Number(amount),
        paymentDate: date,
        paymentMethod: method,
        referenceNumber: ref || undefined,
        receivedBy: "current_user",
      });
      toast.success(`Payment recorded — new balance ${fmtUSD(Math.max(0, outstanding - Number(amount)))}`);
      setAmount(""); setRef("");
    } catch (error) {
      toast.error("Failed to record payment");
    }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search consumer by account number or name..."
          value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md shadow-lg">
            {results.map((c: any) => (
              <button key={c._id} onClick={() => { setSelected(c); setQuery(`${c.accountNumber} — ${c.fullName}`); }}
                className="w-full text-left px-3 py-2 hover:bg-muted text-sm">
                <span className="font-mono text-muted-foreground">{c.accountNumber}</span> · {c.fullName}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <>
          <div className="bg-surface border border-border rounded-lg p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{selected.accountNumber} · Ward {selected.wardId}</p>
              <p className="text-lg font-semibold">{selected.fullName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Outstanding Balance</p>
              <p className={`text-2xl font-bold ${outstanding > 0 ? "text-destructive" : "text-success"}`}>{fmtUSD(outstanding)}</p>
            </div>
          </div>

          <form onSubmit={submit} className="bg-surface border border-border rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Amount Paid (USD)</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              {warning && <p className="text-sm text-warning mt-1 px-2 py-1 bg-accent/10 border border-accent/30 rounded">{warning}</p>}
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="EcoCash">EcoCash</SelectItem>
                  <SelectItem value="OneMoney">OneMoney</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference Number {(method === "EcoCash" || method === "OneMoney") && "*"}</Label>
              <Input value={ref} onChange={(e) => setRef(e.target.value)}
                required={method === "EcoCash" || method === "OneMoney"} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Record Payment</Button>
            </div>
          </form>

          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold">Payment History</div>
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-right px-4 py-2 font-medium">Amount</th>
                  <th className="text-left px-4 py-2 font-medium">Method</th>
                  <th className="text-left px-4 py-2 font-medium">Reference</th>
                  <th className="text-left px-4 py-2 font-medium">Received By</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No payments on record.</td></tr>}
                {history.map((p: any) => (
                  <tr key={p._id} className="border-t border-border">
                    <td className="px-4 py-2">{fmtDate(p.paymentDate)}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmtUSD(p.amount)}</td>
                    <td className="px-4 py-2">{p.paymentMethod}</td>
                    <td className="px-4 py-2 font-mono text-xs">{p.referenceNumber || "-"}</td>
                    <td className="px-4 py-2">{p.receivedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
