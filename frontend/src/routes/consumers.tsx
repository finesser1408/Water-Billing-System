import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Plus, Eye, Pencil, Ban, Search } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/app-layout";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fmtDate } from "@/utils/billingCalculator";

export const Route = createFileRoute("/consumers")({
  component: () => <ProtectedRoute><ConsumersPage /></ProtectedRoute>,
});

const PAGE_SIZE = 20;

function ConsumersPage() {
  const consumers = useQuery(api.consumers.list) || [];
  const updateConsumer = useMutation(api.consumers.update);
  const createConsumer = useMutation(api.consumers.create);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return consumers;
    return consumers.filter((c: any) =>
      c.accountNumber.toLowerCase().includes(q) ||
      c.fullName.toLowerCase().includes(q) ||
      c.meterNumber.toLowerCase().includes(q),
    );
  }, [consumers, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setSheetOpen(true); };

  const save = async (data: any) => {
    try {
      const { connectionDate, ...payload } = data;
      if (editing) {
        // Strip out fields not supported by update mutation
        const updatePayload = {
          id: editing._id,
          status: payload.status,
          phoneNumber: payload.phoneNumber,
          email: payload.email,
        };
        await updateConsumer(updatePayload);
        toast.success("Consumer updated successfully");
      } else {
        if (consumers.some((c: any) => c.accountNumber === payload.accountNumber)) {
          toast.error("Account number must be unique"); return;
        }
        await createConsumer(payload);
        toast.success("Consumer added successfully");
      }
      setSheetOpen(false);
    } catch (error) {
      toast.error("Failed to save consumer");
    }
  };

  const deactivate = async () => {
    if (confirmId == null) return;
    try {
      await updateConsumer({ id: confirmId as any, status: "Inactive" });
      toast.success("Consumer deactivated");
      setConfirmId(null);
    } catch (error) {
      toast.error("Failed to deactivate consumer");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by account, name, or meter..."
            value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add New Consumer</Button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Account No.</th>
              <th className="text-left px-4 py-3 font-medium">Full Name</th>
              <th className="text-left px-4 py-3 font-medium">Ward</th>
              <th className="text-left px-4 py-3 font-medium">Meter No.</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                No consumers found. <button className="text-primary underline ml-1" onClick={openAdd}>Add the first one</button>.
              </td></tr>
            )}
            {pageRows.map((c: any) => (
              <tr key={c._id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-mono">{c.accountNumber}</td>
                <td className="px-4 py-3">{c.fullName}</td>
                <td className="px-4 py-3">Ward {c.wardId}</td>
                <td className="px-4 py-3 font-mono">{c.meterNumber}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewing(c)} className="inline-flex items-center gap-1 text-primary hover:underline mr-3" title="View"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1 text-primary hover:underline mr-3" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmId(c._id)} className="inline-flex items-center gap-1 text-destructive hover:underline" title="Deactivate"><Ban className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <span className="text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="px-2 py-1">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>

      <ConsumerSheet open={sheetOpen} onOpenChange={setSheetOpen} editing={editing} onSave={save}
        nextAccount={`ELB-${String(Math.max(0, ...consumers.map((c: any) => Number(c.accountNumber.split("-")[1]))) + 1).padStart(4, "0")}`} />

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Consumer Details</SheetTitle>
            <SheetDescription>{viewing?.accountNumber}</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="px-4 space-y-3 text-sm">
              <DetailRow label="Account Number" value={viewing.accountNumber} />
              <DetailRow label="Full Name" value={viewing.fullName} />
              <DetailRow label="Physical Address" value={viewing.address} />
              <DetailRow label="Ward" value={`Ward ${viewing.wardId}`} />
              <DetailRow label="Meter Number" value={viewing.meterNumber} />
              <DetailRow label="Connection Date" value={fmtDate(viewing.connectionDate)} />
              <DetailRow label="Status" value={<StatusBadge status={viewing.status} />} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmModal
        open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}
        title="Deactivate consumer?"
        message="This account will be marked Inactive and will no longer receive new bills until reactivated."
        confirmLabel="Deactivate" destructive onConfirm={deactivate}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function ConsumerSheet({ open, onOpenChange, editing, onSave, nextAccount }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  editing: any;
  onSave: (data: any) => void;
  nextAccount: string;
}) {
  const [form, setForm] = useState({
    accountNumber: "", fullName: "", address: "",
    wardId: 1, meterNumber: "", connectionDate: "", status: "Active" as string,
  });

  useEffect(() => {
    if (open) {
      setForm(editing
        ? { accountNumber: editing.accountNumber, fullName: editing.fullName, address: editing.address, wardId: editing.wardId, meterNumber: editing.meterNumber, connectionDate: editing.connectionDate, status: editing.status }
        : { accountNumber: nextAccount, fullName: "", address: "", wardId: 1, meterNumber: "", connectionDate: new Date().toISOString().slice(0, 10), status: "Active" });
    }
  }, [open, editing, nextAccount]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.address || !form.meterNumber || !form.connectionDate) {
      toast.error("All fields are required"); return;
    }
    onSave(form);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit Consumer" : "Add New Consumer"}</SheetTitle>
          <SheetDescription>{editing ? "Update details for this consumer." : "Create a new consumer account."}</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="px-4 space-y-4">
          <div>
            <Label>Account Number</Label>
            <Input value={form.accountNumber} readOnly disabled className="font-mono" />
          </div>
          <div>
            <Label>Full Name *</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <Label>Physical Address *</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
          <div>
            <Label>Ward *</Label>
            <Select value={String(form.wardId)} onValueChange={(v) => setForm({ ...form, wardId: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map((w) => <SelectItem key={w} value={String(w)}>Ward {w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Meter Number *</Label>
            <Input value={form.meterNumber} onChange={(e) => setForm({ ...form, meterNumber: e.target.value })} required />
          </div>
          <div>
            <Label>Connection Date *</Label>
            <Input type="date" value={form.connectionDate} onChange={(e) => setForm({ ...form, connectionDate: e.target.value })} required />
          </div>
          <div>
            <Label>Status *</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Disconnected">Disconnected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">{editing ? "Save Changes" : "Create Consumer"}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
