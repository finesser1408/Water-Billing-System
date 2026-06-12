import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Search, Gauge } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/app-layout";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { calculateBill, fmtUSD } from "@/utils/billingCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/meter-readings")({
  component: () => <ProtectedRoute><MeterReadings /></ProtectedRoute>,
});

function MeterReadings() {
  const consumers = useQuery(api.consumers.list) || [];
  const createReading = useMutation(api.meterReadings.create);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [currReading, setCurrReading] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const q = debounced.toLowerCase().trim();
    if (!q || selected) return [];
    return consumers.filter((c: any) =>
      c.status === "Active" &&
      (c.accountNumber.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [debounced, selected, consumers]);

  const prevReading = selected ? (selected.prevReading || 0) : 0;
  const consumption = selected && currReading ? Number(currReading) - prevReading : 0;
  const preview = consumption > 0 ? calculateBill(consumption) : null;

  const onBlurReading = () => {
    if (!selected || !currReading) return;
    const n = Number(currReading);
    if (isNaN(n) || n <= prevReading) {
      setError(`Current reading must exceed previous reading (${prevReading} kL)`);
    } else setError(null);
  };

  const confirm = async () => {
    if (!selected || !preview || error) return;
    try {
      await createReading({
        consumerId: selected._id,
        readingDate: new Date().toISOString().slice(0, 10),
        previousReading: prevReading,
        currentReading: Number(currReading),
        consumption,
        readBy: "current_user",
      });
      toast.success(`Reading saved successfully — bill USD ${preview.total.toFixed(2)}`);
      setSelected(null); setCurrReading(""); setQuery(""); setDebounced("");
    } catch (err) {
      toast.error("Failed to save reading");
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search consumer by account number or name..."
          value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md shadow-lg overflow-hidden">
            {results.map((c) => (
              <button key={c.consumerId}
                onClick={() => { setSelected(c); setQuery(`${c.accountNumber} — ${c.fullName}`); }}
                className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between">
                <span><span className="font-mono text-muted-foreground">{c.accountNumber}</span> · {c.fullName}</span>
                <span className="text-muted-foreground">Ward {c.wardId}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="bg-surface border border-border rounded-lg p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-border">
            <Info label="Consumer" value={selected.fullName} />
            <Info label="Account No." value={selected.accountNumber} mono />
            <Info label="Ward" value={`Ward ${selected.wardId}`} />
            <Info label="Previous Reading" value={`${prevReading} kL`} />
            <Info label="Historical Avg." value={`${selected.avgConsumption || "N/A"} kL/month`} />
            <Info label="Meter No." value={selected.meterNumber} mono />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="curr">Current Reading (kL)</Label>
              <Input id="curr" type="number" value={currReading}
                onChange={(e) => setCurrReading(e.target.value)} onBlur={onBlurReading}
                min={prevReading + 1} />
              {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
            <div>
              <Label>Calculated Consumption</Label>
              <div className="h-9 px-3 flex items-center rounded-md bg-muted border border-border font-medium">
                {consumption > 0 ? `${consumption} kL` : "—"}
              </div>
            </div>
          </div>

          {preview && (
            <div className="bg-muted/40 border border-border rounded-md p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2"><Gauge className="w-4 h-4" /> Estimated Bill Preview</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="py-1">Tier 1 — first 5 kL @ USD 0.80</td><td className="text-right">{preview.tier1Units} kL</td><td className="text-right">{fmtUSD(preview.tier1Amount)}</td></tr>
                  <tr><td className="py-1">Tier 2 — 6–15 kL @ USD 1.20</td><td className="text-right">{preview.tier2Units} kL</td><td className="text-right">{fmtUSD(preview.tier2Amount)}</td></tr>
                  <tr><td className="py-1">Tier 3 — above 15 kL @ USD 1.80</td><td className="text-right">{preview.tier3Units} kL</td><td className="text-right">{fmtUSD(preview.tier3Amount)}</td></tr>
                  <tr><td className="py-1">Fixed Service Charge</td><td></td><td className="text-right">{fmtUSD(preview.serviceCharge)}</td></tr>
                  <tr className="border-t border-border font-bold"><td className="pt-2">Total</td><td></td><td className="text-right pt-2 text-primary">{fmtUSD(preview.total)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={confirm} disabled={!preview || !!error}>Confirm Reading</Button>
            <Button variant="outline" onClick={() => { setSelected(null); setCurrReading(""); setQuery(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {!selected && !query && (
        <div className="text-center py-16 text-muted-foreground bg-surface border border-dashed border-border rounded-lg">
          <Gauge className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>Start by searching for a consumer to enter a meter reading.</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`font-medium mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
