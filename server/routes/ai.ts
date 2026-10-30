import { Router } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import db from "../config/db.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();
const allowedPlatforms = ["Facebook", "Instagram", "LinkedIn", "TikTok", "YouTube"];

router.post("/generate", authenticateToken, async (req: AuthRequest, res) => {
  const agencyId = req.user?.agency_id;
  const propertyId = Number(req.body?.propertyId);
  const agentId = Number(req.body?.agentId);
  const platform = req.body?.platform;
  if (!agencyId || !Number.isSafeInteger(propertyId) || !Number.isSafeInteger(agentId) ||
      !allowedPlatforms.includes(platform)) {
    return res.status(400).json({ error: "Valid property, agent and platform are required." });
  }
  const property = db.prepare("SELECT * FROM properties WHERE id = ? AND agency_id = ?").get(propertyId, agencyId) as any;
  const agent = db.prepare("SELECT * FROM agents WHERE id = ? AND agency_id = ?").get(agentId, agencyId) as any;
  if (!property || !agent) return res.status(404).json({ error: "Property or agent not found in your agency." });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI generation is not configured." });

  const amenities = db.prepare(`
    SELECT a.name FROM amenities a
    JOIN property_amenities pa ON pa.amenity_id = a.id
    WHERE pa.property_id = ? ORDER BY pa.priority_score DESC LIMIT 8
  `).all(propertyId) as {name: string}[];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: `You are a real estate marketing specialist. Write accurate, engaging ${platform} listing content.
Use only the supplied verified facts. Do not invent amenities, investment returns or claims.
Property: ${property.title}; ${property.location_area}, ${property.location_city}.
Price: ${property.currency || "ZAR"} ${property.price}. Listing type: ${property.listing_type}.
Bedrooms: ${property.bedrooms}; bathrooms: ${property.bathrooms}; parking: ${property.parking}.
Floor area: ${property.floor_size_m2} m². Description: ${property.short_description || ""}.
Amenities: ${amenities.map(a => a.name).join(", ")}.
Agent: ${agent.full_name}; contact: ${agent.cellphone_number || ""}.
Return a compelling caption, a concise graphic headline, a call to action and 5-10 hashtags.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            headline: { type: Type.STRING },
            cta: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["caption", "headline", "cta", "hashtags"]
        }
      }
    });
    if (!response.text) throw new Error("Empty AI response");
    return res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("AI generation failed", error);
    return res.status(502).json({ error: "AI generation failed. Try again later." });
  }
});

export default router;
