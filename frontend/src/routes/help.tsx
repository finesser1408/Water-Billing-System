import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/app-layout";

export const Route = createFileRoute("/help")({
  component: () => <ProtectedRoute><Help /></ProtectedRoute>,
});

const TOPICS = [
  { q: "How do I record a meter reading?", a: "Go to Meter Readings, search for the consumer by name or account number, enter the current reading, and confirm. The system calculates consumption and estimated bill automatically." },
  { q: "How do I record a payment?", a: "Open Payments, search the consumer, enter the amount paid, select the payment method, and click Record Payment. Reference numbers are required for EcoCash and OneMoney." },
  { q: "What do the bill statuses mean?", a: "Unpaid (no payment yet), Partially Paid (some payment received), Paid (fully settled), Overdue (past due date with balance owing)." },
  { q: "Who can generate bills?", a: "Only Finance Managers can generate the monthly bill batch from the Billing page." },
  { q: "I'm locked out. What now?", a: "Contact the System Administrator to reset your account after three failed login attempts." },
];

function Help() {
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-muted-foreground">Common questions about using Aqua Flow.</p>
      <div className="space-y-3">
        {TOPICS.map((t, i) => (
          <details key={i} className="bg-surface border border-border rounded-lg p-4 group">
            <summary className="font-medium cursor-pointer">{t.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{t.a}</p>
          </details>
        ))}
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
        <p className="font-medium">Need more help?</p>
        <p className="text-muted-foreground mt-1">Contact the IT desk at <strong>ext. 204</strong> or email <strong>itsupport@epworth.gov.zw</strong>.</p>
      </div>
    </div>
  );
}
