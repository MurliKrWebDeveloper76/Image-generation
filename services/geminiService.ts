
import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, GroundingSource } from "../types";

/**
 * Uses Gemini 3 Flash to expand a simple user prompt into a high-detail artistic description.
 */
export const enhancePrompt = async (prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_ERROR");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert AI prompt engineer. Expand the following simple description into a highly detailed, artistic, and visually descriptive prompt for an image generator. Focus on lighting, texture, composition, and mood. Keep it under 75 words. 
      Original: "${prompt}"`,
    });
    return response.text || prompt;
  } catch (e) {
    console.warn("Prompt enhancement failed, using original:", e);
    return prompt;
  }
};

/**
 * Generate an image using the Gemini API models.
 */
export const generateImage = async (settings: GenerationSettings): Promise<{ imageUrl: string; text?: string; sources?: GroundingSource[] }> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY_ERROR");
  }

  // Always create a new instance right before making an API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const config: any = {
    imageConfig: {
      aspectRatio: settings.aspectRatio,
    },
  };

  if (settings.model === 'gemini-3-pro-image-preview') {
    config.imageConfig.imageSize = settings.imageSize;
    // According to Gemini 3 Image generation rules, real-time information is accessed using the googleSearch tool.
    config.tools = [{ googleSearch: {} }];
  }

  const parts: any[] = [{ text: settings.prompt }];

  // Add reference image if provided for image editing/variations
  if (settings.referenceImage && settings.mimeType) {
    parts.unshift({
      inlineData: {
        data: settings.referenceImage,
        mimeType: settings.mimeType,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: { parts },
      config,
    });

    let imageUrl = '';
    let text = '';
    let sources: GroundingSource[] = [];

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("The model did not return any results. This might be due to safety filters.");
    }

    const candidate = response.candidates[0];

    // Handle non-standard finish reasons
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`Generation stopped early: ${candidate.finishReason}. Try a different prompt.`);
    }

    // Extract image and text from the response parts
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          text += part.text;
        }
      }
    }

    // Process grounding metadata for citations if Google Search was used
    if (candidate.groundingMetadata?.groundingChunks) {
      sources = candidate.groundingMetadata.groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
    }

    if (!imageUrl) {
      if (text) throw new Error(`Model Response: ${text}`);
      throw new Error("No image data found. The prompt or reference image may have been filtered.");
    }

    return { imageUrl, text, sources };
  } catch (error: any) {
    console.error("Image generation failed:", error);
    const errorMessage = error.message || "";
    const errorStatus = error.status || (error.error && error.error.code);

    // Identify cases where a new API key selection might be required
    if (
      errorMessage.includes("Requested entity was not found") || 
      errorMessage.includes("permission") ||
      errorMessage.includes("API_KEY") ||
      errorMessage.includes("An API Key must be set") ||
      errorStatus === 404 || 
      errorStatus === 403
    ) {
      throw new Error("API_KEY_ERROR");
    }
    
    throw error;
  }
};
