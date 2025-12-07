// client/src/hooks/useAuth.ts
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAdminLogin() {
  return useMutation(async (payload: { username: string; password: string }) => {
    const res = await apiRequest("POST", "/api/admin/login", payload);
    return res.json();
  });
}

export function useConsumerLogin() {
  return useMutation(async (payload: { username: string; password: string }) => {
    const res = await apiRequest("POST", "/api/consumer/login", payload);
    return res.json();
  });
}
