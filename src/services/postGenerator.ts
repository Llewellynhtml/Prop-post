import type { Property, Agent } from "../types";

export interface GeneratedPost {
  caption: string;
  hashtags: string[];
  cta: string;
  headline: string;
}

export const postGenerator = {
  generate: async (property: Property, agent: Agent, platform: string, token: string): Promise<GeneratedPost> => {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ propertyId: property.id, agentId: agent.id, platform })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "AI generation failed");
    }
    return response.json();
  }
};
