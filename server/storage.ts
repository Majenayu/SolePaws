import { type AudioAnalysis, analysisTable } from "@shared/schema";
import { db } from "./db";
import { desc } from "drizzle-orm";

export interface IStorage {
  saveAnalysis(analysis: AudioAnalysis): Promise<AudioAnalysis>;
  getAnalyses(): Promise<AudioAnalysis[]>;
  getAnalysisById(id: string): Promise<AudioAnalysis | undefined>;
}

export class DatabaseStorage implements IStorage {
  async saveAnalysis(analysis: AudioAnalysis): Promise<AudioAnalysis> {
    await db.insert(analysisTable).values({
      id: analysis.id,
      animal: analysis.animal,
      dominantEmotion: analysis.dominantEmotion,
      emotionScores: analysis.emotionScores,
      audioFeatures: analysis.audioFeatures,
    });
    return analysis;
  }

  async getAnalyses(): Promise<AudioAnalysis[]> {
    const results = await db
      .select()
      .from(analysisTable)
      .orderBy(desc(analysisTable.timestamp));
    
    return results.map((row: any) => ({
      id: row.id,
      animal: row.animal as any,
      timestamp: row.timestamp.toISOString(),
      dominantEmotion: row.dominantEmotion as any,
      emotionScores: row.emotionScores as any,
      audioFeatures: row.audioFeatures as any,
    }));
  }

  async getAnalysisById(id: string): Promise<AudioAnalysis | undefined> {
    const result = await db
      .select()
      .from(analysisTable)
      .where((t: any) => t.id === id)
      .limit(1);
    
    if (!result.length) return undefined;
    
    const row = result[0];
    return {
      id: row.id,
      animal: row.animal as any,
      timestamp: row.timestamp.toISOString(),
      dominantEmotion: row.dominantEmotion as any,
      emotionScores: row.emotionScores as any,
      audioFeatures: row.audioFeatures as any,
    };
  }
}

export const storage = new DatabaseStorage();
