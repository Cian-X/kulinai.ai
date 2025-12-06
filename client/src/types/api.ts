// API Response Types
import type { Menu, Order, Review, CartItem } from "@shared/schema";

export type MenuResponse = Menu;
export type MenusResponse = Menu[];
export type OrderResponse = Order;
export type OrdersResponse = Order[];
export type ReviewResponse = Review;
export type ReviewsResponse = Review[];
export type CartResponse = CartItem[];
export type FavoritesResponse = Menu[];

export interface OrderHistoryResponse {
  history: string[];
}

export interface ReviewForAnalysis {
  name: string;
  rating: number;
  comment: string;
}

export interface AIRecommendationResponse {
  recommendation: string;
}

export interface AIChatbotResponse {
  response: string;
}

export interface AIPromoResponse {
  caption: string;
  hashtags: string[];
}

export interface AIAnalyzeReviewsResponse {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  insights: string[];
  recommendations: string[];
}

export interface AIPriceStockResponse {
  priceRecommendations: Array<{
    menuName: string;
    currentPrice: number;
    recommendedPrice: number;
    reason: string;
  }>;
  stockRecommendations: Array<{
    itemName: string;
    recommendedQuantity: number;
    reason: string;
  }>;
  insights: string[];
}


