import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Ban, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/app-layout";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { USERS_MOCK } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/users")({
  component: () => <ProtectedRoute allow={["System Administrator"]}><UsersAdmin /></ProtectedRoute>,
});

function UsersAdmin() {
  const [users, setUsers] = useState(USERS_MOCK);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [form, setForm] = useState({ username: "", fullName: "", role: "Billing Officer", tempPassword: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.fullName || !form.tempPassword) { toast.error("All fields required"); return; }
    setUsers((u) => [...u, { id: u.length + 1, ...form, status: "Active", lastLogin: "—" }]);
    toast.success("User created");
    setSheetOpen(false);
    setForm({ username: "", fullName: "", role: "Billing Officer", tempPassword: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setSheetOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add User</Button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Username</th>
              <th className="text-left px-4 py-3 font-medium">Full Name</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Last Login</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono">{u.username}</td>
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{u.lastLogin}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button className="text-primary hover:underline" title="Edit"><Pencil className="w-4 h-4 inline" /></button>
                  <button className="text-primary hover:underline" title="Reset Password" onClick={() => toast.success(`Temporary password sent for ${u.username}`)}><KeyRound className="w-4 h-4 inline" /></button>
                  <button className="text-destructive hover:underline" title="Deactivate" onClick={() => setConfirmId(u.id)}><Ban className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add User</SheetTitle>
            <SheetDescription>Create a new system user account.</SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} className="px-4 space-y-4">
            <div><Label>Username *</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
            <div><Label>Full Name *</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
            <div>
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Billing Officer">Billing Officer</SelectItem>
                  <SelectItem value="Finance Clerk">Finance Clerk</SelectItem>
                  <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                  <SelectItem value="System Administrator">System Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Temporary Password *</Label><Input type="text" value={form.tempPassword} onChange={(e) => setForm({ ...form, tempPassword: e.target.value })} required /></div>
            <Button type="submit" className="w-full">Create User</Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmModal open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}
        title="Deactivate user?" message="This user will no longer be able to sign in."
        confirmLabel="Deactivate" destructive
        onConfirm={() => {
          setUsers((us) => us.map((u) => u.id === confirmId ? { ...u, status: "Inactive" } : u));
          toast.success("User deactivated"); setConfirmId(null);
        }} />
    </div>
  );
}
