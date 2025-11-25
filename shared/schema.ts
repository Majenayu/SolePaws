import { z } from "zod";
import { pgTable, text, real, integer, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

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

export const analysisTable = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  animal: text("animal").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  dominantEmotion: text("dominant_emotion").notNull(),
  emotionScores: jsonb("emotion_scores").notNull(),
  audioFeatures: jsonb("audio_features").notNull(),
});

export type Analysis = typeof analysisTable.$inferSelect;
export const insertAnalysisSchema = createInsertSchema(analysisTable).omit({ 
  id: true,
  timestamp: true 
});
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export const analyzeAudioSchema = z.object({
  animal: z.enum(animalTypes).optional(),
  sampleRate: z.number(),
  fileName: z.string().optional(),
});

export type AnalyzeAudioRequest = z.infer<typeof analyzeAudioSchema>;
export type AnalyzeAudioResponse = AudioAnalysis;

// Admin training data
export interface TrainingAudioSample {
  id: string;
  animal: AnimalType;
  emotion: EmotionType;
  audioHash: string;
  fileName: string;
  createdAt: string;
}

export const trainingSampleSchema = z.object({
  animal: z.enum(animalTypes),
  emotion: z.enum(emotionTypes),
  fileName: z.string(),
});
