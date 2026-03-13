import { GoogleGenAI, Type } from "@google/genai";
import { Property, Agent } from "../types";

export interface GeneratedPost {
  caption: string;
  hashtags: string[];
  cta: string;
  headline: string;
}

export const postGenerator = {
  generate: async (
    property: Property,
    agent: Agent,
    platform: string
  ): Promise<GeneratedPost> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found");
    }

    const ai = new GoogleGenAI({ apiKey });

    const platformContext = {
      Instagram: "shorter, highly promotional, emoji-rich, and visually focused.",
      Facebook: "fuller listing style, community-focused, and detailed.",
      LinkedIn: "professional, business-like, investment-focused, and formal.",
      TikTok: "high energy, punchy, and trend-aware.",
      YouTube: "descriptive, search-optimized, and informative."
    }[platform] || "professional and inviting.";

    const prompt = `
      You are an expert real estate marketing specialist. Generate a high-converting social media post for the following property:
      
      PROPERTY DETAILS:
      - Title: ${property.title}
      - Location: ${property.location_area}, ${property.location_city}
      - Price: R ${property.price.toLocaleString()}
      - Type: ${property.listing_type === 'sale' ? 'For Sale' : 'To Let'}
      - Beds/Baths/Parking: ${property.bedrooms} / ${property.bathrooms} / ${property.parking}
      - Size: ${property.floor_size_m2} m²
      - Description: ${property.short_description}
      - Key Amenities: ${property.amenities?.map(a => a.name).join(", ") || "Standard features"}
      
      AGENT INFO:
      - Name: ${agent.full_name}
      - Contact: ${agent.cellphone_number}
      - Email: ${agent.email}
      
      PLATFORM: ${platform}
      TONE/STYLE: ${platformContext}
      
      REQUIREMENTS:
      1. Structure the caption with:
         - Catchy opening line
         - Property Title & Location
         - Price
         - 3 to 5 key features as bullet points
         - Contact call-to-action (mention ${agent.full_name})
      2. Provide a separate short 'headline' for a graphic overlay.
      3. Provide a separate 'cta' line.
      4. Provide 5-10 relevant hashtags.
      
      OUTPUT FORMAT: JSON
      {
        "caption": "string",
        "hashtags": ["string"],
        "cta": "string",
        "headline": "string"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              caption: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              cta: { type: Type.STRING },
              headline: { type: Type.STRING }
            },
            required: ["caption", "hashtags", "cta", "headline"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      return JSON.parse(text);
    } catch (error) {
      console.error("Post Generation Error:", error);
      throw error;
    }
  }
};
