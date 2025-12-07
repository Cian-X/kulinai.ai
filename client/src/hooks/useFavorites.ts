// client/src/hooks/useFavorites.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useFavorites(userId: string) {
  return useQuery({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/favorites/${userId}`);
      return res.json();
    },
  });
}

export function useAddFavorite(userId: string) {
  const qc = useQueryClient();
  return useMutation(
    async (menuId: string) => {
      const res = await apiRequest("POST", `/api/favorites/${userId}/${menuId}`);
      return res.json();
    },
    { onSuccess: () => qc.invalidateQueries(["favorites", userId]) }
  );
}

export function useRemoveFavorite(userId: string) {
  const qc = useQueryClient();
  return useMutation(
    async (menuId: string) => {
      const res = await apiRequest("DELETE", `/api/favorites/${userId}/${menuId}`);
      return res.json();
    },
    { onSuccess: () => qc.invalidateQueries(["favorites", userId]) }
  );
}

export function useIsFavorite(userId: string, menuId: string) {
  return useQuery({
    queryKey: ["favorite_check", userId, menuId],
    enabled: !!userId && !!menuId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/favorites/${userId}/check/${menuId}`);
      return res.json();
    },
  });
}
