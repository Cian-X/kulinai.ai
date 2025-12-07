// client/src/hooks/useAI.ts
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useChatbot() {
  return useMutation(async (payload: { message: string; conversationHistory?: any[] }) => {
    const res = await apiRequest("POST", "/api/ai/chatbot", payload);
    return res.json();
  });
}

export function useAnalyzeReviews() {
  return useMutation(async (reviews: any[]) => {
    const res = await apiRequest("POST", "/api/ai/analyze-reviews", { reviews });
    return res.json();
  });
}

export function useGeneratePromo() {
  return useMutation(async (payload: { menuName: string; price: number; targetMarket: string; tone?: string; additionalInfo?: string }) => {
    const res = await apiRequest("POST", "/api/ai/generate-promo", payload);
    return res.json();
  });
}

export function useMenuRecommendations() {
  return useMutation(async (payload: any) => {
    const res = await apiRequest("POST", "/api/ai/menu-recommendations", payload);
    return res.json();
  });
}

export function usePriceStockRecommendations() {
  return useMutation(async (payload: any) => {
    const res = await apiRequest("POST", "/api/ai/price-stock-recommendations", payload);
    return res.json();
  });
}
