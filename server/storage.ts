import { randomUUID } from "crypto";
import type { User, Menu, InsertMenu, CartItem, Order, InsertOrder, Review, InsertReview } from "@shared/schema";

export interface IStorage {
  // Users
  getUserByUsername(username: string): Promise<User | null>;
  insertUser(user: { username: string; password: string }): Promise<User>;
  
  // Menus
  getAllMenus(): Promise<Menu[]>;
  getMenusByCategory(category: string): Promise<Menu[]>;
  getMenu(id: string): Promise<Menu | null>;
  createMenu(menu: InsertMenu): Promise<Menu>;
  updateMenu(id: string, menu: Partial<InsertMenu>): Promise<Menu | null>;
  deleteMenu(id: string): Promise<boolean>;
  
  // Cart
  getCart(userId: string): Promise<CartItem[]>;
  addToCart(userId: string, item: CartItem): Promise<void>;
  updateCartItem(userId: string, menuId: string, quantity: number): Promise<void>;
  removeFromCart(userId: string, menuId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  
  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: Order["status"]): Promise<Order | null>;
  
  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByMenu(menuName: string): Promise<Review[]>;
  getAllReviews(): Promise<Review[]>;
  
  // Favorites
  addFavorite(userId: string, menuId: string): Promise<void>;
  removeFavorite(userId: string, menuId: string): Promise<void>;
  getFavorites(userId: string): Promise<Menu[]>;
  isFavorite(userId: string, menuId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>
  private menus: Map<string, Menu>;
  private carts: Map<string, CartItem[]>; // userId -> CartItem[]
  private orders: Map<string, Order>;
  private reviews: Map<string, Review>;
  private favorites: Map<string, Set<string>>; // userId -> Set<menuId>

  constructor() {
    this.users = new Map();
    this.menus = new Map();
    this.carts = new Map();
    this.orders = new Map();
    this.reviews = new Map();
    this.favorites = new Map();
    
    // Initialize with sample menus
    this.initializeSampleMenus();
  }

  private initializeSampleMenus() {
    const sampleMenus: InsertMenu[] = [
      // Makanan Utama - setiap menu punya gambar berbeda dan sesuai
      {
        name: "Ayam Geprek Level 5",
        description: "Ayam goreng crispy dengan sambal pedas level 5, nasi putih, dan lalapan",
        price: 25000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Nasi Goreng Spesial",
        description: "Nasi goreng dengan ayam, udang, telur, dan kerupuk",
        price: 20000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Sate Ayam Madura",
        description: "Sate ayam bumbu kacang dengan lontong dan sambal",
        price: 30000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Bakso Urat",
        description: "Bakso urat dengan mie dan bihun",
        price: 18000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Mie Ayam",
        description: "Mie ayam dengan pangsit dan bakso",
        price: 15000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Gado-Gado",
        description: "Sayuran rebus dengan bumbu kacang",
        price: 12000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Pecel Lele",
        description: "Lele goreng dengan sambal dan lalapan",
        price: 22000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Rawon",
        description: "Rawon daging dengan nasi dan kerupuk",
        price: 28000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Soto Ayam",
        description: "Soto ayam dengan nasi dan kerupuk",
        price: 20000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Rendang",
        description: "Rendang daging sapi dengan nasi putih",
        price: 35000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Gudeg",
        description: "Gudeg nangka muda dengan ayam dan telur",
        price: 25000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Pempek",
        description: "Pempek kapal selam dengan cuko",
        price: 20000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Nasi Padang",
        description: "Nasi padang dengan berbagai lauk pilihan",
        price: 30000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Ketoprak",
        description: "Ketoprak dengan tahu, lontong, dan bumbu kacang",
        price: 15000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Lontong Sayur",
        description: "Lontong sayur dengan labu siam dan telur",
        price: 18000,
        category: "Makanan Utama",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      // Minuman - setiap minuman punya gambar berbeda
      {
        name: "Es Kopi Susu",
        description: "Kopi hitam dengan susu dan es batu",
        price: 10000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Es Teh Manis",
        description: "Teh manis dingin dengan es batu",
        price: 5000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Es Jeruk",
        description: "Jus jeruk segar dengan es batu",
        price: 8000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Es Campur",
        description: "Es campur dengan berbagai buah dan jelly",
        price: 12000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Jus Alpukat",
        description: "Jus alpukat dengan susu dan es",
        price: 15000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Es Cendol",
        description: "Cendol dengan santan dan gula merah",
        price: 10000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Es Dawet",
        description: "Dawet hijau dengan santan",
        price: 8000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Jus Mangga",
        description: "Jus mangga segar dengan es",
        price: 12000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Es Kelapa Muda",
        description: "Kelapa muda segar dengan es",
        price: 15000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Es Teler",
        description: "Es teler dengan alpukat, nangka, dan kelapa",
        price: 18000,
        category: "Minuman",
        image: "https://images.unsplash.com/photo-1556679343-c7306c197ee3?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      // Snack - setiap snack punya gambar berbeda
      {
        name: "Kerupuk",
        description: "Kerupuk renyah berbagai rasa",
        price: 3000,
        category: "Snack",
        image: "https://images.unsplash.com/photo-1562962234-7c607178b5e4?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Pisang Goreng",
        description: "Pisang goreng crispy dengan gula",
        price: 8000,
        category: "Snack",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Tahu Goreng",
        description: "Tahu goreng dengan bumbu kacang",
        price: 10000,
        category: "Snack",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80",
        available: true,
      },
      {
        name: "Tempe Goreng",
        description: "Tempe goreng crispy",
        price: 8000,
        category: "Snack",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&q=80",
        available: true,
      },
    ];

    sampleMenus.forEach(menu => {
      const id = randomUUID();
      this.menus.set(id, { ...menu, id, available: menu.available !== undefined ? menu.available : true, createdAt: new Date() });
    });
  }

  // Users
  async getUserByUsername(username: string): Promise<User | null> {
    const usersArray = Array.from(this.users.values());
    for (const user of usersArray) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async insertUser(user: { username: string; password: string }): Promise<User> {
    const id = randomUUID();
    const newUser: User = { id, username: user.username, password: user.password };
    this.users.set(id, newUser);
    return newUser;
  }

  // Menus
  async getAllMenus(): Promise<Menu[]> {
    return Array.from(this.menus.values());
  }

  async getMenusByCategory(category: string): Promise<Menu[]> {
    return Array.from(this.menus.values()).filter(menu => menu.category === category);
  }

  async getMenu(id: string): Promise<Menu | null> {
    return this.menus.get(id) || null;
  }

  async createMenu(menu: InsertMenu): Promise<Menu> {
    const id = randomUUID();
    const newMenu: Menu = { 
      ...menu, 
      id, 
      available: menu.available !== undefined ? menu.available : true, 
      createdAt: new Date() 
    };
    this.menus.set(id, newMenu);
    return newMenu;
  }

  async updateMenu(id: string, menu: Partial<InsertMenu>): Promise<Menu | null> {
    const existing = this.menus.get(id);
    if (!existing) return null;
    
    const updated: Menu = { ...existing, ...menu };
    this.menus.set(id, updated);
    return updated;
  }

  async deleteMenu(id: string): Promise<boolean> {
    return this.menus.delete(id);
  }

  // Cart
  async getCart(userId: string): Promise<CartItem[]> {
    return this.carts.get(userId) || [];
  }

  async addToCart(userId: string, item: CartItem): Promise<void> {
    const cart = this.carts.get(userId) || [];
    const existing = cart.find(i => i.menuId === item.menuId);
    
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }
    
    this.carts.set(userId, cart);
  }

  async updateCartItem(userId: string, menuId: string, quantity: number): Promise<void> {
    const cart = this.carts.get(userId) || [];
    const item = cart.find(i => i.menuId === menuId);
    if (item) {
      item.quantity = quantity;
      this.carts.set(userId, cart);
    }
  }

  async removeFromCart(userId: string, menuId: string): Promise<void> {
    const cart = this.carts.get(userId) || [];
    const filtered = cart.filter(i => i.menuId !== menuId);
    this.carts.set(userId, filtered);
  }

  async clearCart(userId: string): Promise<void> {
    this.carts.delete(userId);
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const newOrder: Order = {
      id,
      userId: order.userId,
      items: order.items,
      total: order.total,
      status: order.status || "pending",
      createdAt: new Date(),
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order) return null;
    
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
    const id = randomUUID();
    const newReview: Review = {
      id,
      orderId: review.orderId,
      userId: review.userId,
      userName: review.userName,
      menuName: review.menuName,
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date(),
    };
    this.reviews.set(id, newReview);
    return newReview;
  }

  async getReviewsByMenu(menuName: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.menuName === menuName);
  }

  async getAllReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values());
  }

  // Favorites
  async addFavorite(userId: string, menuId: string): Promise<void> {
    if (!this.favorites.has(userId)) {
      this.favorites.set(userId, new Set());
    }
    this.favorites.get(userId)!.add(menuId);
  }

  async removeFavorite(userId: string, menuId: string): Promise<void> {
    const userFavorites = this.favorites.get(userId);
    if (userFavorites) {
      userFavorites.delete(menuId);
    }
  }

  async getFavorites(userId: string): Promise<Menu[]> {
    const userFavorites = this.favorites.get(userId);
    if (!userFavorites) return [];
    
    return Array.from(this.menus.values()).filter(menu => userFavorites.has(menu.id));
  }

  async isFavorite(userId: string, menuId: string): Promise<boolean> {
    const userFavorites = this.favorites.get(userId);
    return userFavorites ? userFavorites.has(menuId) : false;
  }
}

export const storage = new MemStorage();
