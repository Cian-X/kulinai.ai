// client/src/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders");
      return res.json();
    },
  });
}

export function useOrdersByUser(userId: string) {
  return useQuery({
    queryKey: ["orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/orders/user/${userId}`);
      return res.json();
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation(
    async (payload: any) => {
      const res = await apiRequest("POST", "/api/orders", payload);
      return res.json();
    },
    {
      onSuccess: (_data, variables: any) => {
        if (variables?.userId) qc.invalidateQueries(["cart", variables.userId]);
        if (variables?.userId) qc.invalidateQueries(["orders", variables.userId]);
        qc.invalidateQueries(["orders"]);
      },
    }
  );
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation(
    async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    {
      onSuccess: () => qc.invalidateQueries(["orders"]),
    }
  );
}
