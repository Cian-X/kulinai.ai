import type { Menu } from "@shared/schema";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || ""; // dev pakai http://localhost:5000, prod pakai relative path

export async function fetchMenus(): Promise<Menu[]> {
  const res = await fetch(`${API_BASE_URL}/api/menus`);

  if (!res.ok) {
    throw new Error("Failed to fetch menus");
  }

  return res.json();
}
