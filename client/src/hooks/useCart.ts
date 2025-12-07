// client/src/hooks/useCart.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useCart(userId: string) {
  return useQuery({
    queryKey: ["cart", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/cart/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useAddToCart(userId: string) {
  const qc = useQueryClient();
  return useMutation(
    async (item: any) => {
      const res = await apiRequest("POST", `/api/cart/${userId}/add`, item);
      return res.json();
    },
    {
      onSuccess: () => qc.invalidateQueries(["cart", userId]),
    }
  );
}

export function useUpdateCartItem(userId: string) {
  const qc = useQueryClient();
  return useMutation(
    async ({ menuId, quantity }: { menuId: string; quantity: number }) => {
      const res = await apiRequest("PUT", `/api/cart/${userId}/update`, { menuId, quantity });
      return res.json();
    },
    { onSuccess: () => qc.invalidateQueries(["cart", userId]) }
  );
}

export function useRemoveFromCart(userId: string) {
  const qc = useQueryClient();
  return useMutation(
    async (menuId: string) => {
      const res = await apiRequest("DELETE", `/api/cart/${userId}/${menuId}`);
      return res.json();
    },
    { onSuccess: () => qc.invalidateQueries(["cart", userId]) }
  );
}
