import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Heart, User, ShoppingBag, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { FavoritesResponse } from "@/types/api";
import type { Menu } from "@shared/schema";

const USER_ID = "consumer-1"; // In production, get from auth

export default function FavoritesPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery<FavoritesResponse>({
    queryKey: [`/api/favorites/${USER_ID}`],
  });

  const favoritesList = favorites as Menu[];

  const removeFavoriteMutation = useMutation({
    mutationFn: async (menuId: string) => {
      await apiRequest("DELETE", `/api/favorites/${USER_ID}/${menuId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${USER_ID}`] });
      toast({ title: "Dihapus dari favorit" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (menu: Menu) => {
      await apiRequest("POST", `/api/cart/${USER_ID}/add`, {
        menuId: menu.id,
        menuName: menu.name,
        price: menu.price,
        quantity: 1,
        image: menu.image,
      });
    },
    onSuccess: () => {
      toast({ title: "Ditambahkan ke keranjang" });
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${USER_ID}`] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Memuat favorit...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 font-sans">
      <header className="bg-white dark:bg-zinc-900 sticky top-0 z-10 p-4 shadow-sm">
        <h1 className="text-xl font-bold">Menu Favorit Saya</h1>
      </header>

      <main className="p-4">
        {favoritesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-bold mb-2">Belum ada favorit</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan menu ke favorit untuk akses cepat
            </p>
            <Button onClick={() => setLocation("/consumer/dashboard")}>
              Jelajahi Menu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favoritesList.map((menu) => (
              <Card key={menu.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 relative">
                  <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => removeFavoriteMutation.mutate(menu.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-bold text-sm truncate mb-1">{menu.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{menu.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold text-sm">Rp {menu.price.toLocaleString('id-ID')}</span>
                    <Button
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={() => addToCartMutation.mutate(menu)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-2 px-6 flex justify-between items-center z-50">
        <button
          onClick={() => setLocation("/consumer/dashboard")}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Beranda</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-primary">
          <Heart className="w-6 h-6" />
          <span className="text-[10px] font-medium">Favorit</span>
        </button>
        <button
          onClick={() => setLocation("/consumer/profile")}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </nav>
    </div>
  );
}
