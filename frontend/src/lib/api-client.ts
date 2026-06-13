import { useQuery as rq_useQuery, useMutation as rq_useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "http://localhost:5000/api";

export const api = {
  users: {
    list: "users/list",
    getByUsername: "users/getByUsername",
    create: "users/create",
    deactivate: "users/deactivate",
    reactivate: "users/reactivate",
    resetPassword: "users/resetPassword",
    updateLastLogin: "users/updateLastLogin",
    seedAdmin: "users/seedAdmin"
  },
  consumers: {
    list: "consumers/list",
    getByAccountNumber: "consumers/getByAccountNumber",
    getByWard: "consumers/getByWard",
    create: "consumers/create",
    update: "consumers/update"
  },
  meterReadings: {
    list: "meterReadings/list",
    getByConsumer: "meterReadings/getByConsumer",
    create: "meterReadings/create"
  },
  bills: {
    list: "bills/list",
    getByConsumer: "bills/getByConsumer",
    getByBillId: "bills/getByBillId",
    create: "bills/create",
    updateStatus: "bills/updateStatus"
  },
  payments: {
    list: "payments/list",
    getByBill: "payments/getByBill",
    getByConsumer: "payments/getByConsumer",
    create: "payments/create"
  }
} as const;

export function useQuery(apiPath: string, args?: Record<string, any>) {
  const queryKey = args ? [apiPath, args] : [apiPath];
  const { data } = rq_useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(`${API_BASE}/${apiPath}`);
      if (args) {
        Object.keys(args).forEach(key => {
          if (args[key] !== undefined) {
            url.searchParams.append(key, String(args[key]));
          }
        });
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch data");
      }
      return res.json();
    }
  });
  return data;
}

export function useMutation(apiPath: string) {
  const queryClient = useQueryClient();
  const mutation = rq_useMutation({
    mutationFn: async (args?: any) => {
      const res = await fetch(`${API_BASE}/${apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args || {}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Mutation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      // Refresh all lists to emulate Convex's live reactive updates
      queryClient.invalidateQueries();
    }
  });

  // Return the async executor, mimicking Convex's useMutation
  return (args?: any) => mutation.mutateAsync(args);
}
