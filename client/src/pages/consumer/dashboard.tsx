import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Home, Heart, User, ShoppingBag, Plus, Minus, X, Loader2 } from "lucide-react";
import { useAIMenuRecommendations } from "@/hooks/use-ai";
import { AIChatbot } from "@/components/ai-chatbot";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useMenus } from "@/hooks/useMenus";
import type { MenusResponse, CartResponse, OrderHistoryResponse, FavoritesResponse, AIRecommendationResponse } from "@/types/api";
import type { Menu, CartItem } from "@shared/schema";

const USER_ID = "consumer-1"; // In production, get from auth

export default function ConsumerDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [predictedCategory, setPredictedCategory] = useState<string>("");
  
  const menuRecommendationsMutation = useAIMenuRecommendations();

  // Get all menus
  const { data: menus = [], isLoading: menusLoading } = useQuery<MenusResponse>({
    queryKey: ["/api/menus"],
  });

  // Get cart
  const { data: cart = [] } = useQuery<CartResponse>({
    queryKey: [`/api/cart/${USER_ID}`],
  });

  // Get order history for AI
  const { data: orderHistoryData } = useQuery<OrderHistoryResponse>({
    queryKey: [`/api/users/${USER_ID}/order-history`],
  });

  // Get all favorites
  const { data: favoritesList = [] } = useQuery<FavoritesResponse>({
    queryKey: [`/api/favorites/${USER_ID}`],
  });
  
  const favoriteMenuIds = new Set((favoritesList as Menu[]).map((m) => m.id));

  // Get Indonesia time
  const getIndonesiaTime = () => {
    const now = new Date();
    const indonesiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    return indonesiaTime;
  };

  // Get AI recommendation on mount
  useEffect(() => {
    const indonesiaTime = getIndonesiaTime();
    const hour = indonesiaTime.getHours();
    
    // Determine time of day in Indonesian
    let timeOfDay = "makan malam";
    if (hour >= 5 && hour < 11) {
      timeOfDay = "sarapan";
    } else if (hour >= 11 && hour < 15) {
      timeOfDay = "makan siang";
    } else if (hour >= 15 && hour < 18) {
      timeOfDay = "makan sore";
    }
    
    // Predict category based on Indonesia time
    if (hour >= 5 && hour < 11) {
      setPredictedCategory("Makanan Utama"); // Breakfast
    } else if (hour >= 11 && hour < 15) {
      setPredictedCategory("Makanan Utama"); // Lunch
    } else if (hour >= 15 && hour < 18) {
      setPredictedCategory("Minuman"); // Afternoon drinks
    } else if (hour >= 18 && hour < 22) {
      setPredictedCategory("Makanan Utama"); // Dinner
    } else {
      setPredictedCategory("Snack"); // Late night snack
    }

    const orderHistory = orderHistoryData?.history || [];
    
    menuRecommendationsMutation.mutate(
      {
        orderHistory: orderHistory.slice(0, 10),
        preferences: orderHistory.length > 0 ? "berdasarkan riwayat" : undefined,
        timeOfDay,
        currentMood: hour >= 15 && hour < 18 ? "haus" : undefined,
      },
      {
        onSuccess: (data: AIRecommendationResponse) => {
          setAiRecommendation(data.recommendation || "");
        },
        onError: (error: any) => {
          console.error("Menu recommendation error:", error);
          const timeStr = indonesiaTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
          const hour = indonesiaTime.getHours();
          let fallbackMessage = `Sekarang jam ${timeStr} WIB. `;
          
          if (hour >= 5 && hour < 11) {
            fallbackMessage += "Coba menu sarapan favorit kami! 🍳";
          } else if (hour >= 11 && hour < 15) {
            fallbackMessage += "Waktunya makan siang! Coba menu terlaris kami! 🍽️";
          } else if (hour >= 15 && hour < 18) {
            fallbackMessage += "Sore hari yang pas untuk minuman segar! 🧊";
          } else {
            fallbackMessage += "Malam yang sempurna untuk makan malam! 🌙";
          }
          
          setAiRecommendation(fallbackMessage);
        },
      }
    );
  }, [orderHistoryData]);

  // Filter menus - ensure category filter works correctly
  const menuList = menus as Menu[];
  const filteredMenus = menuList.filter((menu) => {
    if (!menu.available) return false; // Only show available menus
    
    const matchesCategory = selectedCategory === "Semua" || menu.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menu.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group menus by predicted category
  const predictedMenus = predictedCategory 
    ? menuList.filter((m) => m.category === predictedCategory).slice(0, 4)
    : [];

  // Other menus (not predicted)
  const otherMenus = filteredMenus.filter((m) => 
    !predictedMenus.some((pm) => pm.id === m.id)
  );

  // Cart mutations
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

  const updateCartMutation = useMutation({
    mutationFn: async ({ menuId, quantity }: { menuId: string; quantity: number }) => {
      await apiRequest("PUT", `/api/cart/${USER_ID}/update`, { menuId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${USER_ID}`] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (menuId: string) => {
      await apiRequest("DELETE", `/api/cart/${USER_ID}/${menuId}`);
    },
    onSuccess: () => {
      toast({ title: "Dihapus dari keranjang" });
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${USER_ID}`] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const total = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      await apiRequest("POST", "/api/orders", {
        userId: USER_ID,
        items: cart,
        total,
      });
    },
    onSuccess: () => {
      toast({ title: "Pesanan berhasil dibuat!" });
      setCartOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${USER_ID}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${USER_ID}/order-history`] });
    },
  });

  // Favorite mutations
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ menuId, isFavorite }: { menuId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${USER_ID}/${menuId}`);
      } else {
        await apiRequest("POST", `/api/favorites/${USER_ID}/${menuId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${USER_ID}`] });
    },
  });

  const cartList = cart as CartItem[];
  const cartTotal = cartList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartList.reduce((sum, item) => sum + item.quantity, 0);

  // Get unique categories from menus
  const uniqueCategories = Array.from(new Set(menuList.map((m) => m.category).filter(Boolean)));
  const availableCategories = ["Semua", ...uniqueCategories];
  const categories = availableCategories.length > 1 ? availableCategories : ["Semua", "Makanan Utama", "Minuman", "Snack"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 p-4 shadow-sm border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Lokasi Kamu</p>
            <div className="flex items-center gap-1 font-bold text-sm">
              Jl. Sudirman No. 45, Jakarta <span className="text-primary">▼</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getIndonesiaTime().toLocaleTimeString("id-ID", { 
                hour: "2-digit", 
                minute: "2-digit",
                timeZone: "Asia/Jakarta"
              })} WIB
            </p>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setCartOpen(true)}
            className="relative"
          >
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mau makan apa hari ini?"
            className="pl-10 bg-zinc-100 dark:bg-zinc-800 border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* AI Recommendation Banner */}
        <div className="bg-gradient-to-r from-primary to-orange-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs mb-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              AI Recommendation
            </div>
            <h3 className="font-bold text-lg leading-tight mb-2">Hai Budi, lapar ya?</h3>
            <p className="text-sm text-white/90 mb-3">
              {menuRecommendationsMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI sedang menganalisis preferensimu...
                </span>
              ) : (
                aiRecommendation || "Berdasarkan riwayatmu, sepertinya kamu lagi pengen yang pedas-pedas nih!"
              )}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="text-primary font-bold"
              onClick={() => {
                const indonesiaTime = getIndonesiaTime();
                const hour = indonesiaTime.getHours();
                let timeOfDay = "makan malam";
                if (hour >= 5 && hour < 11) {
                  timeOfDay = "sarapan";
                } else if (hour >= 11 && hour < 15) {
                  timeOfDay = "makan siang";
                } else if (hour >= 15 && hour < 18) {
                  timeOfDay = "makan sore";
                }
                const orderHistory = orderHistoryData?.history || [];
                menuRecommendationsMutation.mutate({
                  orderHistory: orderHistory.slice(0, 10),
                  preferences: orderHistory.length > 0 ? "berdasarkan riwayat" : undefined,
                  timeOfDay,
                  currentMood: hour >= 15 && hour < 18 ? "haus" : undefined,
                }, {
                  onSuccess: (data: AIRecommendationResponse) => {
                    setAiRecommendation(data.recommendation || "");
                  },
                });
              }}
              disabled={menuRecommendationsMutation.isPending}
            >
              {menuRecommendationsMutation.isPending ? "Memuat..." : "Refresh Rekomendasi"}
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-zinc-800 text-foreground border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Predicted Category Section */}
        {predictedMenus.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-bold text-lg">
                {predictedCategory === "Minuman" ? "💧 Rekomendasi Minuman" : "🍽️ Rekomendasi Makanan"}
              </h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                AI Prediksi
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {predictedMenus.map((menu) => {
                const isFavorite = favoriteMenuIds.has(menu.id);
                
                return (
                  <Card key={menu.id} className="overflow-hidden border-none shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
                    <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden">
                      <img 
                        src={menu.image} 
                        alt={menu.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        loading="lazy"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white backdrop-blur-sm shadow-md"
                        onClick={() => toggleFavoriteMutation.mutate({ menuId: menu.id, isFavorite })}
                      >
                        <Heart className={`h-4 w-4 transition-all ${isFavorite ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                      </Button>
                      {!menu.available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">Habis</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm truncate mb-1">{menu.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{menu.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold text-sm">
                          Rp {menu.price.toLocaleString("id-ID")}
                        </span>
                        <Button
                          size="icon"
                          className="h-7 w-7 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110"
                          onClick={() => addToCartMutation.mutate(menu)}
                          disabled={addToCartMutation.isPending || !menu.available}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Menus Section */}
        <div>
          <h2 className="font-bold text-lg mb-4">
            {selectedCategory === "Semua" ? "Semua Menu" : selectedCategory} 🔥
          </h2>
          {menusLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredMenus.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Tidak ada menu ditemukan</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {otherMenus.map((menu) => {
                const isFavorite = favoriteMenuIds.has(menu.id);
                
                return (
                  <Card key={menu.id} className="overflow-hidden border-none shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
                    <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden">
                      <img 
                        src={menu.image} 
                        alt={menu.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        loading="lazy"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white backdrop-blur-sm shadow-md"
                        onClick={() => toggleFavoriteMutation.mutate({ menuId: menu.id, isFavorite })}
                      >
                        <Heart className={`h-4 w-4 transition-all ${isFavorite ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                      </Button>
                      {!menu.available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">Habis</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm truncate mb-1">{menu.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{menu.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold text-sm">
                          Rp {menu.price.toLocaleString("id-ID")}
                        </span>
                        <Button
                          size="icon"
                          className="h-7 w-7 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110"
                          onClick={() => addToCartMutation.mutate(menu)}
                          disabled={addToCartMutation.isPending || !menu.available}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Cart Dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Keranjang Saya</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Keranjang kosong</p>
            ) : (
              <>
                {cartList.map((item) => (
                  <div key={item.menuId} className="flex items-center gap-3 border-b pb-3">
                    <img src={item.image} alt={item.menuName} className="w-16 h-16 rounded object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{item.menuName}</h4>
                      <p className="text-xs text-muted-foreground">
                        Rp {item.price.toLocaleString("id-ID")} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateCartMutation.mutate({ menuId: item.menuId, quantity: item.quantity - 1 });
                          } else {
                            removeFromCartMutation.mutate(item.menuId);
                          }
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateCartMutation.mutate({ menuId: item.menuId, quantity: item.quantity + 1 })}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500"
                        onClick={() => removeFromCartMutation.mutate(item.menuId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold text-primary">
                      Rp {cartTotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? "Memproses..." : "Checkout"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-2 px-6 flex justify-between items-center z-50 shadow-lg">
        <button
          onClick={() => setLocation("/consumer/dashboard")}
          className="flex flex-col items-center gap-1 text-primary"
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Beranda</span>
        </button>
        <button
          onClick={() => setLocation("/consumer/favorites")}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
        >
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

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
}


