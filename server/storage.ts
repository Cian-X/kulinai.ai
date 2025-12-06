// server/storage.ts
import { pool } from "./db";
import type {
  User,
  Menu,
  InsertMenu,
  CartItem,
  Order,
  InsertOrder,
  Review,
  InsertReview,
} from "@shared/schema";

export class PostgresStorage {
  // Users
  async getUserByUsername(username: string): Promise<User | null> {
    const r = await pool.query("SELECT * FROM users WHERE username=$1 LIMIT 1", [username]);
    return r.rows[0] || null;
  }

  async insertUser(user: { username: string; password: string }): Promise<User> {
    const r = await pool.query(
      "INSERT INTO users (id, username, password) VALUES (gen_random_uuid(), $1, $2) RETURNING *",
      [user.username, user.password]
    );
    return r.rows[0];
  }

  // Menus
  async getAllMenus(): Promise<Menu[]> {
    const r = await pool.query("SELECT * FROM menus ORDER BY created_at DESC");
    return r.rows;
  }

  async getMenusByCategory(category: string): Promise<Menu[]> {
    const r = await pool.query("SELECT * FROM menus WHERE category=$1 ORDER BY created_at DESC", [category]);
    return r.rows;
  }

  async getMenu(id: string): Promise<Menu | null> {
    const r = await pool.query("SELECT * FROM menus WHERE id=$1 LIMIT 1", [id]);
    return r.rows[0] || null;
  }

  async createMenu(menu: InsertMenu): Promise<Menu> {
    const r = await pool.query(
      `INSERT INTO menus (id, name, description, price, category, image, available)
       VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6) RETURNING *`,
      [menu.name, menu.description || null, menu.price, menu.category || null, menu.image || null, menu.available ?? true]
    );
    return r.rows[0];
  }

  async updateMenu(id: string, menu: Partial<InsertMenu>): Promise<Menu | null> {
    const existing = await this.getMenu(id);
    if (!existing) return null;
    const updated = { ...existing, ...menu };
    const r = await pool.query(
      `UPDATE menus SET name=$1, description=$2, price=$3, category=$4, image=$5, available=$6 WHERE id=$7 RETURNING *`,
      [updated.name, updated.description, updated.price, updated.category, updated.image, updated.available, id]
    );
    return r.rows[0] || null;
  }

  async deleteMenu(id: string): Promise<boolean> {
    await pool.query("DELETE FROM menus WHERE id=$1", [id]);
    return true;
  }

  // Cart (one row per user, items stored as JSONB)
  async getCart(userId: string): Promise<CartItem[]> {
    const r = await pool.query("SELECT items FROM carts WHERE user_id=$1", [userId]);
    if (r.rows[0]) return r.rows[0].items || [];
    return [];
  }

  async addToCart(userId: string, item: CartItem): Promise<void> {
    const cur = await pool.query("SELECT items FROM carts WHERE user_id=$1", [userId]);
    const items = cur.rows[0] ? cur.rows[0].items : [];
    const existing = items.find((i: any) => i.menuId === item.menuId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push(item);
    }
    if (cur.rows[0]) {
      await pool.query("UPDATE carts SET items=$1, updated_at=now() WHERE user_id=$2", [items, userId]);
    } else {
      await pool.query("INSERT INTO carts (user_id, items) VALUES ($1, $2)", [userId, items]);
    }
  }

  async updateCartItem(userId: string, menuId: string, quantity: number): Promise<void> {
    const cur = await pool.query("SELECT items FROM carts WHERE user_id=$1", [userId]);
    const items = cur.rows[0] ? cur.rows[0].items : [];
    const item = items.find((i: any) => i.menuId === menuId);
    if (item) {
      item.quantity = quantity;
      await pool.query("UPDATE carts SET items=$1, updated_at=now() WHERE user_id=$2", [items, userId]);
    }
  }

  async removeFromCart(userId: string, menuId: string): Promise<void> {
    const cur = await pool.query("SELECT items FROM carts WHERE user_id=$1", [userId]);
    const items = cur.rows[0] ? cur.rows[0].items : [];
    const filtered = items.filter((i: any) => i.menuId !== menuId);
    await pool.query("UPDATE carts SET items=$1, updated_at=now() WHERE user_id=$2", [filtered, userId]);
  }

  async clearCart(userId: string): Promise<void> {
    await pool.query("DELETE FROM carts WHERE user_id=$1", [userId]);
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const r = await pool.query(
      `INSERT INTO orders (id, user_id, items, total, status) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`,
      [order.userId, order.items, order.total, order.status || "pending"]
    );
    await pool.query("DELETE FROM carts WHERE user_id=$1", [order.userId]);
    return r.rows[0];
  }

  async getOrder(id: string): Promise<Order | null> {
    const r = await pool.query("SELECT * FROM orders WHERE id=$1", [id]);
    return r.rows[0] || null;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    const r = await pool.query("SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC", [userId]);
    return r.rows;
  }

  async getAllOrders(): Promise<Order[]> {
    const r = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    return r.rows;
  }

  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order | null> {
    const r = await pool.query("UPDATE orders SET status=$1 WHERE id=$2 RETURNING *", [status, id]);
    return r.rows[0] || null;
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
    const r = await pool.query(
      `INSERT INTO reviews (id, order_id, user_id, user_name, menu_name, rating, comment) VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6) RETURNING *`,
      [review.orderId, review.userId, review.userName, review.menuName, review.rating, review.comment]
    );
    return r.rows[0];
  }

  async getReviewsByMenu(menuName: string): Promise<Review[]> {
    const r = await pool.query("SELECT * FROM reviews WHERE menu_name=$1 ORDER BY created_at DESC", [menuName]);
    return r.rows;
  }

  async getAllReviews(): Promise<Review[]> {
    const r = await pool.query("SELECT * FROM reviews ORDER BY created_at DESC");
    return r.rows;
  }

  // Favorites
  async addFavorite(userId: string, menuId: string): Promise<void> {
    await pool.query("INSERT INTO favorites (user_id, menu_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [userId, menuId]);
  }

  async removeFavorite(userId: string, menuId: string): Promise<void> {
    await pool.query("DELETE FROM favorites WHERE user_id=$1 AND menu_id=$2", [userId, menuId]);
  }

  async getFavorites(userId: string): Promise<Menu[]> {
    const r = await pool.query(
      `SELECT m.* FROM menus m JOIN favorites f ON m.id = f.menu_id WHERE f.user_id = $1`,
      [userId]
    );
    return r.rows;
  }

  async isFavorite(userId: string, menuId: string): Promise<boolean> {
    const r = await pool.query("SELECT 1 FROM favorites WHERE user_id=$1 AND menu_id=$2 LIMIT 1", [userId, menuId]);
    return r.rowCount > 0;
  }
}

export const storage = new PostgresStorage();
