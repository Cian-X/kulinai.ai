import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { 
  Users, 
  TrendingUp, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Loader2
} from "lucide-react";
import { useAIPriceStockRecommendations } from "@/hooks/use-ai";
import type { OrdersResponse, ReviewsResponse, MenusResponse, AIPriceStockResponse } from "@/types/api";
import type { Order, Review } from "@shared/schema";

export default function AdminDashboard() {
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const priceStockMutation = useAIPriceStockRecommendations();

  // Get real data from API
  const { data: orders = [] } = useQuery<OrdersResponse>({
    queryKey: ["/api/orders"],
  });

  const { data: reviews = [] } = useQuery<ReviewsResponse>({
    queryKey: ["/api/reviews"],
  });

  const { data: menus = [] } = useQuery<MenusResponse>({
    queryKey: ["/api/menus"],
  });

  useEffect(() => {
    // Calculate sales data from orders
    const ordersList = orders as Order[];
    const salesMap = new Map<string, { quantity: number; revenue: number }>();
    ordersList.forEach((order) => {
      order.items.forEach((item) => {
        const existing = salesMap.get(item.menuName) || { quantity: 0, revenue: 0 };
        salesMap.set(item.menuName, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity),
        });
      });
    });

    const salesData = Array.from(salesMap.entries()).map(([menuName, data]) => ({
      menuName,
      ...data,
    }));

    // Format reviews for AI
    const reviewsList = reviews as Review[];
    const formattedReviews = reviewsList.map((r) => ({
      menuName: r.menuName,
      rating: r.rating,
      comment: r.comment,
    }));

    // Mock stock levels (in production, get from inventory system)
    const stockLevels = [
      { itemName: "Ayam Potong", currentStock: 30, minStock: 50 },
      { itemName: "Beras", currentStock: 100, minStock: 80 },
      { itemName: "Minyak Goreng", currentStock: 20, minStock: 30 },
    ];

    const aiData = {
      salesData: salesData.length > 0 ? salesData : [
        { menuName: "Ayam Geprek Level 5", quantity: 150, revenue: 3750000 },
        { menuName: "Nasi Goreng Spesial", quantity: 120, revenue: 2400000 },
        { menuName: "Es Kopi Susu", quantity: 200, revenue: 2000000 },
      ],
      reviews: formattedReviews.length > 0 ? formattedReviews : [
        { menuName: "Ayam Geprek Level 5", rating: 5, comment: "Enak banget!" },
      ],
      stockLevels,
    };

    priceStockMutation.mutate(aiData, {
      onSuccess: (data: AIPriceStockResponse) => {
        if (data.insights) setAiInsights(data.insights);
      },
    });
  }, [orders, reviews]);

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">Rp 12.450.000</div>
            <div className="flex items-center mt-1 text-xs">
              <span className="text-green-600 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +12.5%
              </span>
              <span className="text-muted-foreground ml-2">dari bulan lalu</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pesanan Hari Ini</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">145</div>
            <div className="flex items-center mt-1 text-xs">
              <span className="text-green-600 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +5.2%
              </span>
              <span className="text-muted-foreground ml-2">dari kemarin</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pelanggan Baru</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">32</div>
            <div className="flex items-center mt-1 text-xs">
              <span className="text-red-500 font-bold flex items-center">
                <ArrowDownRight className="w-3 h-3 mr-1" /> -2.1%
              </span>
              <span className="text-muted-foreground ml-2">dari kemarin</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Aktivitas Terkini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { title: "Pesanan Baru #ORD-009", time: "2 menit lalu", type: "order" },
                { title: "Stok 'Ayam Potong' Menipis", time: "15 menit lalu", type: "alert" },
                { title: "Review Bintang 5 dari Sarah", time: "1 jam lalu", type: "review" },
                { title: "Laporan Harian Siap", time: "3 jam lalu", type: "system" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`mt-1 w-2 h-2 rounded-full ${item.type === 'alert' ? 'bg-red-500' : 'bg-primary'}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-gradient-to-br from-primary to-orange-600 text-white border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">AI Assistant Insight</CardTitle>
              {priceStockMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin text-white/80" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priceStockMutation.isPending ? (
                <p className="text-white/90 leading-relaxed">
                  AI sedang menganalisis data penjualan dan review...
                </p>
              ) : aiInsights.length > 0 ? (
                <div className="space-y-3">
                  {aiInsights.map((insight, idx) => (
                    <p key={idx} className="text-white/90 leading-relaxed">
                      {insight}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-white/90 leading-relaxed">
                  "Halo Pak Budi! Berdasarkan data hari ini, menu <strong>Ayam Geprek</strong> sangat diminati saat jam makan siang. 
                  Saran saya, tingkatkan stok ayam untuk besok siang dan coba buat promo <em>Happy Hour</em> jam 2-4 sore untuk meningkatkan penjualan minuman."
                </p>
              )}
              <Button 
                variant="secondary" 
                className="w-full text-primary font-bold"
                onClick={() => {
                  const ordersList = orders as Order[];
                  const salesMap = new Map<string, { quantity: number; revenue: number }>();
                  ordersList.forEach((order) => {
                    order.items.forEach((item) => {
                      const existing = salesMap.get(item.menuName) || { quantity: 0, revenue: 0 };
                      salesMap.set(item.menuName, {
                        quantity: existing.quantity + item.quantity,
                        revenue: existing.revenue + (item.price * item.quantity),
                      });
                    });
                  });

                  const salesData = Array.from(salesMap.entries()).map(([menuName, data]) => ({
                    menuName,
                    ...data,
                  }));

                  const reviewsList = reviews as Review[];
                  const formattedReviews = reviewsList.map((r) => ({
                    menuName: r.menuName,
                    rating: r.rating,
                    comment: r.comment,
                  }));

                  const stockLevels = [
                    { itemName: "Ayam Potong", currentStock: 30, minStock: 50 },
                    { itemName: "Beras", currentStock: 100, minStock: 80 },
                  ];

                  priceStockMutation.mutate({
                    salesData: salesData.length > 0 ? salesData : [
                      { menuName: "Ayam Geprek Level 5", quantity: 150, revenue: 3750000 },
                    ],
                    reviews: formattedReviews.length > 0 ? formattedReviews : [],
                    stockLevels,
                  }, {
                    onSuccess: (data: AIPriceStockResponse) => {
                      if (data.insights) setAiInsights(data.insights);
                    },
                  });
                }}
                disabled={priceStockMutation.isPending}
              >
                {priceStockMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Refresh Analisis AI
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
