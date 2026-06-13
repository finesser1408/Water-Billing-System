import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Ban, KeyRound, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, api } from "@/lib/api-client";
import { ProtectedRoute } from "@/components/app-layout";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/users")({
  component: () => (
    <ProtectedRoute allow={["System Administrator"]}>
      <UsersAdmin />
    </ProtectedRoute>
  ),
});

const ROLES = [
  "Billing Officer",
  "Finance Clerk",
  "Finance Manager",
  "System Administrator",
] as const;

function UsersAdmin() {
  // ── Convex ──────────────────────────────────────────────────────────────
  const users = useQuery(api.users.list) ?? [];
  const createUser = useMutation(api.users.create);
  const deactivateUser = useMutation(api.users.deactivate);
  const reactivateUser = useMutation(api.users.reactivate);
  const resetPassword = useMutation(api.users.resetPassword);

  // ── Create sheet ────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    role: "Billing Officer" as string,
    password: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.fullName || !form.password) {
      toast.error("All fields are required");
      return;
    }
    setCreateBusy(true);
    try {
      await createUser({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        fullName: form.fullName.trim(),
      });
      toast.success(`User "${form.username}" created successfully`);
      setCreateOpen(false);
      setForm({ username: "", fullName: "", role: "Billing Officer", password: "" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create user");
    } finally {
      setCreateBusy(false);
    }
  };

  // ── Reset password sheet ─────────────────────────────────────────────────
  const [resetUser, setResetUser] = useState<{ id: string; username: string } | null>(null);
  const [newPw, setNewPw] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPw) return;
    setResetBusy(true);
    try {
      await resetPassword({ id: resetUser.id as any, newPassword: newPw });
      toast.success(`Password reset for "${resetUser.username}"`);
      setResetUser(null);
      setNewPw("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reset password");
    } finally {
      setResetBusy(false);
    }
  };

  // ── Deactivate / Reactivate confirms ────────────────────────────────────
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [reactivateId, setReactivateId] = useState<string | null>(null);

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await deactivateUser({ id: deactivateId as any });
      toast.success("User deactivated");
    } catch {
      toast.error("Failed to deactivate user");
    }
    setDeactivateId(null);
  };

  const handleReactivate = async () => {
    if (!reactivateId) return;
    try {
      await reactivateUser({ id: reactivateId as any });
      toast.success("User reactivated");
    } catch {
      toast.error("Failed to reactivate user");
    }
    setReactivateId(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add User
        </Button>
      </div>

      {/* Users table */}
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
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u: any) => (
              <tr key={u._id} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono">{u.username}</td>
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.status ?? "Active"} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.lastLogin ?? "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {/* Reset password — always available */}
                  <button
                    className="text-primary hover:text-primary/80 transition-colors"
                    title="Reset Password"
                    onClick={() => {
                      setResetUser({ id: u._id, username: u.username });
                      setNewPw("");
                    }}
                  >
                    <KeyRound className="w-4 h-4 inline" />
                  </button>

                  {/* Reactivate if inactive */}
                  {u.status === "Inactive" && (
                    <button
                      className="text-emerald-600 hover:text-emerald-500 transition-colors"
                      title="Reactivate"
                      onClick={() => setReactivateId(u._id)}
                    >
                      <CheckCircle className="w-4 h-4 inline" />
                    </button>
                  )}

                  {/* Deactivate if active and not the built-in admin */}
                  {u.status !== "Inactive" && u.username !== "Ubetthina" && (
                    <button
                      className="text-destructive hover:text-destructive/80 transition-colors"
                      title="Deactivate"
                      onClick={() => setDeactivateId(u._id)}
                    >
                      <Ban className="w-4 h-4 inline" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Create user sheet ── */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add User</SheetTitle>
            <SheetDescription>
              Create a new system user account. The user will log in with the
              password you set here.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreate} className="px-4 space-y-4 mt-2">
            <div>
              <Label>Username *</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. jmoyo"
                required
              />
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Joseph Moyo"
                required
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Set a secure password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={createBusy}>
              {createBusy ? "Creating..." : "Create User"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Reset password sheet ── */}
      <Sheet
        open={resetUser !== null}
        onOpenChange={(o) => !o && setResetUser(null)}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Reset Password</SheetTitle>
            <SheetDescription>
              Set a new password for{" "}
              <span className="font-mono font-semibold">
                {resetUser?.username}
              </span>
              .
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleReset} className="px-4 space-y-4 mt-2">
            <div>
              <Label>New Password *</Label>
              <Input
                type="text"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={resetBusy}>
              {resetBusy ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Deactivate confirm ── */}
      <ConfirmModal
        open={deactivateId !== null}
        onOpenChange={(o) => !o && setDeactivateId(null)}
        title="Deactivate user?"
        message="This user will no longer be able to sign in until reactivated."
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleDeactivate}
      />

      {/* ── Reactivate confirm ── */}
      <ConfirmModal
        open={reactivateId !== null}
        onOpenChange={(o) => !o && setReactivateId(null)}
        title="Reactivate user?"
        message="This user will be able to sign in again."
        confirmLabel="Reactivate"
        onConfirm={handleReactivate}
      />
    </div>
  );
}
