import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { Review } from "@shared/schema";
import { 
  chatCompletions, 
  type KolosalMessage,
  chatbotAssistant,
  analyzeReviews,
  generatePromoCaption,
  getMenuRecommendations,
  getPriceStockRecommendations,
} from "./kolosal";
import {
  googleAIChatbotAssistant,
  googleAIAnalyzeReviews,
  googleAIGeneratePromoCaption,
  googleAIGetMenuRecommendations,
} from "./google-ai";
import {
  openRouterChatbotAssistant,
  openRouterAnalyzeReviews,
  openRouterGeneratePromoCaption,
  openRouterGetMenuRecommendations,
  openRouterGetPriceStockRecommendations,
} from "./openrouter";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Kolosal AI Chat Completions endpoint (generic)
  app.post("/api/chat/completions", async (req, res) => {
    try {
      const { messages, model, temperature, max_tokens } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: "messages array is required and must not be empty",
        });
      }

      // Validate message structure
      const validMessages: KolosalMessage[] = messages.map((msg: any) => {
        if (!msg.role || !msg.content) {
          throw new Error("Each message must have 'role' and 'content' fields");
        }
        if (!["user", "assistant", "system"].includes(msg.role)) {
          throw new Error(
            "Message role must be 'user', 'assistant', or 'system'"
          );
        }
        return {
          role: msg.role as KolosalMessage["role"],
          content: String(msg.content),
        };
      });

      const response = await chatCompletions(validMessages, {
        model,
        temperature,
        max_tokens,
      });

      res.json(response);
    } catch (error: any) {
      console.error("Error calling Kolosal AI:", error);
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  });

  // AI Chatbot Assistant for Consumers - Using OpenRouter
  app.post("/api/ai/chatbot", async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({
          error: "message is required and must be a string",
        });
      }

      // Use OpenRouter as primary AI
      const response = await openRouterChatbotAssistant(message, conversationHistory || []);
      res.json({ response });
    } catch (error: any) {
      console.error("Error in chatbot:", error);
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  });

  // AI Review Analysis for Admin - Using OpenRouter
  app.post("/api/ai/analyze-reviews", async (req, res) => {
    try {
      const { reviews } = req.body;

      if (!reviews || !Array.isArray(reviews)) {
        return res.status(400).json({
          error: "reviews array is required",
        });
      }

      // Use OpenRouter as primary AI
      const analysis = await openRouterAnalyzeReviews(reviews);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing reviews:", error);
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  });

  // AI Promo Caption Generator for Admin - Using OpenRouter
  app.post("/api/ai/generate-promo", async (req, res) => {
    try {
      const { menuName, price, targetMarket, tone, additionalInfo } = req.body;

      if (!menuName || !price || !targetMarket) {
        return res.status(400).json({
          error: "menuName, price, and targetMarket are required",
        });
      }

      // Use OpenRouter as primary AI
      const result = await openRouterGeneratePromoCaption({
        menuName,
        price: Number(price),
        targetMarket,
        tone,
        additionalInfo,
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating promo:", error);
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  });

  // AI Menu Recommendations for Consumers - Using OpenRouter
  app.post("/api/ai/menu-recommendations", async (req, res) => {
    try {
      const { orderHistory, preferences, timeOfDay, currentMood } = req.body;

      // Use OpenRouter as primary AI
      const recommendation = await openRouterGetMenuRecommendations({
        orderHistory,
        preferences,
        timeOfDay,
        currentMood,
      });
      res.json({ recommendation });
    } catch (error: any) {
      console.error("Error getting menu recommendations:", error);
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  });

  // AI Price & Stock Recommendations for Admin - Using OpenRouter
  app.post("/api/ai/price-stock-recommendations", async (req, res) => {
    try {
      const { salesData, reviews, stockLevels } = req.body;

      // Use OpenRouter as primary AI
      const recommendations = await openRouterGetPriceStockRecommendations({
        salesData,
        reviews,
        stockLevels,
      });

      res.json(recommendations);
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  });

  // Menu endpoints
  app.get("/api/menus", async (req, res) => {
    try {
      const { category } = req.query;
      const menus = category 
        ? await storage.getMenusByCategory(category as string)
        : await storage.getAllMenus();
      res.json(menus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/menus/:id", async (req, res) => {
    try {
      const menu = await storage.getMenu(req.params.id);
      if (!menu) return res.status(404).json({ error: "Menu not found" });
      res.json(menu);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/menus", async (req, res) => {
    try {
      const menu = await storage.createMenu(req.body);
      res.json(menu);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/menus/:id", async (req, res) => {
    try {
      const menu = await storage.updateMenu(req.params.id, req.body);
      res.json(menu);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/menus/:id", async (req, res) => {
    try {
      await storage.deleteMenu(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cart endpoints
  app.get("/api/cart/:userId", async (req, res) => {
    try {
      const cart = await storage.getCart(req.params.userId);
      res.json(cart);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cart/:userId/add", async (req, res) => {
    try {
      await storage.addToCart(req.params.userId, req.body);
      const cart = await storage.getCart(req.params.userId);
      res.json(cart);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/cart/:userId/update", async (req, res) => {
    try {
      const { menuId, quantity } = req.body;
      await storage.updateCartItem(req.params.userId, menuId, quantity);
      const cart = await storage.getCart(req.params.userId);
      res.json(cart);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/cart/:userId/:menuId", async (req, res) => {
    try {
      await storage.removeFromCart(req.params.userId, req.params.menuId);
      const cart = await storage.getCart(req.params.userId);
      res.json(cart);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/cart/:userId", async (req, res) => {
    try {
      await storage.clearCart(req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Order endpoints
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders/user/:userId", async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.params.userId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const order = await storage.createOrder(req.body);
      // Clear cart after order
      await storage.clearCart(req.body.userId);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const order = await storage.updateOrderStatus(req.params.id, req.body.status);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Review endpoints
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const review = await storage.createReview(req.body);
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Favorites endpoints
  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const favorites = await storage.getFavorites(req.params.userId);
      // getFavorites already returns Menu[], no need to map
      res.json(favorites);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/favorites/:userId/:menuId", async (req, res) => {
    try {
      await storage.addFavorite(req.params.userId, req.params.menuId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/favorites/:userId/:menuId", async (req, res) => {
    try {
      await storage.removeFavorite(req.params.userId, req.params.menuId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/favorites/:userId/check/:menuId", async (req, res) => {
    try {
      const isFavorite = await storage.isFavorite(req.params.userId, req.params.menuId);
      res.json({ isFavorite });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user order history for AI recommendations
  app.get("/api/users/:userId/order-history", async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.params.userId);
      const history = orders.flatMap(order => 
        order.items.map(item => item.menuName)
      );
      res.json({ history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get real reviews for AI analysis
  app.get("/api/reviews/for-analysis", async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      const formatted = reviews.map((r: Review) => ({
        name: r.userName,
        rating: r.rating,
        comment: r.comment,
      }));
      res.json(formatted);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
