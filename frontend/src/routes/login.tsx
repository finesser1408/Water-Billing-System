import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Droplet } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Epworth Water Billing" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await login(username, password);
      setBusy(false);
      if (res.ok) {
        navigate({ to: "/dashboard" });
        return;
      }
      if (res.locked) {
        setLocked(true);
        setError("Account locked. Contact your System Administrator.");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setBusy(false);
      setError("An unexpected error occurred during login.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Droplet className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Epworth Local Board</h1>
          <p className="text-sm text-muted-foreground">Aqua Flow</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)}
              autoComplete="username" disabled={locked || busy} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" disabled={locked || busy} required />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={locked || busy}>
            {busy ? "Signing in..." : "Sign In"}
          </Button>
        </form>

      </div>
    </div>
  );
}
