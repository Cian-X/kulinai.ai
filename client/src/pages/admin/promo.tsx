import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAIGeneratePromo } from "@/hooks/use-ai";
import type { AIPromoResponse } from "@/types/api";

export default function AdminPromo() {
  const [menuName, setMenuName] = useState("");
  const [price, setPrice] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [tone, setTone] = useState("Santai");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const generatePromoMutation = useAIGeneratePromo();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!menuName || !price || !targetMarket) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon isi nama menu, harga, dan target pasar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generatePromoMutation.mutateAsync({
        menuName,
        price: Number(price),
        targetMarket,
        tone,
        additionalInfo: additionalInfo || undefined,
      }) as AIPromoResponse;

      setGeneratedCaption(result.caption || "");
      setGeneratedHashtags(result.hashtags || []);
      toast({
        title: "Berhasil!",
        description: "Caption promosi berhasil dibuat oleh AI.",
      });
    } catch (error: any) {
      console.error("Promo generation error:", error);
      toast({
        title: "Error",
        description: error?.message?.includes("401") 
          ? "Masalah koneksi AI. Pastikan API key sudah benar." 
          : "Gagal membuat caption. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    const fullText = generatedCaption + (generatedHashtags.length > 0 ? "\n\n" + generatedHashtags.join(" ") : "");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast({ title: "Tersalin!", description: "Caption berhasil disalin ke clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout title="Generator Promo AI">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buat Materi Promosi</CardTitle>
              <CardDescription>
                Biarkan AI membuatkan caption Instagram, Facebook, atau WhatsApp yang menarik untuk menu Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Menu</Label>
                  <Input 
                    placeholder="Contoh: Ayam Geprek Level 5" 
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Harga</Label>
                  <Input 
                    type="number" 
                    placeholder="25000" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Target Pasar</Label>
                  <Select value={targetMarket} onValueChange={setTargetMarket}>
                    <SelectTrigger>
                      <SelectValue placeholder="Siapa target promosi ini?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mahasiswa / Pelajar (Hemat)">Mahasiswa / Pelajar (Hemat)</SelectItem>
                      <SelectItem value="Orang Kantor (Makan Siang)">Orang Kantor (Makan Siang)</SelectItem>
                      <SelectItem value="Keluarga (Akhir Pekan)">Keluarga (Akhir Pekan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone Bahasa</Label>
                  <div className="flex gap-2">
                    {['Santai', 'Formal', 'Lucu', 'Hype'].map((toneOption) => (
                      <Button 
                        key={toneOption} 
                        type="button" 
                        variant={tone === toneOption ? "default" : "outline"} 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setTone(toneOption)}
                      >
                        {toneOption}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Info Tambahan (Opsional)</Label>
                  <Textarea 
                    placeholder="Contoh: Diskon 20% khusus hari Jumat, Gratis Es Teh..." 
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-orange-600 hover:opacity-90 transition-opacity" 
                  disabled={generatePromoMutation.isPending}
                >
                  {generatePromoMutation.isPending ? (
                    <>
                      <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                      Sedang Meracik Kata...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Caption dengan AI
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full border-2 border-dashed border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Hasil Generator AI</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <AnimatePresence mode="wait">
                {generatedCaption ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="relative bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="space-y-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                        {generatedCaption}
                      </pre>
                      {generatedHashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          {generatedHashtags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <Button variant="ghost" size="icon" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p>Hasil caption akan muncul di sini.</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
