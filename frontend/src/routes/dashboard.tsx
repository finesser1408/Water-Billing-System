import { createFileRoute } from "@tanstack/react-router";
import { Droplet, FileText, DollarSign, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ProtectedRoute } from "@/components/app-layout";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { fmtUSD } from "@/utils/billingCalculator";

export const Route = createFileRoute("/dashboard")({
  component: () => <ProtectedRoute><Dashboard /></ProtectedRoute>,
});

function KPI({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const consumers = useQuery(api.consumers.list) || [];
  const bills = useQuery(api.bills.list) || [];
  const payments = useQuery(api.payments.list) || [];
  
  const activeConsumers = consumers.filter((c: any) => c.status === "Active").length;
  const billsIssued = bills.length;
  const collected = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const outstanding = bills.reduce((s: number, b: any) => s + (b.amountDue || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Welcome, {user!.fullName} <span className="text-muted-foreground font-normal">— {user!.role}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of the current billing cycle.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Droplet} label="Total Active Consumers" value={String(activeConsumers)} color="bg-primary/10 text-primary" />
        <KPI icon={FileText} label="Bills Issued This Cycle" value={String(billsIssued)} color="bg-secondary/15 text-secondary" />
        <KPI icon={DollarSign} label="Total Revenue Collected" value={fmtUSD(collected)} color="bg-success/15 text-success" />
        <KPI icon={AlertCircle} label="Outstanding Balance" value={fmtUSD(outstanding)} color="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Monthly Revenue Collection — Last 6 Months</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { month: "Dec", revenue: 8420 },
                { month: "Jan", revenue: 9180 },
                { month: "Feb", revenue: 8760 },
                { month: "Mar", revenue: 10240 },
                { month: "Apr", revenue: 11150 },
                { month: "May", revenue: collected },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  formatter={(v: number) => fmtUSD(v)}
                  contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <ul className="space-y-3">
            <li className="border-l-2 border-primary/40 pl-3">
              <p className="text-sm text-foreground">System initialized with Convex backend</p>
              <p className="text-xs text-muted-foreground mt-0.5">Just now · System</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
