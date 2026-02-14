
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
 * Defined in global scope to align with existing environment definitions and prevent type mismatch errors.
 */
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Added readonly and optional modifiers to match pre-configured declarations and fix identical modifiers error.
    readonly aistudio?: AIStudio;
  }
}

// Export the type alias to maintain compatibility with consumers.
export type AIStudioType = AIStudio;
