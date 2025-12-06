import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useAIAnalyzeReviews } from "@/hooks/use-ai";
import { Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ReviewsResponse, ReviewForAnalysis, AIAnalyzeReviewsResponse } from "@/types/api";
import type { Review } from "@shared/schema";

const salesData = [
  { name: 'Sen', total: 1200000 },
  { name: 'Sel', total: 1500000 },
  { name: 'Rab', total: 1100000 },
  { name: 'Kam', total: 1800000 },
  { name: 'Jum', total: 2400000 },
  { name: 'Sab', total: 3500000 },
  { name: 'Min', total: 3200000 },
];

const mockReviews = [
  { name: "Sari", rating: 5, comment: "Enak banget ayam gepreknya! Pedesnya pas.", time: "2 jam lalu" },
  { name: "Rudi", rating: 4, comment: "Pelayanan cepat, tapi tempat agak panas.", time: "4 jam lalu" },
  { name: "Dina", rating: 5, comment: "Best nasi goreng in town!", time: "5 jam lalu" },
  { name: "Budi", rating: 3, comment: "Rasanya biasa aja, harganya agak mahal.", time: "1 hari lalu" },
  { name: "Siti", rating: 5, comment: "Pelayanan ramah, makanan fresh!", time: "1 hari lalu" },
];

export default function AdminAnalytics() {
  const [sentimentData, setSentimentData] = useState([
    { name: 'Positif', value: 75, color: '#22c55e' },
    { name: 'Netral', value: 20, color: '#eab308' },
    { name: 'Negatif', value: 5, color: '#ef4444' },
  ]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const analyzeReviewsMutation = useAIAnalyzeReviews();

  // Get real reviews from API
  const { data: reviewsForAnalysis = [], isLoading: reviewsLoading } = useQuery<ReviewForAnalysis[]>({
    queryKey: ["/api/reviews/for-analysis"],
  });

  // Get full reviews for display
  const { data: reviews = [] } = useQuery<ReviewsResponse>({
    queryKey: ["/api/reviews"],
  });

  const handleAnalyzeReviews = () => {
    const reviewsList = reviewsForAnalysis as ReviewForAnalysis[];
    const reviewsToAnalyze = reviewsList.length > 0 ? reviewsList : mockReviews;
    analyzeReviewsMutation.mutate(reviewsToAnalyze, {
      onSuccess: (data: AIAnalyzeReviewsResponse) => {
        if (data.sentiment) {
          setSentimentData([
            { name: 'Positif', value: data.sentiment.positive || 0, color: '#22c55e' },
            { name: 'Netral', value: data.sentiment.neutral || 0, color: '#eab308' },
            { name: 'Negatif', value: data.sentiment.negative || 0, color: '#ef4444' },
          ]);
        }
        if (data.insights) setAiInsights(data.insights);
        if (data.recommendations) setAiRecommendations(data.recommendations);
      },
    });
  };

  useEffect(() => {
    // Auto-analyze on mount when reviews are loaded
    const reviewsList = reviewsForAnalysis as ReviewForAnalysis[];
    if (!reviewsLoading && reviewsList.length > 0) {
      handleAnalyzeReviews();
    } else if (!reviewsLoading && reviewsList.length === 0) {
      // Use mock data if no reviews yet
      analyzeReviewsMutation.mutate(mockReviews, {
        onSuccess: (data: AIAnalyzeReviewsResponse) => {
          if (data.sentiment) {
            setSentimentData([
              { name: 'Positif', value: data.sentiment.positive || 0, color: '#22c55e' },
              { name: 'Netral', value: data.sentiment.neutral || 0, color: '#eab308' },
              { name: 'Negatif', value: data.sentiment.negative || 0, color: '#ef4444' },
            ]);
          }
          if (data.insights) setAiInsights(data.insights);
          if (data.recommendations) setAiRecommendations(data.recommendations);
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewsLoading, reviewsForAnalysis.length]);
  return (
    <AdminLayout title="Analisis AI & Laporan">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Grafik Penjualan Mingguan</CardTitle>
            <CardDescription>Total omzet 7 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `Rp${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => [`Rp ${value.toLocaleString()}`, "Total"]}
                  />
                  <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sentimen Pelanggan</CardTitle>
                <CardDescription>Analisis AI dari ulasan</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAnalyzeReviews}
                disabled={analyzeReviewsMutation.isPending}
              >
                {analyzeReviewsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
             <div className="h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-4">
              {sentimentData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rekomendasi AI</CardTitle>
            <CardDescription>Actionable insights untuk bisnis Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyzeReviewsMutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Menganalisis review...</span>
              </div>
            ) : (
              <>
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-1">Insight #{idx + 1}</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{insight}</p>
                  </div>
                ))}
                {aiRecommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                    <h4 className="font-bold text-orange-700 dark:text-orange-300 mb-1">Rekomendasi #{idx + 1}</h4>
                    <p className="text-sm text-orange-600 dark:text-orange-400">{rec}</p>
                  </div>
                ))}
                {aiInsights.length === 0 && aiRecommendations.length === 0 && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/20 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center text-sm text-muted-foreground">
                    Klik tombol analisis untuk mendapatkan insight AI
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle>Review Terbaru</CardTitle>
             <CardDescription>Apa kata pelanggan hari ini?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(reviews as Review[]).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Belum ada review</p>
            ) : (
              (reviews as Review[]).slice(0, 5).map((review, i) => {
                const timeAgo = review.createdAt 
                  ? new Date(review.createdAt).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Baru saja';
                
                return (
                  <div key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold">{review.userName}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    </div>
                    <div className="flex text-yellow-400 mb-1">
                      {[...Array(review.rating)].map((_, i) => <span key={i}>★</span>)}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    {review.menuName && (
                      <p className="text-xs text-muted-foreground mt-1">Menu: {review.menuName}</p>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
