/**
 * OpenRouter API client utility
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// API Key dari OpenRouter
const DEFAULT_OPENROUTER_KEY = "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";

// Model yang digunakan
const DEFAULT_MODEL = "amazon/nova-2-lite-v1:free";

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: OpenRouterMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Get OpenRouter API key from environment or use default
 */
function getOpenRouterKey(): string {
  // Priority 1: Cek dari .env file
  const envKey = process.env.OPENROUTER_API_KEY;
  
  if (envKey && envKey.trim().length > 20) {
    const cleaned = envKey.trim();
    console.log("✅ Using OpenRouter key from .env file");
    return cleaned;
  }
  
  // Priority 2: Gunakan default hardcoded
  console.log("✅ Using default OpenRouter key (hardcoded)");
  return DEFAULT_OPENROUTER_KEY;
}

/**
 * OpenRouter chat completion
 */
export async function openRouterChatCompletions(
  messages: OpenRouterMessage[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
): Promise<OpenRouterResponse> {
  const apiKey = getOpenRouterKey();
  
  const requestBody: OpenRouterRequest = {
    model: options?.model || DEFAULT_MODEL,
    messages,
    temperature: options?.temperature,
    max_tokens: options?.max_tokens,
  };

  try {
    console.log(`🔑 [OpenRouter] Request - Model: ${requestBody.model}, Messages: ${messages.length}`);
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://kulina.ai", // Optional: untuk tracking
        "X-Title": "KULINA.AI", // Optional: untuk tracking
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [OpenRouter] Error ${response.status}: ${errorText.substring(0, 200)}`);
      
      if (response.status === 401) {
        throw new Error(`OpenRouter authentication failed (401) - Invalid API key`);
      } else if (response.status === 400) {
        throw new Error(`OpenRouter bad request (400) - ${errorText.substring(0, 100)}`);
      } else if (response.status === 429) {
        throw new Error(`OpenRouter rate limit exceeded (429) - Too many requests`);
      } else {
        throw new Error(`OpenRouter error: ${response.status} ${response.statusText}`);
      }
    }

    const result: OpenRouterResponse = await response.json();
    console.log("✅ [OpenRouter] Request successful");
    
    return result;
  } catch (error: any) {
    console.error("❌ Error calling OpenRouter API:", error.message || error);
    throw error;
  }
}

/**
 * Chatbot Assistant using OpenRouter
 */
export async function openRouterChatbotAssistant(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  const systemPrompt = `Kamu adalah asisten kuliner AI untuk aplikasi KULINA.AI. Tugasmu membantu pelanggan rumah makan dengan:
- Menjawab pertanyaan tentang menu makanan dan minuman
- Memberikan rekomendasi menu berdasarkan preferensi
- Menjelaskan promo dan diskon yang tersedia
- Menjawab pertanyaan tentang estimasi harga
- Memberikan saran menu sesuai waktu makan (sarapan, makan siang, makan malam)

PENTING SEKALI:
- JANGAN gunakan markdown formatting seperti **bold**, *italic*, # header, ---, dll
- JANGAN gunakan simbol apapun seperti *, #, -, ---, **, dll
- HANYA gunakan PLAIN TEXT biasa dengan line breaks untuk struktur
- Gunakan emoji secukupnya (maksimal 2-3 emoji)
- Output HARUS murni teks biasa tanpa simbol markdown apapun

Gunakan bahasa Indonesia yang ramah, santai, dan mudah dipahami. Jika tidak tahu jawabannya, akui dengan jujur dan tawarkan alternatif.

CONTOH OUTPUT YANG BENAR:
"Hai! Saya punya rekomendasi minuman untukmu. Coba Es Kopi Susu yang segar dan nikmat. Minuman ini cocok untuk malam hari!"

CONTOH OUTPUT YANG SALAH (JANGAN LAKUKAN):
"### Hey! **Rekomendasi Minuman** # Minuman #1: Es Kopi ---"

INGAT: HANYA PLAIN TEXT, TIDAK ADA SIMBOL MARKDOWN!`;

  // Filter dan convert conversationHistory - pastikan format benar
  // Hapus system messages dari history (karena kita akan tambahkan sendiri)
  // Pastikan tidak ada assistant message di awal
  const filteredHistory: OpenRouterMessage[] = conversationHistory
    .filter(msg => msg.role !== "system") // Hapus system dari history
    .map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content
    }))
    .filter((msg, index, arr) => {
      // Pastikan tidak ada assistant message di awal (setelah system)
      if (index === 0 && msg.role === "assistant") {
        return false; // Skip assistant di posisi pertama
      }
      return true;
    });

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    ...filteredHistory,
    { role: "user", content: userMessage },
  ];

  try {
    const response = await openRouterChatCompletions(messages, {
      model: DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const content = response.choices[0]?.message?.content || "";
    // Clean markdown dari response - MULTIPLE PASSES
    let cleanContent = cleanMarkdown(content);
    // Second pass untuk memastikan semua simbol terhapus
    cleanContent = cleanMarkdown(cleanContent);
    // Final pass - hapus semua simbol yang mungkin masih ada
    cleanContent = cleanContent.replace(/\*\*/g, '');
    cleanContent = cleanContent.replace(/\*/g, '');
    cleanContent = cleanContent.replace(/#/g, '');
    cleanContent = cleanContent.replace(/---/g, '');
    cleanContent = cleanContent.replace(/```/g, '');
    cleanContent = cleanContent.replace(/`/g, '');
    cleanContent = cleanContent.trim();
    
    return cleanContent || "Maaf, terjadi kesalahan. Silakan coba lagi.";
  } catch (error: any) {
    console.error("Error in openRouterChatbotAssistant:", error);
    return "Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat atau hubungi admin.";
  }
}

/**
 * Menu Recommendations using OpenRouter - CLEAN OUTPUT
 */
export async function openRouterGetMenuRecommendations(context: {
  orderHistory?: string[];
  preferences?: string;
  timeOfDay?: string;
  currentMood?: string;
}): Promise<string> {
  const systemPrompt = `Kamu adalah asisten AI yang memberikan rekomendasi menu makanan. Berdasarkan riwayat pesanan, preferensi, waktu makan, dan mood pelanggan, berikan rekomendasi menu yang personal dan menarik.

PENTING SEKALI - BACA INI DENGAN TELITI:
- JANGAN gunakan markdown formatting seperti **bold**, *italic*, # header, ---, dll
- JANGAN gunakan simbol apapun seperti *, #, -, ---, **, dll
- HANYA gunakan PLAIN TEXT biasa dengan line breaks untuk struktur
- Gunakan emoji secukupnya (maksimal 2-3 emoji)
- Buat rekomendasi yang natural dan mudah dibaca
- Output HARUS murni teks biasa tanpa simbol markdown apapun
- Gunakan bahasa Indonesia yang ramah dan persuasif

CONTOH OUTPUT YANG BENAR:
"Hai! Saya punya rekomendasi menu untukmu. Coba Nasi Goreng Spesial yang lezat dan mengenyangkan. Menu ini cocok untuk makan siang!"

CONTOH OUTPUT YANG SALAH (JANGAN LAKUKAN):
"### Hai! **Rekomendasi Menu** # Menu #1: Nasi Goreng ---"

INGAT: HANYA PLAIN TEXT, TIDAK ADA SIMBOL MARKDOWN!`;

  const userPrompt = `Berdasarkan informasi berikut, berikan rekomendasi menu:
${context.orderHistory ? `- Riwayat pesanan: ${context.orderHistory.join(", ")}` : ""}
${context.preferences ? `- Preferensi: ${context.preferences}` : ""}
${context.timeOfDay ? `- Waktu: ${context.timeOfDay}` : ""}
${context.currentMood ? `- Mood: ${context.currentMood}` : ""}

Berikan rekomendasi yang personal dan jelaskan alasannya. 

PENTING: Gunakan PLAIN TEXT MURNI - TIDAK BOLEH ada simbol markdown seperti *, #, ---, **, atau simbol apapun. Hanya teks biasa dan emoji saja.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await openRouterChatCompletions(messages, {
      model: DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: 400,
    });
    
    const content = response.choices[0]?.message?.content || "";
    // Clean markdown dari response - MULTIPLE PASSES
    let cleanContent = cleanMarkdown(content);
    // Second pass untuk memastikan semua simbol terhapus
    cleanContent = cleanMarkdown(cleanContent);
    // Final pass - hapus semua simbol yang mungkin masih ada
    cleanContent = cleanContent.replace(/\*\*/g, '');
    cleanContent = cleanContent.replace(/\*/g, '');
    cleanContent = cleanContent.replace(/#/g, '');
    cleanContent = cleanContent.replace(/---/g, '');
    cleanContent = cleanContent.replace(/```/g, '');
    cleanContent = cleanContent.replace(/`/g, '');
    cleanContent = cleanContent.trim();
    
    return cleanContent || "Silakan coba menu terlaris kami!";
  } catch (error: any) {
    console.error("Error in openRouterGetMenuRecommendations:", error);
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
 * Analyze Reviews using OpenRouter
 */
export async function openRouterAnalyzeReviews(reviews: Array<{ rating: number; comment: string; name: string }>): Promise<{
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
}

Gunakan bahasa Indonesia.`;

  const reviewsText = reviews.map(r => `- ${r.name}: Rating ${r.rating}/5 - "${r.comment}"`).join("\n");
  const userPrompt = `Analisis review berikut:\n\n${reviewsText}\n\nBerikan analisis sentiment, insight, dan rekomendasi dalam format JSON.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await openRouterChatCompletions(messages, {
      model: DEFAULT_MODEL,
      temperature: 0.3,
      max_tokens: 1000,
    });
    
    const content = response.choices[0]?.message?.content || "{}";
    
    // Parse JSON dari response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment || { positive: 0, neutral: 0, negative: 0 },
          insights: parsed.insights || [],
          recommendations: parsed.recommendations || [],
        };
      }
    } catch (parseError) {
      console.error("Error parsing JSON from OpenRouter:", parseError);
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
    console.error("Error in openRouterAnalyzeReviews:", error);
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
 * Clean markdown formatting from text - REMOVE ALL SYMBOLS AND JSON STRUCTURE
 * Output: PLAIN TEXT ONLY, NO SYMBOLS
 */
function cleanMarkdown(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove JSON structure yang terlihat di awal (```json { ...) - AGRESIF
  cleaned = cleaned.replace(/```json\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  cleaned = cleaned.replace(/json\s*/gi, ''); // Remove "json" text jika ada
  
  // Remove JSON object wrapper jika ada - LEBIH AGRESIF
  cleaned = cleaned.replace(/^\s*\{[\s\S]*?"caption"\s*:\s*"/, '');
  cleaned = cleaned.replace(/",?\s*"hashtags"[\s\S]*?\}\s*$/g, '');
  cleaned = cleaned.replace(/^\s*"caption"\s*:\s*"/, '');
  cleaned = cleaned.replace(/",?\s*"hashtags"[\s\S]*$/g, '');
  cleaned = cleaned.replace(/^\s*\{/, ''); // Remove opening brace
  cleaned = cleaned.replace(/\}\s*$/, ''); // Remove closing brace
  cleaned = cleaned.replace(/\{/g, ''); // Remove all opening braces
  cleaned = cleaned.replace(/\}/g, ''); // Remove all closing braces
  
  // Remove markdown headers # Header -> Header (semua level) - HARUS DULUAN
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/^#{1,6}/gm, ''); // Remove # di awal baris tanpa spasi
  
  // Remove markdown bold **text** -> text (multiple passes untuk nested)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // Second pass
  cleaned = cleaned.replace(/\*\*/g, ''); // Remove any remaining **
  cleaned = cleaned.replace(/\*\*/g, ''); // Third pass
  
  // Remove markdown italic *text* -> text
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/\*(?![*])/g, ''); // Remove single * that's not part of **
  
  // Remove markdown horizontal rules ---
  cleaned = cleaned.replace(/^[-]{3,}$/gm, '');
  cleaned = cleaned.replace(/^[=]{3,}$/gm, '');
  
  // Remove markdown links [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove markdown lists markers
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '');
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
  
  // Remove JSON key names yang mungkin masih ada - AGRESIF
  cleaned = cleaned.replace(/"caption"\s*:\s*"/gi, '');
  cleaned = cleaned.replace(/"hashtags"\s*:\s*\[/gi, '');
  cleaned = cleaned.replace(/caption\s*:\s*/gi, '');
  cleaned = cleaned.replace(/hashtags\s*:\s*/gi, '');
  
  // FINAL CLEANUP - Hapus SEMUA simbol yang mungkin masih ada
  cleaned = cleaned.replace(/\*\*/g, ''); // Remove **
  cleaned = cleaned.replace(/\*/g, ''); // Remove *
  cleaned = cleaned.replace(/#/g, ''); // Remove #
  cleaned = cleaned.replace(/---/g, ''); // Remove ---
  cleaned = cleaned.replace(/```/g, ''); // Remove ```
  cleaned = cleaned.replace(/`/g, ''); // Remove `
  cleaned = cleaned.replace(/\{/g, ''); // Remove {
  cleaned = cleaned.replace(/\}/g, ''); // Remove }
  cleaned = cleaned.replace(/"/g, ''); // Remove "
  cleaned = cleaned.replace(/\[/g, ''); // Remove [
  cleaned = cleaned.replace(/\]/g, ''); // Remove ]
  cleaned = cleaned.replace(/\(/g, ''); // Remove (
  cleaned = cleaned.replace(/\)/g, ''); // Remove )
  
  // Remove quotes di awal dan akhir jika ada
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  cleaned = cleaned.replace(/^["']|["']$/gm, ''); // Per line juga
  
  // Remove escape characters
  cleaned = cleaned.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/\\'/g, "'");
  cleaned = cleaned.replace(/\\t/g, ' ');
  cleaned = cleaned.replace(/\\r/g, '');
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/^\s+|\s+$/gm, ''); // Trim setiap baris
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Generate Promo Caption using OpenRouter - FULLY AI GENERATED, CLEAN OUTPUT
 */
export async function openRouterGeneratePromoCaption(data: {
  menuName: string;
  price: number;
  targetMarket: string;
  tone?: string;
  additionalInfo?: string;
}): Promise<{ caption: string; hashtags: string[] }> {
  const systemPrompt = `Kamu adalah copywriter profesional untuk konten promosi makanan. Buatkan caption Instagram/Facebook/WhatsApp yang menarik, kreatif, dan persuasif untuk promosi menu rumah makan.

PENTING SEKALI:
- Buat caption yang UNIK dan SPESIFIK untuk menu "${data.menuName}"
- Sesuaikan dengan jenis makanan/minuman (jika makanan, highlight rasa, tekstur, bahan. Jika minuman, highlight kesegaran, rasa, manfaat)
- Gunakan emoji yang relevan dengan menu (maksimal 3-5 emoji, jangan berlebihan)
- Buat caption yang menarik dan membuat orang ingin membeli
- JANGAN gunakan markdown formatting seperti **bold**, *italic*, # header, ---, dll
- JANGAN gunakan simbol apapun selain emoji dan teks biasa
- Gunakan PLAIN TEXT saja dengan line breaks untuk struktur
- Output HARUS murni teks biasa tanpa simbol markdown apapun
- Format output HARUS JSON dengan struktur:
{
  "caption": "caption lengkap dengan emoji yang menarik dan spesifik untuk menu ini (PLAIN TEXT MURNI, TANPA MARKDOWN, TANPA SIMBOL)",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}

Gunakan bahasa Indonesia yang sesuai dengan target pasar dan tone yang diminta.`;

  const userPrompt = `Buatkan caption promosi yang KREATIF dan SPESIFIK untuk menu ini:
- Menu: ${data.menuName}
- Harga: Rp ${data.price.toLocaleString('id-ID')}
- Target Pasar: ${data.targetMarket}
- Tone: ${data.tone || 'Santai'}
${data.additionalInfo ? `- Info Tambahan: ${data.additionalInfo}` : ''}

Buat caption yang menarik, unik, dan spesifik untuk menu "${data.menuName}". Jangan generic! Sesuaikan dengan jenis makanan/minuman tersebut. 

PENTING: Gunakan PLAIN TEXT MURNI saja - TIDAK BOLEH ada simbol markdown seperti **, *, #, ---, atau simbol apapun. Hanya teks biasa dan emoji saja.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await openRouterChatCompletions(messages, {
      model: DEFAULT_MODEL,
      temperature: 0.9, // Lebih kreatif
      max_tokens: 600,
    });
    
    const content = response.choices[0]?.message?.content || "";
    
    // Parse JSON dari response
    try {
      // Coba extract JSON dari response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.caption) {
            // Clean markdown dan JSON structure dari caption - AGRESIF
            let cleanCaption = String(parsed.caption);
            
            // Hapus semua JSON structure
            cleanCaption = cleanCaption.replace(/^\s*\{[\s\S]*?"caption"\s*:\s*"/, '');
            cleanCaption = cleanCaption.replace(/",?\s*"hashtags"[\s\S]*?\}\s*$/g, '');
            cleanCaption = cleanCaption.replace(/^\s*"caption"\s*:\s*"/, '');
            cleanCaption = cleanCaption.replace(/",?\s*"hashtags"[\s\S]*$/g, '');
            cleanCaption = cleanCaption.replace(/"caption"\s*:\s*"/gi, '');
            cleanCaption = cleanCaption.replace(/^["']|["']$/g, '');
            
            // Clean markdown dengan fungsi
            cleanCaption = cleanMarkdown(cleanCaption);
            
            // Final cleanup - hapus SEMUA simbol yang mungkin masih ada
            cleanCaption = cleanCaption.replace(/\*\*/g, '');
            cleanCaption = cleanCaption.replace(/\*/g, '');
            cleanCaption = cleanCaption.replace(/#/g, '');
            cleanCaption = cleanCaption.replace(/---/g, '');
            cleanCaption = cleanCaption.replace(/```/g, '');
            cleanCaption = cleanCaption.replace(/`/g, '');
            cleanCaption = cleanCaption.replace(/\{/g, ''); // Remove all {
            cleanCaption = cleanCaption.replace(/\}/g, ''); // Remove all }
            cleanCaption = cleanCaption.replace(/"/g, ''); // Remove all "
            cleanCaption = cleanCaption.replace(/^["']|["']$/g, '');
            cleanCaption = cleanCaption.replace(/^["']|["']$/gm, ''); // Per line
            cleanCaption = cleanCaption.replace(/json/gi, ''); // Remove "json" text
            cleanCaption = cleanCaption.trim();
            
            if (cleanCaption.length > 10) {
              return {
                caption: cleanCaption,
                hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ["#KulinaAI", "#PromoMakanan", "#Foodie"],
              };
            }
          }
        } catch (jsonParseError) {
          // JSON parse gagal, lanjut ke fallback
        }
      }
      
      // Jika tidak ada JSON atau parsing gagal, gunakan content langsung
      if (content.trim().length > 20) {
        // Clean markdown dan JSON structure dari content
        let cleanContent = cleanMarkdown(content);
        // Hapus JSON structure jika masih ada
        cleanContent = cleanContent.replace(/^\s*\{[\s\S]*?"caption"\s*:\s*"/, '');
        cleanContent = cleanContent.replace(/",?\s*"hashtags"[\s\S]*?\}\s*$/g, '');
        cleanContent = cleanContent.replace(/^\s*"caption"\s*:\s*"/, '');
        cleanContent = cleanContent.replace(/",?\s*"hashtags"[\s\S]*$/g, '');
        cleanContent = cleanContent.replace(/^["']|["']$/g, '');
        cleanContent = cleanContent.trim();
        
        // Extract hashtags dari content jika ada
        const hashtagMatches = cleanContent.match(/#\w+/g) || [];
        let caption = cleanContent.replace(/#\w+/g, '').trim();
        // Hapus hashtags yang tersisa di akhir
        caption = caption.replace(/\s*#\w+\s*/g, ' ').trim();
        
        if (caption.length > 10) {
          return {
            caption: caption || cleanContent,
            hashtags: hashtagMatches.length > 0 ? hashtagMatches : ["#KulinaAI", "#PromoMakanan", "#Foodie"],
          };
        }
      }
    } catch (parseError) {
      console.error("Error parsing JSON from OpenRouter:", parseError);
      // Jika parsing gagal, gunakan content langsung sebagai caption
      if (content.trim().length > 20) {
        let cleanContent = String(content);
        
        // Hapus JSON structure jika masih ada
        cleanContent = cleanContent.replace(/^\s*\{[\s\S]*?"caption"\s*:\s*"/, '');
        cleanContent = cleanContent.replace(/",?\s*"hashtags"[\s\S]*?\}\s*$/g, '');
        cleanContent = cleanContent.replace(/^\s*"caption"\s*:\s*"/, '');
        cleanContent = cleanContent.replace(/",?\s*"hashtags"[\s\S]*$/g, '');
        cleanContent = cleanContent.replace(/"caption"\s*:\s*"/gi, '');
        cleanContent = cleanContent.replace(/^["']|["']$/g, '');
        
        // Clean markdown
        cleanContent = cleanMarkdown(cleanContent);
        
        // Final cleanup - hapus SEMUA simbol
        cleanContent = cleanContent.replace(/\*\*/g, '');
        cleanContent = cleanContent.replace(/\*/g, '');
        cleanContent = cleanContent.replace(/#/g, '');
        cleanContent = cleanContent.replace(/---/g, '');
        cleanContent = cleanContent.replace(/```/g, '');
        cleanContent = cleanContent.replace(/`/g, '');
        cleanContent = cleanContent.replace(/^["']|["']$/g, '');
        cleanContent = cleanContent.replace(/^["']|["']$/gm, '');
        cleanContent = cleanContent.trim();
        
        // Extract hashtags sebelum hapus # (karena kita perlu hashtags untuk return)
        const hashtagMatches = cleanContent.match(/#\w+/g) || [];
        let caption = cleanContent.replace(/#\w+/g, '').trim();
        caption = caption.replace(/\s*#\w+\s*/g, ' ').trim();
        
        if (caption.length > 10) {
          return {
            caption: caption || cleanContent,
            hashtags: hashtagMatches.length > 0 ? hashtagMatches : ["#KulinaAI", "#PromoMakanan", "#Foodie"],
          };
        }
      }
    }
    
    // Fallback hanya jika benar-benar tidak ada response
    console.warn("⚠️  Using fallback caption - AI response was empty or invalid");
    return {
      caption: `🔥 PROMO SPESIAL! 🔥\n\n${data.menuName} dengan harga spesial Rp ${data.price.toLocaleString('id-ID')}! Jangan sampai kehabisan! 🍽️`,
      hashtags: ["#KulinaAI", "#PromoMakanan", "#Foodie"],
    };
  } catch (error: any) {
    console.error("Error in openRouterGeneratePromoCaption:", error);
    // Fallback hanya jika error
    return {
      caption: `🔥 PROMO SPESIAL! 🔥\n\n${data.menuName} dengan harga spesial Rp ${data.price.toLocaleString('id-ID')}! Jangan sampai kehabisan! 🍽️\n\n#KulinaAI #PromoMakanan #Foodie`,
      hashtags: ["#KulinaAI", "#PromoMakanan", "#Foodie"],
    };
  }
}

/**
 * Price & Stock Recommendations using OpenRouter
 */
export async function openRouterGetPriceStockRecommendations(data: {
  salesData?: Array<{ menuName: string; quantity: number; revenue: number }>;
  reviews?: Array<{ menuName: string; rating: number; comment: string }>;
  stockLevels?: Array<{ itemName: string; currentStock: number; minStock: number }>;
}): Promise<{
  priceRecommendations: Array<{ menuName: string; currentPrice: number; recommendedPrice: number; reason: string }>;
  stockRecommendations: Array<{ itemName: string; recommendedQuantity: number; reason: string }>;
  insights: string[];
}> {
  const systemPrompt = `Kamu adalah analis bisnis untuk rumah makan. Berdasarkan data penjualan, review, dan stok, berikan rekomendasi harga dan stok.

Format output JSON:
{
  "priceRecommendations": [{"menuName": "...", "currentPrice": 0, "recommendedPrice": 0, "reason": "..."}],
  "stockRecommendations": [{"itemName": "...", "recommendedQuantity": 0, "reason": "..."}],
  "insights": ["insight1", "insight2"]
}

Gunakan bahasa Indonesia.`;

  let dataText = "";
  if (data.salesData && data.salesData.length > 0) {
    dataText += `\nData Penjualan:\n${data.salesData.map(s => `- ${s.menuName}: ${s.quantity} pcs, Revenue: Rp ${s.revenue.toLocaleString('id-ID')}`).join("\n")}`;
  }
  if (data.reviews && data.reviews.length > 0) {
    dataText += `\nReview:\n${data.reviews.map(r => `- ${r.menuName}: Rating ${r.rating}/5 - "${r.comment}"`).join("\n")}`;
  }
  if (data.stockLevels && data.stockLevels.length > 0) {
    dataText += `\nStok:\n${data.stockLevels.map(s => `- ${s.itemName}: ${s.currentStock} (min: ${s.minStock})`).join("\n")}`;
  }

  const userPrompt = `Analisis data berikut dan berikan rekomendasi harga dan stok dalam format JSON:${dataText}`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await openRouterChatCompletions(messages, {
      model: DEFAULT_MODEL,
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
    console.error("Error in openRouterGetPriceStockRecommendations:", error);
    return {
      priceRecommendations: [],
      stockRecommendations: [],
      insights: ["Sistem sedang mengalami gangguan. Pastikan koneksi internet stabil dan coba refresh halaman."],
    };
  }
}

