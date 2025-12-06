/**
 * Kolosal AI API client utility
 */

const KOLOSAL_API_URL = "https://api.kolosal.ai/v1/chat/completions";

// API Key - UTUH dengan prefix kol_ (TIDAK BOLEH DIEDIT ATAU DIHAPUS)
const DEFAULT_API_KEY = "kol_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZmU5ZjgzNWUtYmJhYS00ODQ2LWI4NWEtMDQ3NzRmZjA0ODk3Iiwia2V5X2lkIjoiY2I2Njg4ODMtNzA3MC00ZGIyLTlhNmMtMDc5MTc0MzhiZjEzIiwia2V5X25hbWUiOiJwZWN1dCIsImVtYWlsIjoicGF0dXJvaG1hbmFiZHVsYXppejAxQGdtYWlsLmNvbSIsInJhdGVfbGltaXRfcnBzIjpudWxsLCJtYXhfY3JlZGl0X3VzZSI6bnVsbCwiY3JlYXRlZF9hdCI6MTc2NTAwMTYzNiwiZXhwaXJlc19hdCI6MTc5NjUzNzYzNiwiaWF0IjoxNzY1MDAxNjM2fQ.0Gf53Dn4QIuKypnXqbG-BEBujrO0Vy0FBz1hagWN0g8";

/**
 * Get API key from environment (.env file) or use default
 * API KEY TIDAK BOLEH DIEDIT ATAU DIHAPUS - UTUH dengan prefix kol_
 */
function getApiKey(): string {
  // Priority 1: Cek dari .env file (via dotenv)
  const envKey = process.env.KOLOSAL_API_KEY;
  
  if (envKey && envKey.trim().length > 50) {
    // Hanya remove whitespace dan newlines, TIDAK hapus prefix kol_ atau edit apapun
    let cleaned = envKey.trim();
    cleaned = cleaned.replace(/\s+/g, '').replace(/[\n\r]/g, '');
    
    // Validasi: harus ada prefix kol_ dan panjang minimal
    if (cleaned.toLowerCase().startsWith("kol_") && cleaned.length >= 440) {
      console.log("✅ Using API key from .env file (UTUH dengan prefix kol_, length:", cleaned.length + ")");
      return cleaned; // Return UTUH tanpa di-edit
    } else {
      console.warn("⚠️  API key from .env format tidak valid, using default");
      console.warn("   Length:", cleaned.length, "Starts with:", cleaned.substring(0, 10));
    }
  } else {
    console.log("ℹ️  No KOLOSAL_API_KEY in .env, using default");
  }
  
  // Priority 2: Gunakan default hardcoded (UTUH dengan prefix kol_)
  let apiKey = DEFAULT_API_KEY.trim();
  apiKey = apiKey.replace(/\s+/g, '').replace(/[\n\r]/g, '');
  
  // Validasi: harus ada prefix kol_ dan panjang minimal
  if (!apiKey || !apiKey.toLowerCase().startsWith("kol_") || apiKey.length < 440) {
    console.error("❌ DEFAULT_API_KEY is invalid");
    console.error(`   Length: ${apiKey?.length}`);
    console.error(`   Starts with: ${apiKey?.substring(0, 10)}`);
    throw new Error("DEFAULT_API_KEY is invalid");
  }
  
  console.log("✅ Using default API key (UTUH dengan prefix kol_, length:", apiKey.length + ")");
  return apiKey; // Return UTUH tanpa di-edit
}

