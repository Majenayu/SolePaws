import { z } from "zod";

export const animalTypes = ["dog", "cat", "lovebirds", "chicken", "pigeon"] as const;
export type AnimalType = typeof animalTypes[number];

export const emotionTypes = [
  "fear",
  "stress", 
  "aggression",
  "comfort",
  "happiness",
  "sadness",
  "anxiety",
  "contentment",
  "alertness"
] as const;
export type EmotionType = typeof emotionTypes[number];

export interface EmotionResult {
  emotion: EmotionType;
  confidence: number;
}

export interface AudioAnalysis {
  id: string;
  animal: AnimalType;
  timestamp: string;
  dominantEmotion: EmotionType;
  emotionScores: Record<EmotionType, number>;
  audioFeatures: {
    pitch: number;
    frequency: number;
    amplitude: number;
    duration: number;
  };
}

export const analyzeAudioSchema = z.object({
  animal: z.enum(animalTypes),
  audioData: z.string(),
  sampleRate: z.number(),
  fileName: z.string().optional(),
});

export type AnalyzeAudioRequest = z.infer<typeof analyzeAudioSchema>;
export type AnalyzeAudioResponse = AudioAnalysis;
