import { type AudioAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  saveAnalysis(analysis: AudioAnalysis): Promise<AudioAnalysis>;
  getAnalyses(): Promise<AudioAnalysis[]>;
  getAnalysisById(id: string): Promise<AudioAnalysis | undefined>;
}

export class MemStorage implements IStorage {
  private analyses: Map<string, AudioAnalysis>;

  constructor() {
    this.analyses = new Map();
  }

  async saveAnalysis(analysis: AudioAnalysis): Promise<AudioAnalysis> {
    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  async getAnalyses(): Promise<AudioAnalysis[]> {
    return Array.from(this.analyses.values()).sort(
      (a, b) => b.timestamp.localeCompare(a.timestamp)
    );
  }

  async getAnalysisById(id: string): Promise<AudioAnalysis | undefined> {
    return this.analyses.get(id);
  }
}

export const storage = new MemStorage();
