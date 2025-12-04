import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeSpriteSheet = async (base64Image: string): Promise<{ rows: number; cols: number; totalFrames: number }> => {
  try {
    const ai = getAiClient();
    
    // Clean base64 string if it has prefix
    const data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: data,
            },
          },
          {
            text: "Analyze this image which is a sprite sheet (sequence of animation frames). Determine the number of rows and columns in the grid. Also estimate the total number of useful frames (sometimes the last row is incomplete). Return the result strictly as JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rows: { type: Type.NUMBER, description: "Number of rows in the sprite grid" },
            cols: { type: Type.NUMBER, description: "Number of columns in the sprite grid" },
            totalFrames: { type: Type.NUMBER, description: "Total number of active frames" },
          },
          required: ["rows", "cols", "totalFrames"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback default
    return { rows: 1, cols: 1, totalFrames: 1 };
  }
};
