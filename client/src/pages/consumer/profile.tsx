import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Heart, User, ShoppingBag, Edit2, Save, X, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { OrdersResponse } from "@/types/api";
import type { Order } from "@shared/schema";

const USER_ID = "consumer-1"; // In production, get from auth

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("Budi Santoso");
  const [phone, setPhone] = useState("081234567890");
  const [email, setEmail] = useState("budi@example.com");
  const [address, setAddress] = useState("Jl. Sudirman No. 45, Jakarta");

  const { data: orders = [] } = useQuery<OrdersResponse>({
    queryKey: [`/api/orders/user/${USER_ID}`],
  });

  const handleSave = () => {
    // In production, save to API
    setIsEditing(false);
    toast({ title: "Profil berhasil diperbarui" });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 font-sans">
      <header className="bg-white dark:bg-zinc-900 sticky top-0 z-10 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Profil Saya</h1>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Yakin ingin keluar?")) {
                      toast({ title: "Berhasil logout" });
                      setLocation("/");
                    }
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Data Diri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              {isEditing ? (
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              ) : (
                <p className="text-sm">{name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              {isEditing ? (
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              ) : (
                <p className="text-sm">{phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              {isEditing ? (
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              ) : (
                <p className="text-sm">{email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              {isEditing ? (
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              ) : (
                <p className="text-sm">{address}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada pesanan
              </p>
            ) : (
              <div className="space-y-3">
                {(orders as Order[]).slice(0, 5).map((order) => (
                  <div key={order.id} className="border-b border-zinc-200 dark:border-zinc-800 pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm">#{order.id.slice(0, 8)}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'completed' ? 'Selesai' :
                         order.status === 'processing' ? 'Diproses' : 'Menunggu'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} item • Rp {order.total.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
        <button
          onClick={() => setLocation("/consumer/favorites")}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
        >
          <Heart className="w-6 h-6" />
          <span className="text-[10px] font-medium">Favorit</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-primary">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </nav>
    </div>
  );
}
