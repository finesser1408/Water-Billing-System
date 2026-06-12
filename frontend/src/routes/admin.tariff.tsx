import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/app-layout";
import { ConfirmModal } from "@/components/confirm-modal";
import { DEFAULT_TARIFF, calculateBill, fmtUSD } from "@/utils/billingCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/tariff")({
  component: () => <ProtectedRoute allow={["System Administrator"]}><TariffPage /></ProtectedRoute>,
});

function TariffPage() {
  const [active] = useState(DEFAULT_TARIFF);
  const [form, setForm] = useState({ ...DEFAULT_TARIFF, effectiveDate: "2026-07-01" });
  const [confirm, setConfirm] = useState(false);

  const preview = calculateBill(20, form);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="font-semibold mb-3">Current Active Tariff</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Info label="Tier 1 (1–5 kL)" value={fmtUSD(active.tier1) + "/kL"} />
          <Info label="Tier 2 (6–15 kL)" value={fmtUSD(active.tier2) + "/kL"} />
          <Info label="Tier 3 (>15 kL)" value={fmtUSD(active.tier3) + "/kL"} />
          <Info label="Service Charge" value={fmtUSD(active.serviceCharge) + "/mo"} />
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setConfirm(true); }} className="bg-surface border border-border rounded-lg p-5 space-y-4">
        <h3 className="font-semibold">Configure New Tariff</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Tier 1 Rate (USD/kL) — first 5 kL</Label><Input type="number" step="0.01" value={form.tier1} onChange={(e) => setForm({ ...form, tier1: Number(e.target.value) })} required /></div>
          <div><Label>Tier 2 Rate (USD/kL) — 6 to 15 kL</Label><Input type="number" step="0.01" value={form.tier2} onChange={(e) => setForm({ ...form, tier2: Number(e.target.value) })} required /></div>
          <div><Label>Tier 3 Rate (USD/kL) — above 15 kL</Label><Input type="number" step="0.01" value={form.tier3} onChange={(e) => setForm({ ...form, tier3: Number(e.target.value) })} required /></div>
          <div><Label>Monthly Service Charge (USD)</Label><Input type="number" step="0.01" value={form.serviceCharge} onChange={(e) => setForm({ ...form, serviceCharge: Number(e.target.value) })} required /></div>
          <div><Label>Effective Date</Label><Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} required /></div>
        </div>

        <div className="bg-accent/10 border border-accent/30 rounded-md p-3 text-sm">
          <strong>Live preview:</strong> A consumer using 20 kL would be billed <strong className="text-primary">{fmtUSD(preview.total)}</strong>.
        </div>

        <Button type="submit">Save New Tariff</Button>
      </form>

      <ConfirmModal open={confirm} onOpenChange={setConfirm}
        title="Save new tariff?"
        message="This new tariff will apply to all future billing cycles starting from the effective date. Existing bills will not be affected."
        confirmLabel="Save Tariff"
        onConfirm={() => { toast.success("New tariff saved successfully"); setConfirm(false); }} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-md p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-semibold mt-0.5">{value}</p>
    </div>
  );
}
