export interface Consumer {
  consumerId: number;
  accountNumber: string;
  fullName: string;
  address: string;
  wardId: number;
  meterNumber: string;
  connectionDate: string;
  status: "Active" | "Inactive" | "Disconnected";
  prevReading: number;
  avgConsumption: number;
}

export interface Bill {
  billId: number;
  consumerId: number;
  billingPeriod: string;
  prevReading: number;
  currReading: number;
  consumption: number;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: "Unpaid" | "Partially Paid" | "Paid" | "Overdue";
}

export interface Payment {
  paymentId: number;
  consumerId: number;
  billId: number;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: "Cash" | "Bank Transfer" | "EcoCash" | "OneMoney";
  referenceNumber: string;
  receivedBy: string;
}

const FIRST = ["Tendai", "Chipo", "Farai", "Rudo", "Tatenda", "Nyasha", "Kudzai", "Tariro", "Tinashe", "Munashe", "Blessing", "Rumbidzai", "Takudzwa", "Anesu", "Vimbai"];
const LAST = ["Moyo", "Ncube", "Sibanda", "Chikomo", "Mhlanga", "Dube", "Madziva", "Mutasa", "Gumbo", "Zvobgo", "Mapfumo", "Chigumba", "Mawere", "Banda"];

function rand(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const CONSUMERS: Consumer[] = Array.from({ length: 47 }, (_, i) => {
  const id = i + 1;
  const first = FIRST[Math.floor(rand(id) * FIRST.length)];
  const last = LAST[Math.floor(rand(id * 3) * LAST.length)];
  const ward = (Math.floor(rand(id * 7) * 7) + 1);
  const status = i % 11 === 0 ? "Disconnected" : i % 13 === 0 ? "Inactive" : "Active";
  const prev = 1000 + Math.floor(rand(id * 11) * 800);
  return {
    consumerId: id,
    accountNumber: `ELB-${String(id).padStart(4, "0")}`,
    fullName: `${first} ${last}`,
    address: `House ${10 + id}, Ward ${ward}, Epworth`,
    wardId: ward,
    meterNumber: `MTR-${20000 + id}`,
    connectionDate: `201${5 + (id % 9)}-0${(id % 9) + 1}-1${id % 9}`,
    status: status as Consumer["status"],
    prevReading: prev,
    avgConsumption: 12 + Math.floor(rand(id * 5) * 18),
  };
});

export const BILLS: Bill[] = CONSUMERS.filter((c) => c.status === "Active").slice(0, 35).map((c, i) => {
  const consumption = c.avgConsumption + Math.floor(rand(c.consumerId * 17) * 8 - 3);
  const curr = c.prevReading + consumption;
  const amount = calcBillAmount(consumption);
  const r = i % 4;
  const status: Bill["status"] = r === 0 ? "Paid" : r === 1 ? "Partially Paid" : r === 2 ? "Overdue" : "Unpaid";
  const paid = status === "Paid" ? amount : status === "Partially Paid" ? Math.round(amount * 0.5 * 100) / 100 : 0;
  return {
    billId: i + 1,
    consumerId: c.consumerId,
    billingPeriod: "2026-05",
    prevReading: c.prevReading,
    currReading: curr,
    consumption,
    amountDue: amount,
    amountPaid: paid,
    dueDate: "2026-06-30",
    status,
  };
});

function calcBillAmount(kl: number) {
  let total = 3;
  const t1 = Math.min(kl, 5); total += t1 * 0.8;
  const t2 = Math.max(0, Math.min(kl, 15) - 5); total += t2 * 1.2;
  const t3 = Math.max(0, kl - 15); total += t3 * 1.8;
  return Math.round(total * 100) / 100;
}

export const PAYMENTS: Payment[] = BILLS.filter((b) => b.amountPaid > 0).map((b, i) => ({
  paymentId: i + 1,
  consumerId: b.consumerId,
  billId: b.billId,
  paymentDate: `2026-06-${String((i % 11) + 1).padStart(2, "0")}`,
  amountPaid: b.amountPaid,
  paymentMethod: (["Cash", "EcoCash", "Bank Transfer", "OneMoney"] as const)[i % 4],
  referenceNumber: `REF-${100000 + i}`,
  receivedBy: ["Tatenda Ncube", "Rumbidzai Chikomo"][i % 2],
}));

export const REVENUE_6MO = [
  { month: "Dec", revenue: 8420 },
  { month: "Jan", revenue: 9180 },
  { month: "Feb", revenue: 8760 },
  { month: "Mar", revenue: 10240 },
  { month: "Apr", revenue: 11150 },
  { month: "May", revenue: 12380 },
];

export const ACTIVITY = [
  { id: 1, ts: "2026-06-12 09:42", user: "Rumbidzai Chikomo", action: "Recorded meter reading for ELB-0014" },
  { id: 2, ts: "2026-06-12 09:18", user: "Tatenda Ncube", action: "Recorded payment of USD 24.60 (ELB-0008)" },
  { id: 3, ts: "2026-06-12 08:55", user: "Patience Madziva", action: "Generated bills for June 2026 cycle" },
  { id: 4, ts: "2026-06-11 16:22", user: "Tatenda Ncube", action: "Recorded payment of USD 18.20 (ELB-0021)" },
  { id: 5, ts: "2026-06-11 15:03", user: "Rumbidzai Chikomo", action: "Recorded meter reading for ELB-0003" },
];

export const SYSTEM_LOGS = Array.from({ length: 28 }, (_, i) => ({
  id: i + 1,
  ts: `2026-06-${String(11 - (i % 10)).padStart(2, "0")} ${String(8 + (i % 9)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
  user: ["billing", "clerk", "manager", "admin"][i % 4],
  action: ["LOGIN", "CREATE_READING", "RECORD_PAYMENT", "GENERATE_BILLS", "UPDATE_TARIFF", "CREATE_USER"][i % 6],
  module: ["Auth", "Meter Readings", "Payments", "Billing", "Tariff", "Users"][i % 6],
  details: "Operation completed successfully",
  ip: `192.168.1.${20 + (i % 30)}`,
}));

export const USERS_MOCK = [
  { id: 1, username: "billing", fullName: "Rumbidzai Chikomo", role: "Billing Officer", status: "Active", lastLogin: "2026-06-12 09:00" },
  { id: 2, username: "clerk", fullName: "Tatenda Ncube", role: "Finance Clerk", status: "Active", lastLogin: "2026-06-12 08:45" },
  { id: 3, username: "manager", fullName: "Patience Madziva", role: "Finance Manager", status: "Active", lastLogin: "2026-06-11 17:20" },
  { id: 4, username: "admin", fullName: "Farai Mhlanga", role: "System Administrator", status: "Active", lastLogin: "2026-06-12 07:30" },
  { id: 5, username: "jdube", fullName: "Joyce Dube", role: "Billing Officer", status: "Inactive", lastLogin: "2026-05-22 14:10" },
];
