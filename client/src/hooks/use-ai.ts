import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AIChatbotResponse, AIRecommendationResponse, AIPromoResponse, AIAnalyzeReviewsResponse, AIPriceStockResponse } from "@/types/api";

// AI Chatbot Hook
export function useAIChatbot() {
  return useMutation<AIChatbotResponse, Error, { message: string; conversationHistory?: Array<{ role: string; content: string }> }>({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/ai/chatbot", data);
      return res.json() as Promise<AIChatbotResponse>;
    },
  });
}

// AI Review Analysis Hook
export function useAIAnalyzeReviews() {
  return useMutation<AIAnalyzeReviewsResponse, Error, Array<{ rating: number; comment: string; name: string }>>({
    mutationFn: async (reviews) => {
      const res = await apiRequest("POST", "/api/ai/analyze-reviews", { reviews });
      return res.json() as Promise<AIAnalyzeReviewsResponse>;
    },
  });
}

// AI Promo Generator Hook
export function useAIGeneratePromo() {
  return useMutation<AIPromoResponse, Error, {
    menuName: string;
    price: number;
    targetMarket: string;
    tone?: string;
    additionalInfo?: string;
  }>({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/ai/generate-promo", data);
      return res.json() as Promise<AIPromoResponse>;
    },
  });
}

// AI Menu Recommendations Hook
export function useAIMenuRecommendations() {
  return useMutation<AIRecommendationResponse, Error, {
    orderHistory?: string[];
    preferences?: string;
    timeOfDay?: string;
    currentMood?: string;
  }>({
    mutationFn: async (context) => {
      const res = await apiRequest("POST", "/api/ai/menu-recommendations", context);
      return res.json() as Promise<AIRecommendationResponse>;
    },
  });
}

// AI Price & Stock Recommendations Hook
export function useAIPriceStockRecommendations() {
  return useMutation<AIPriceStockResponse, Error, {
    salesData?: Array<{ menuName: string; quantity: number; revenue: number }>;
    reviews?: Array<{ menuName: string; rating: number; comment: string }>;
    stockLevels?: Array<{ itemName: string; currentStock: number; minStock: number }>;
  }>({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/ai/price-stock-recommendations", data);
      return res.json() as Promise<AIPriceStockResponse>;
    },
  });
}

