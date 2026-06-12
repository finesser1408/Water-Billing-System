import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Eye, Printer, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/app-layout";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmModal } from "@/components/confirm-modal";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "convex/react";
import { api } from "@convex/api";
import { calculateBill, fmtUSD, fmtDate } from "@/utils/billingCalculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CONSUMERS, BILLS, type Bill } from "@/lib/mock-data";

export const Route = createFileRoute("/billing")({
  component: () => <ProtectedRoute><BillingPage /></ProtectedRoute>,
});

const PAGE_SIZE = 20;

function BillingPage() {
  const { user } = useAuth();
  const dbBills = useQuery(api.bills.list) || [];
  const dbConsumers = useQuery(api.consumers.list) || [];
  
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<any | null>(null);
  const [confirmGen, setConfirmGen] = useState(false);

  const enriched = useMemo(() => {
    return dbBills.map((b: any) => {
      const c = dbConsumers.find((c: any) => c._id === b.consumerId) || {
        accountNumber: "N/A",
        fullName: "Unknown",
        wardId: 0,
        address: "N/A",
        meterNumber: "N/A"
      };
      return { ...b, consumer: c };
    });
  }, [dbBills, dbConsumers]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return enriched;
    return enriched.filter((b) => b.consumer.accountNumber.toLowerCase().includes(q) || b.consumer.fullName.toLowerCase().includes(q));
  }, [enriched, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search bills..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        </div>
        {user?.role === "Finance Manager" && (
          <Button onClick={() => setConfirmGen(true)}><FileText className="w-4 h-4 mr-1" /> Generate Bills</Button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Account No.</th>
              <th className="text-left px-4 py-3 font-medium">Consumer</th>
              <th className="text-left px-4 py-3 font-medium">Ward</th>
              <th className="text-right px-4 py-3 font-medium">Consumption</th>
              <th className="text-right px-4 py-3 font-medium">Amount Due</th>
              <th className="text-left px-4 py-3 font-medium">Due Date</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No bills found.</td></tr>}
            {rows.map((b) => (
              <tr key={b.billId} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-mono">{b.consumer.accountNumber}</td>
                <td className="px-4 py-3">{b.consumer.fullName}</td>
                <td className="px-4 py-3">Ward {b.consumer.wardId}</td>
                <td className="px-4 py-3 text-right">{b.consumption} kL</td>
                <td className="px-4 py-3 text-right font-medium">{fmtUSD(b.amountDue)}</td>
                <td className="px-4 py-3">{fmtDate(b.dueDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewing(b)} className="text-primary hover:underline mr-3" title="View"><Eye className="w-4 h-4 inline" /></button>
                  <button onClick={() => { setViewing(b); setTimeout(() => window.print(), 100); }} className="text-primary hover:underline" title="Print"><Printer className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <span className="text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>

      <BillModal bill={viewing} onClose={() => setViewing(null)} />

      <ConfirmModal open={confirmGen} onOpenChange={setConfirmGen}
        title="Generate bills for current cycle?"
        message="This will generate bills for all active consumers with submitted meter readings. This action cannot be undone."
        confirmLabel="Generate"
        onConfirm={() => { toast.success("Bills generated successfully for June 2026 cycle"); setConfirmGen(false); }} />
    </div>
  );
}

function BillModal({ bill, onClose }: { bill: any; onClose: () => void }) {
  if (!bill) return null;
  const c = bill.consumer;
  const breakdown = calculateBill(bill.consumption);
  return (
    <Dialog open={!!bill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="print-area p-8 bg-white text-black">
          <div className="text-center border-b-2 border-primary pb-4 mb-6">
            <h1 className="text-2xl font-bold text-primary">EPWORTH LOCAL BOARD</h1>
            <h2 className="text-lg font-semibold">WATER BILLING STATEMENT</h2>
            <p className="text-sm mt-1">P.O. Box 14, Epworth, Harare · Tel: +263 242 570 121 · billing@epworth.gov.zw</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <section>
              <h3 className="text-xs uppercase font-bold text-gray-600 mb-2">Consumer</h3>
              <p><strong>Account No:</strong> {c.accountNumber}</p>
              <p><strong>Name:</strong> {c.fullName}</p>
              <p><strong>Address:</strong> {c.address}</p>
              <p><strong>Ward:</strong> Ward {c.wardId}</p>
              <p><strong>Meter No:</strong> {c.meterNumber}</p>
            </section>
            <section>
              <h3 className="text-xs uppercase font-bold text-gray-600 mb-2">Billing</h3>
              <p><strong>Period:</strong> {bill.billingPeriod}</p>
              <p><strong>Previous Reading:</strong> {bill.prevReading} kL</p>
              <p><strong>Current Reading:</strong> {bill.currReading} kL</p>
              <p><strong>Consumption:</strong> {bill.consumption} kL</p>
              <p><strong>Payment Ref:</strong> PAY-{c.accountNumber}-{bill.billingPeriod.replace("-", "")}</p>
            </section>
          </div>

          <h3 className="text-xs uppercase font-bold text-gray-600 mb-2">Charges</h3>
          <table className="w-full text-sm border border-gray-300 mb-4">
            <thead className="bg-gray-100">
              <tr><th className="text-left p-2 border-b border-gray-300">Description</th><th className="text-right p-2 border-b border-gray-300">Units</th><th className="text-right p-2 border-b border-gray-300">Amount</th></tr>
            </thead>
            <tbody>
              <tr><td className="p-2">Tier 1 (1–5 kL @ USD 0.80)</td><td className="p-2 text-right">{breakdown.tier1Units}</td><td className="p-2 text-right">{fmtUSD(breakdown.tier1Amount)}</td></tr>
              <tr><td className="p-2">Tier 2 (6–15 kL @ USD 1.20)</td><td className="p-2 text-right">{breakdown.tier2Units}</td><td className="p-2 text-right">{fmtUSD(breakdown.tier2Amount)}</td></tr>
              <tr><td className="p-2">Tier 3 (above 15 kL @ USD 1.80)</td><td className="p-2 text-right">{breakdown.tier3Units}</td><td className="p-2 text-right">{fmtUSD(breakdown.tier3Amount)}</td></tr>
              <tr><td className="p-2">Fixed Service Charge</td><td></td><td className="p-2 text-right">{fmtUSD(breakdown.serviceCharge)}</td></tr>
              <tr className="font-bold bg-gray-50"><td className="p-2 border-t-2 border-gray-400">TOTAL AMOUNT DUE</td><td></td><td className="p-2 text-right border-t-2 border-gray-400">{fmtUSD(breakdown.total)}</td></tr>
            </tbody>
          </table>

          <div className="bg-amber-50 border border-amber-300 p-3 mb-4 text-sm">
            <strong>Payment Due Date:</strong> {fmtDate(bill.dueDate)}
          </div>

          <div className="text-sm mb-4">
            <h3 className="font-bold mb-1">Payment Methods</h3>
            <ul className="list-disc list-inside">
              <li>Cash at Finance Office, Epworth Local Board</li>
              <li>EcoCash: *151*2*ELB# (Merchant 35422)</li>
              <li>OneMoney: *111*ELB# (Merchant 22011)</li>
            </ul>
          </div>

          <p className="text-xs text-center text-gray-500 border-t border-gray-300 pt-3">
            This bill was generated by Aqua Flow — Epworth Local Board
          </p>
        </div>

        <div className="no-print p-4 border-t border-border flex justify-end gap-2 bg-muted/30">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Print</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
