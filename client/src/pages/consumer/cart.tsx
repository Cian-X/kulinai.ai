import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Heart, User, ShoppingBag, Plus, Minus, Trash2, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

const USER_ID = "consumer-1";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: cart = [], isLoading } = useQuery({
    queryKey: ["cart", USER_ID],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/cart/${USER_ID}`);
      return res.json();
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ menuId, quantity }: { menuId: string; quantity: number }) => {
      await apiRequest("PUT", `/api/cart/${USER_ID}/update`, { menuId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", USER_ID] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (menuId: string) => {
      await apiRequest("DELETE", `/api/cart/${USER_ID}/${menuId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", USER_ID] });
      toast({ title: "Dihapus dari keranjang" });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const total = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      await apiRequest("POST", "/api/orders", {
        userId: USER_ID,
        items: cart,
        total,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", USER_ID] });
      queryClient.invalidateQueries({ queryKey: ["orders", USER_ID] });
      toast({ 
        title: "Pesanan berhasil!", 
        description: "Pesananmu sedang diproses" 
      });
      setLocation("/consumer/dashboard");
    },
  });

  const total = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 font-sans">
      <header className="bg-white dark:bg-zinc-900 sticky top-0 z-10 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/consumer/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">Keranjang</h1>
          {cart.length > 0 && (
            <div className="text-sm text-muted-foreground">{cart.length} item</div>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Keranjang kosong</p>
            <Button onClick={() => setLocation("/consumer/dashboard")}>
              Mulai Belanja
            </Button>
          </div>
        ) : (
          <>
            {cart.map((item: any) => (
              <Card key={item.menuId} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                      <img src={item.image} alt={item.menuName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-sm">{item.menuName}</h3>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removeFromCartMutation.mutate(item.menuId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="text-primary font-bold mb-2">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateCartMutation.mutate({ menuId: item.menuId, quantity: item.quantity - 1 });
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => {
                            updateCartMutation.mutate({ menuId: item.menuId, quantity: item.quantity + 1 });
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="sticky bottom-20 bg-white dark:bg-zinc-900 border-2 border-primary">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">Rp {total.toLocaleString('id-ID')}</span>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-orange-600"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? "Memproses..." : "Checkout"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-2 px-6 flex justify-between items-center z-50">
        <button 
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          onClick={() => setLocation("/consumer/dashboard")}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Beranda</span>
        </button>
        <button 
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          onClick={() => setLocation("/consumer/favorites")}
        >
          <Heart className="w-6 h-6" />
          <span className="text-[10px] font-medium">Favorit</span>
        </button>
        <button 
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          onClick={() => setLocation("/consumer/profile")}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </nav>
    </div>
  );
}

