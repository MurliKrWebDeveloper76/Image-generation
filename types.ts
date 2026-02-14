
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";
export type ModelType = "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  sources?: GroundingSource[];
  config: {
    aspectRatio: AspectRatio;
    model: ModelType;
    size?: ImageSize;
    hasReferenceImage?: boolean;
  };
}

export interface GenerationSettings {
  prompt: string;
  aspectRatio: AspectRatio;
  model: ModelType;
  imageSize: ImageSize;
  referenceImage?: string; // base64
  mimeType?: string;
}

/**
 * AIStudio interface for managing API keys within the environment.
 */
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // The environment may provide this object to handle secure key selection.
    // Making it optional to match identical modifiers across potential global declarations.
    aistudio?: AIStudio;
  }
}
