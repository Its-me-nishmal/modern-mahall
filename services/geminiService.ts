import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateAnnouncement = async (topic: string, tone: 'formal' | 'urgent' | 'casual'): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing");
    return "Error: API Key missing. Please configure environment variables.";
  }

  try {
    const prompt = `
      You are an assistant for a community committee (Mahall). 
      Draft a WhatsApp announcement message about: "${topic}".
      Tone: ${tone}.
      
      Requirements:
      - Keep it concise and clear.
      - Use appropriate emojis.
      - Format with bolding where necessary (using *text* for WhatsApp).
      - Do not include placeholders like [Your Name], sign off as "Mahall Committee".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't generate the announcement at this time.";
  }
};