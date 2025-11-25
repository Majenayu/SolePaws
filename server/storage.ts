import { type AudioAnalysis, analysisTable, type TrainingAudioSample, type AnimalType, type EmotionType } from "@shared/schema";
import { db } from "./db";
import { desc } from "drizzle-orm";

export interface IStorage {
  saveAnalysis(analysis: AudioAnalysis): Promise<AudioAnalysis>;
  getAnalyses(): Promise<AudioAnalysis[]>;
  getAnalysisById(id: string): Promise<AudioAnalysis | undefined>;
  saveTrainingSample(sample: TrainingAudioSample): Promise<TrainingAudioSample>;
  getTrainingSamples(): Promise<TrainingAudioSample[]>;
  findMatchingTrainingSample(fileName: string): Promise<TrainingAudioSample | undefined>;
  deleteTrainingSample(id: string): Promise<boolean>;
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
    this.trainingSamples.set(sample.fileName, sample);
    return sample;
  }

  async getTrainingSamples(): Promise<TrainingAudioSample[]> {
    const samples: TrainingAudioSample[] = [];
    this.trainingSamples.forEach((sample) => {
      samples.push(sample);
    });
    return samples;
  }

  async findMatchingTrainingSample(fileName: string): Promise<TrainingAudioSample | undefined> {
    let result: TrainingAudioSample | undefined;
    this.trainingSamples.forEach((sample) => {
      // Match by filename
      if (sample.fileName === fileName) {
        result = sample;
      }
    });
    return result;
  }

  async deleteTrainingSample(id: string): Promise<boolean> {
    let found = false;
    this.trainingSamples.forEach((sample, fileName) => {
      if (sample.id === id) {
        this.trainingSamples.delete(fileName);
        found = true;
      }
    });
    return found;
  }
}

export const storage = new DatabaseStorage();