export interface KolosalMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface KolosalChatRequest {
  model?: string;
  messages: KolosalMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface KolosalChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: KolosalMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function chatCompletions(
  messages: KolosalMessage[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
): Promise<KolosalChatResponse> {
  // Get API key dari .env atau default (UTUH dengan prefix kol_)
  const apiKey = getApiKey();

  // Final validation - pastikan format benar dengan prefix kol_
  if (!apiKey || !apiKey.toLowerCase().startsWith("kol_") || apiKey.length < 440 || apiKey.length > 500) {
    console.error("❌ Invalid API key format");
    console.error("   Length:", apiKey?.length);
    console.error("   Starts with:", apiKey?.substring(0, 10));
    throw new Error("API key is invalid - must start with kol_ and be 440-500 chars");
  }
  
  // Validasi: harus ada prefix kol_ dan karakter valid setelahnya
  if (!/^kol_[A-Za-z0-9._-]+$/.test(apiKey)) {
    console.error("❌ API key contains invalid characters");
    console.error("   First 50 chars:", apiKey.substring(0, 50));
    throw new Error("API key contains invalid characters");
  }

  const requestBody: KolosalChatRequest = {
    model: options?.model || "glm-4-6",
    messages,
    temperature: options?.temperature,
    max_tokens: options?.max_tokens,
  };

  try {
    // Pastikan API key benar-benar bersih
    const finalApiKey = apiKey.trim();
    
    // Debug logging
    console.log(`🔑 [AI] Request - Model: ${requestBody.model}, Key length: ${finalApiKey.length}`);
    
    const response = await fetch(KOLOSAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${finalApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson: any = null;
      
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // Not JSON, use as is
      }
      
      // Provide more helpful error messages
      if (response.status === 401) {
        console.error(`❌ [AI] Auth failed (401) - Invalid token format`);
        console.error(`   API key length: ${finalApiKey.length}`);
        console.error(`   API key starts: ${finalApiKey.substring(0, 30)}...`);
        console.error(`   API key ends: ...${finalApiKey.substring(finalApiKey.length - 20)}`);
        console.error(`   Error response: ${errorText}`);
        
        // Cek apakah token expired atau invalid
        try {
          const parts = finalApiKey.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            const expDate = new Date(payload.exp * 1000);
            const now = new Date();
            if (expDate < now) {
              console.error(`   ⚠️  TOKEN EXPIRED! Expired: ${expDate.toISOString()}, Now: ${now.toISOString()}`);
            } else {
              console.error(`   Token valid until: ${expDate.toISOString()}`);
              console.error(`   Token key_name: ${payload.key_name || 'N/A'}`);
            }
          } else {
            console.error(`   ⚠️  Invalid JWT format (${parts.length} parts, expected 3)`);
          }
        } catch (e) {
          console.error(`   Could not decode token: ${e}`);
        }
        
        throw new Error(`Kolosal API authentication failed (401) - Invalid token format. Check API key validity.`);
      } else if (response.status === 400) {
        console.error(`❌ [AI] Bad request (400)`);
        console.error(`   Error: ${errorText.substring(0, 200)}`);
        console.error(`   Request body:`, JSON.stringify(requestBody, null, 2));
        throw new Error(`Kolosal API bad request (400). Check request format.`);
      } else if (response.status === 500) {
        console.error(`❌ [AI] Error 500: ${errorText.substring(0, 200)}`);
        console.error(`   Model: ${requestBody.model}`);
        console.error(`   Messages count: ${requestBody.messages.length}`);
        console.error(`   Request body preview:`, JSON.stringify({
          model: requestBody.model,
          messages: requestBody.messages.map(m => ({ role: m.role, contentLength: m.content.length })),
          temperature: requestBody.temperature,
          max_tokens: requestBody.max_tokens
        }));
        // Error 500 biasanya dari server Kolosal, bukan dari kita
        // Tapi mungkin model name salah atau format request tidak sesuai
        const errorMsg = errorJson?.error?.message || errorText.substring(0, 100);
        throw new Error(`Kolosal API server error (500) - ${errorMsg}. Model mungkin tidak tersedia atau server sedang bermasalah.`);
      } else {
        console.error(`❌ [AI] Error ${response.status}: ${errorText.substring(0, 200)}`);
        throw new Error(`Kolosal API error: ${response.status} ${response.statusText}`);
      }
    }

    const result = await response.json();
    console.log("✅ [AI] Request successful");
    return result;
  } catch (error: any) {
    console.error("❌ Error calling Kolosal API:", error.message || error);
    throw error;
  }
}

/**
 * Specialized AI functions for KULINA.AI features
 */

// Chatbot Assistant for Consumers
export async function chatbotAssistant(userMessage: string, conversationHistory: KolosalMessage[] = []): Promise<string> {
  const systemPrompt = `Kamu adalah asisten kuliner AI untuk aplikasi KULINA.AI. Tugasmu membantu pelanggan rumah makan dengan:
- Menjawab pertanyaan tentang menu makanan dan minuman
- Memberikan rekomendasi menu berdasarkan preferensi
- Menjelaskan promo dan diskon yang tersedia
- Menjawab pertanyaan tentang estimasi harga
- Memberikan saran menu sesuai waktu makan (sarapan, makan siang, makan malam)

Gunakan bahasa Indonesia yang ramah, santai, dan mudah dipahami. Jika tidak tahu jawabannya, akui dengan jujur dan tawarkan alternatif.`;

  const messages: KolosalMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  try {
    const response = await chatCompletions(messages, {
      model: "glm-4-6",
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "Maaf, terjadi kesalahan. Silakan coba lagi.";
  } catch (error: any) {
    console.error("Error in chatbotAssistant:", error);
    return "Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat atau hubungi admin.";
  }
}

// Analyze Customer Reviews
export async function analyzeReviews(reviews: Array<{ rating: number; comment: string; name: string }>): Promise<{
  sentiment: { positive: number; neutral: number; negative: number };
  insights: string[];
  recommendations: string[];
}> {
  const reviewsText = reviews.map(r => `Rating: ${r.rating}/5 - ${r.name}: "${r.comment}"`).join("\n");

  const systemPrompt = `Kamu adalah AI analis untuk rumah makan. Analisis review pelanggan berikut dan berikan:
1. Sentimen pelanggan (persentase positif, netral, negatif)
2. Insight utama tentang kepuasan pelanggan, keluhan pelayanan, dan kualitas rasa
3. Rekomendasi tindakan yang bisa dilakukan pemilik rumah makan

Format output dalam JSON dengan struktur:
{
  "sentiment": { "positive": 75, "neutral": 20, "negative": 5 },
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["rekomendasi 1", "rekomendasi 2"]
}`;

  const messages: KolosalMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Analisis review berikut:\n\n${reviewsText}` },
  ];

  try {
    const response = await chatCompletions(messages, {
      model: "glm-4-6",
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "{}";
    
    try {
      // Extract JSON from response (might have markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing review analysis JSON:", parseError);
      // Fallback if JSON parsing fails
      return {
        sentiment: { positive: 70, neutral: 20, negative: 10 },
        insights: ["AI sedang menganalisis review pelanggan..."],
        recommendations: ["Terus tingkatkan kualitas pelayanan dan perhatikan feedback pelanggan"],
      };
    }
  } catch (error: any) {
    console.error("Error in analyzeReviews:", error);
    // Return fallback analysis
    return {
      sentiment: { positive: 70, neutral: 20, negative: 10 },
      insights: ["Sistem sedang mengalami gangguan. Silakan coba lagi nanti."],
      recommendations: ["Pastikan koneksi internet stabil dan coba refresh halaman"],
    };
  }
}

// Generate Promo Caption
export async function generatePromoCaption(data: {
  menuName: string;
  price: number;
  targetMarket: string;
  tone?: string;
  additionalInfo?: string;
}): Promise<{ caption: string; hashtags: string[] }> {
  const systemPrompt = `Kamu adalah copywriter profesional untuk konten promosi makanan. Buatkan caption Instagram/Facebook/WhatsApp yang menarik untuk promosi menu rumah makan.

Format output JSON:
{
  "caption": "caption lengkap dengan emoji yang menarik",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}

Gunakan bahasa Indonesia yang sesuai dengan target pasar dan tone yang diminta.`;

  const userPrompt = `Buatkan caption promosi untuk:
- Menu: ${data.menuName}
- Harga: Rp ${data.price.toLocaleString('id-ID')}
- Target Pasar: ${data.targetMarket}
- Tone: ${data.tone || 'Santai'}
${data.additionalInfo ? `- Info Tambahan: ${data.additionalInfo}` : ''}`;

  const messages: KolosalMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await chatCompletions(messages, {
      model: "glm-4-6",
      temperature: 0.8,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content || "{}";
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing promo caption JSON:", parseError);
      return {
        caption: `🔥 PROMO SPESIAL! 🔥\n\n${data.menuName} dengan harga spesial Rp ${data.price.toLocaleString('id-ID')}! Jangan sampai kehabisan! 🍽️`,
        hashtags: ["#KulinaAI", "#PromoMakanan", "#Foodie"],
      };
    }
  } catch (error: any) {
    console.error("Error in generatePromoCaption:", error);
    return {
      caption: `🔥 PROMO SPESIAL! 🔥\n\n${data.menuName} dengan harga spesial Rp ${data.price.toLocaleString('id-ID')}! Jangan sampai kehabisan! 🍽️\n\n#KulinaAI #PromoMakanan #Foodie`,
      hashtags: ["#KulinaAI", "#PromoMakanan", "#Foodie"],
    };
  }
}

// Menu Recommendations for Consumers
export async function getMenuRecommendations(context: {
  orderHistory?: string[];
  preferences?: string;
  timeOfDay?: string;
  currentMood?: string;
}): Promise<string> {
  const systemPrompt = `Kamu adalah asisten AI yang memberikan rekomendasi menu makanan. Berdasarkan riwayat pesanan, preferensi, waktu makan, dan mood pelanggan, berikan rekomendasi menu yang personal dan menarik.

Gunakan bahasa Indonesia yang ramah dan persuasif.`;

  const userPrompt = `Berdasarkan informasi berikut, berikan rekomendasi menu:
${context.orderHistory ? `- Riwayat pesanan: ${context.orderHistory.join(", ")}` : ""}
${context.preferences ? `- Preferensi: ${context.preferences}` : ""}
${context.timeOfDay ? `- Waktu: ${context.timeOfDay}` : ""}
${context.currentMood ? `- Mood: ${context.currentMood}` : ""}

Berikan rekomendasi yang personal dan jelaskan alasannya.`;

  const messages: KolosalMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await chatCompletions(messages, {
      model: "glm-4-6",
      temperature: 0.7,
      max_tokens: 400,
    });

    return response.choices[0]?.message?.content || "Silakan coba menu terlaris kami!";
  } catch (error: any) {
    console.error("Error in getMenuRecommendations:", error);
    // Return fallback recommendation based on time
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      return "Sarapan pagi yang sehat? Coba menu favorit kami untuk memulai hari! 🍳";
    } else if (hour >= 11 && hour < 15) {
      return "Waktunya makan siang! Coba menu terlaris kami hari ini! 🍽️";
    } else if (hour >= 15 && hour < 18) {
      return "Sore hari yang pas untuk minuman segar! Coba menu minuman favorit kami! 🧊";
    } else {
      return "Malam yang sempurna untuk makan malam! Coba menu spesial kami! 🌙";
    }
  }
}

