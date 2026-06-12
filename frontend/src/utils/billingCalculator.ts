export interface TariffConfig {
  tier1: number; // per kL, first 5 kL
  tier2: number; // per kL, 6-15 kL
  tier3: number; // per kL, above 15 kL
  serviceCharge: number;
}

export const DEFAULT_TARIFF: TariffConfig = {
  tier1: 0.8,
  tier2: 1.2,
  tier3: 1.8,
  serviceCharge: 3.0,
};

export interface BillBreakdown {
  tier1Units: number; tier1Amount: number;
  tier2Units: number; tier2Amount: number;
  tier3Units: number; tier3Amount: number;
  serviceCharge: number;
  total: number;
}

export function calculateBill(kl: number, tariff: TariffConfig = DEFAULT_TARIFF): BillBreakdown {
  const consumption = Math.max(0, kl);
  const t1 = Math.min(consumption, 5);
  const t2 = Math.max(0, Math.min(consumption, 15) - 5);
  const t3 = Math.max(0, consumption - 15);
  const a1 = t1 * tariff.tier1;
  const a2 = t2 * tariff.tier2;
  const a3 = t3 * tariff.tier3;
  const total = a1 + a2 + a3 + tariff.serviceCharge;
  return {
    tier1Units: t1, tier1Amount: round(a1),
    tier2Units: t2, tier2Amount: round(a2),
    tier3Units: t3, tier3Amount: round(a3),
    serviceCharge: tariff.serviceCharge,
    total: round(total),
  };
}

function round(n: number) { return Math.round(n * 100) / 100; }

export const fmtUSD = (n: number) => `USD ${n.toFixed(2)}`;
export const fmtDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
