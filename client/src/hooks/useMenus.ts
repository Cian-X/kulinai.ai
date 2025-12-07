// client/src/hooks/useMenus.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Menu } from "@shared/schema";

export function useMenus() {
  return useQuery<Menu[]>({
    queryKey: ["menus"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/menus");
      return res.json() as Menu[];
    },
  });
}

export function useMenu(id: string | undefined) {
  return useQuery({
    queryKey: ["menu", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/menus/${id}`);
      return res.json();
    },
  });
}

// Admin: create / update / delete
export function useCreateMenu() {
  const qc = useQueryClient();
  return useMutation(
    async (payload: any) => {
      const res = await apiRequest("POST", "/api/menus", payload);
      return res.json();
    },
    {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
    },
  );
}

export function useUpdateMenu() {
  const qc = useQueryClient();
  return useMutation(
    async ({ id, patch }: { id: string; patch: any }) => {
      const res = await apiRequest("PUT", `/api/menus/${id}`, patch);
      return res.json();
    },
    {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
    },
  );
}

export function useDeleteMenu() {
  const qc = useQueryClient();
  return useMutation(
    async (id: string) => {
      const res = await apiRequest("DELETE", `/api/menus/${id}`);
      return res.json();
    },
    {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
    },
  );
}
