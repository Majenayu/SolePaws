import { type AudioAnalysis, analysisTable, type TrainingAudioSample, type AnimalType, type EmotionType } from "@shared/schema";
import { db } from "./db";
import { desc } from "drizzle-orm";

export interface IStorage {
  saveAnalysis(analysis: AudioAnalysis): Promise<AudioAnalysis>;
  getAnalyses(): Promise<AudioAnalysis[]>;
  getAnalysisById(id: string): Promise<AudioAnalysis | undefined>;
  saveTrainingSample(sample: TrainingAudioSample): Promise<TrainingAudioSample>;
  getTrainingSamples(): Promise<TrainingAudioSample[]>;
  findMatchingTrainingSample(audioHash: string, threshold: number): Promise<TrainingAudioSample | undefined>;
}

export class DatabaseStorage implements IStorage {
  private trainingSamples: Map<string, TrainingAudioSample> = new Map();

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
      .where((t: any) => ({
        get id() { return id; }
      }) as any)
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

  async saveTrainingSample(sample: TrainingAudioSample): Promise<TrainingAudioSample> {
    this.trainingSamples.set(sample.audioHash, sample);
    return sample;
  }

  async getTrainingSamples(): Promise<TrainingAudioSample[]> {
    const samples: TrainingAudioSample[] = [];
    this.trainingSamples.forEach((sample) => {
      samples.push(sample);
    });
    return samples;
  }

  async findMatchingTrainingSample(audioHash: string, threshold: number = 0.95): Promise<TrainingAudioSample | undefined> {
    let result: TrainingAudioSample | undefined;
    this.trainingSamples.forEach((sample) => {
      // Exact match or very close match
      if (sample.audioHash === audioHash) {
        result = sample;
      }
    });
    return result;
  }
}

export const storage = new DatabaseStorage();
