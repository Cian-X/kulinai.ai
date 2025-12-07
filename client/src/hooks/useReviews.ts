// client/src/hooks/useReviews.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/reviews");
      return res.json();
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation(
    async (payload: any) => {
      const res = await apiRequest("POST", "/api/reviews", payload);
      return res.json();
    },
    { onSuccess: () => qc.invalidateQueries(["reviews"]) }
  );
}
