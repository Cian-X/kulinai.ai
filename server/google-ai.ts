/**
 * Google AI Studio (Gemini) API client utility
 */

const GOOGLE_AI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// API Key dari Google AI Studio
const DEFAULT_GOOGLE_AI_KEY = "AIzaSyB9LbiSzpfxLxnkOqz_rEnmlq5ph7ZnEwQ";

export interface GoogleAIMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface GoogleAIRequest {
  contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Get Google AI API key from environment or use default
 */
function getGoogleAIKey(): string {
  // Priority 1: Cek dari .env file
  const envKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (envKey && envKey.trim().length > 20) {
    const cleaned = envKey.trim();
    console.log("✅ Using Google AI key from .env file");
    return cleaned;
  }
  
  // Priority 2: Gunakan default hardcoded
  console.log("✅ Using default Google AI key (hardcoded)");
  return DEFAULT_GOOGLE_AI_KEY;
}

/**
 * Convert messages format from Kolosal to Google AI format
 */
function convertMessages(messages: Array<{ role: string; content: string }>): GoogleAIRequest["contents"] {
  return messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));
}

/**
 * Google AI chat completion
 */
export async function googleAIChatCompletions(
  messages: Array<{ role: string; content: string }>,
  options?: {
    temperature?: number;
    max_tokens?: number;
  }
): Promise<{ content: string }> {
  const apiKey = getGoogleAIKey();
  
  const requestBody: GoogleAIRequest = {
    contents: convertMessages(messages),
    generationConfig: {
      temperature: options?.temperature || 0.7,
      maxOutputTokens: options?.max_tokens || 1024,
    },
  };

  try {
    const url = `${GOOGLE_AI_API_URL}?key=${apiKey}`;
    
    console.log(`🔑 [Google AI] Request - Model: gemini-1.5-flash, Messages: ${messages.length}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Google AI] Error ${response.status}: ${errorText.substring(0, 200)}`);
      
      if (response.status === 401) {
        throw new Error(`Google AI authentication failed (401) - Invalid API key`);
      } else if (response.status === 400) {
        throw new Error(`Google AI bad request (400) - ${errorText.substring(0, 100)}`);
      } else {
        throw new Error(`Google AI error: ${response.status} ${response.statusText}`);
      }
    }

    const result: GoogleAIResponse = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error("No response from Google AI");
    }
    
    const content = result.candidates[0].content.parts[0].text;
    console.log("✅ [Google AI] Request successful");
    
    return { content };
  } catch (error: any) {
    console.error("❌ Error calling Google AI API:", error.message || error);
    throw error;
  }
}

/**
 * Chatbot Assistant using Google AI
 */
export async function googleAIChatbotAssistant(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  const systemPrompt = `Kamu adalah asisten kuliner AI untuk aplikasi KULINA.AI. Tugasmu membantu pelanggan rumah makan dengan:
- Menjawab pertanyaan tentang menu makanan dan minuman
- Memberikan rekomendasi menu berdasarkan preferensi
- Menjelaskan promo dan diskon yang tersedia
- Menjawab pertanyaan tentang estimasi harga
- Memberikan saran menu sesuai waktu makan (sarapan, makan siang, makan malam)

Gunakan bahasa Indonesia yang ramah, santai, dan mudah dipahami. Jika tidak tahu jawabannya, akui dengan jujur dan tawarkan alternatif.`;

  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  try {
    const response = await googleAIChatCompletions(messages, {
      temperature: 0.7,
      max_tokens: 500,
    });
    return response.content;
  } catch (error: any) {
    console.error("Error in googleAIChatbotAssistant:", error);
    return "Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat atau hubungi admin.";
  }
}

/**
 * Menu Recommendations using Google AI
 */
export async function googleAIGetMenuRecommendations(context: {
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

  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await googleAIChatCompletions(messages, {
      temperature: 0.7,
      max_tokens: 400,
    });
    return response.content;
  } catch (error: any) {
    console.error("Error in googleAIGetMenuRecommendations:", error);
    // Fallback berdasarkan waktu
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

/**
 * Analyze Reviews using Google AI
 */
export async function googleAIAnalyzeReviews(reviews: Array<{ rating: number; comment: string; name: string }>): Promise<{
  sentiment: { positive: number; neutral: number; negative: number };
  insights: string[];
  recommendations: string[];
}> {
  const systemPrompt = `Kamu adalah analis data untuk rumah makan. Analisis review pelanggan dan berikan insight serta rekomendasi.

Format output JSON:
{
  "sentiment": { "positive": 0, "neutral": 0, "negative": 0 },
  "insights": ["insight1", "insight2"],
  "recommendations": ["rekomendasi1", "rekomendasi2"]
}`;

  const reviewsText = reviews.map(r => `- ${r.name}: Rating ${r.rating}/5 - "${r.comment}"`).join("\n");
  const userPrompt = `Analisis review berikut:\n\n${reviewsText}\n\nBerikan analisis sentiment, insight, dan rekomendasi dalam format JSON.`;

  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await googleAIChatCompletions(messages, {
      temperature: 0.3,
      max_tokens: 1000,
    });
    
    // Parse JSON dari response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sentiment: parsed.sentiment || { positive: 0, neutral: 0, negative: 0 },
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
      };
    }
    
    // Fallback jika tidak bisa parse JSON
    const positive = reviews.filter(r => r.rating >= 4).length;
    const negative = reviews.filter(r => r.rating <= 2).length;
    const neutral = reviews.length - positive - negative;
    
    return {
      sentiment: { positive, neutral, negative },
      insights: ["Analisis review sedang diproses"],
      recommendations: ["Terus tingkatkan kualitas pelayanan"],
    };
  } catch (error: any) {
    console.error("Error in googleAIAnalyzeReviews:", error);
    const positive = reviews.filter(r => r.rating >= 4).length;
    const negative = reviews.filter(r => r.rating <= 2).length;
    const neutral = reviews.length - positive - negative;
    
    return {
      sentiment: { positive, neutral, negative },
      insights: ["Sistem sedang mengalami gangguan. Pastikan koneksi internet stabil dan coba refresh halaman."],
      recommendations: [],
    };
  }
}

/**
 * Generate Promo Caption using Google AI
 */
export async function googleAIGeneratePromoCaption(data: {
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

  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await googleAIChatCompletions(messages, {
      temperature: 0.8,
      max_tokens: 500,
    });
    
    // Parse JSON dari response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        caption: parsed.caption || `🔥 PROMO SPESIAL! 🔥\n\n${data.menuName} dengan harga spesial Rp ${data.price.toLocaleString('id-ID')}!`,
        hashtags: parsed.hashtags || ["#KulinaAI", "#PromoMakanan", "#Foodie"],
      };
    }
    
    // Fallback
    return {
      caption: `🔥 PROMO SPESIAL! 🔥\n\n${data.menuName} dengan harga spesial Rp ${data.price.toLocaleString('id-ID')}! Jangan sampai kehabisan! 🍽️`,
      hashtags: ["#KulinaAI", "#PromoMakanan", "#Foodie"],
    };
  } catch (error: any) {
    console.error("Error in googleAIGeneratePromoCaption:", error);
    return {
      caption: `🔥 PROMO SPESIAL! 🔥\n\n${data.menuName} dengan harga spesial Rp ${data.price.toLocaleString('id-ID')}! Jangan sampai kehabisan! 🍽️\n\n#KulinaAI #PromoMakanan #Foodie`,
      hashtags: ["#KulinaAI", "#PromoMakanan", "#Foodie"],
    };
  }
}