// Price & Stock Recommendations for Admin
export async function getPriceStockRecommendations(data: {
  salesData?: Array<{ menuName: string; quantity: number; revenue: number }>;
  reviews?: Array<{ menuName: string; rating: number; comment: string }>;
  stockLevels?: Array<{ itemName: string; currentStock: number; minStock: number }>;
}): Promise<{
  priceRecommendations: Array<{ menuName: string; currentPrice: number; recommendedPrice: number; reason: string }>;
  stockRecommendations: Array<{ itemName: string; recommendedQuantity: number; reason: string }>;
  insights: string[];
}> {
  const systemPrompt = `Kamu adalah konsultan bisnis AI untuk rumah makan. Analisis data penjualan, review, dan stok untuk memberikan rekomendasi harga dan stok yang optimal.

Format output JSON:
{
  "priceRecommendations": [{"menuName": "...", "currentPrice": 0, "recommendedPrice": 0, "reason": "..."}],
  "stockRecommendations": [{"itemName": "...", "recommendedQuantity": 0, "reason": "..."}],
  "insights": ["insight 1", "insight 2"]
}`;

  const dataText = `
Data Penjualan: ${JSON.stringify(data.salesData || [])}
Review Pelanggan: ${JSON.stringify(data.reviews || [])}
Level Stok: ${JSON.stringify(data.stockLevels || [])}
`;

  const messages: KolosalMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Analisis data berikut dan berikan rekomendasi:\n${dataText}` },
  ];

  try {
    const response = await chatCompletions(messages, {
      model: "glm-4-6",
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing price/stock recommendations JSON:", parseError);
      return {
        priceRecommendations: [],
        stockRecommendations: [],
        insights: ["AI sedang menganalisis data penjualan dan review..."],
      };
    }
  } catch (error: any) {
    console.error("Error in getPriceStockRecommendations:", error);
    return {
      priceRecommendations: [],
      stockRecommendations: [],
      insights: ["Sistem sedang mengalami gangguan. Pastikan koneksi internet stabil dan coba refresh halaman."],
    };
  }
}

