import { api } from "../lib/axios";
import { useState, useEffect } from "react";
import type { Menu } from "../types";

export function useMenus() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/menus")
      .then(res => setMenus(res.data))
      .finally(() => setLoading(false));
  }, []);

  return { menus, loading };
}
