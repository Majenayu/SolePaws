import { AnimalType, EmotionType, AudioAnalysis, emotionTypes } from "@shared/schema";
import { randomUUID } from "crypto";

interface AudioFeatures {
  pitch: number;
  frequency: number;
  amplitude: number;
  duration: number;
  rmsEnergy: number;
  spectralCentroid: number;
  zcrRate: number;
}

export class AudioAnalyzer {
  private extractAudioFeatures(audioBuffer: Buffer, sampleRate: number): AudioFeatures {
    const samples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);
    
    let sum = 0;
    let maxAmplitude = 0;
    let sumSquares = 0;
    
    for (let i = 0; i < samples.length; i++) {
      const normalized = samples[i] / 32768;
      sum += Math.abs(normalized);
      maxAmplitude = Math.max(maxAmplitude, Math.abs(normalized));
      sumSquares += normalized * normalized;
    }
    
    const avgAmplitude = sum / samples.length;
    const rmsEnergy = Math.sqrt(sumSquares / samples.length);
    
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    
    const zcrRate = (zeroCrossings / samples.length) * sampleRate;
    const estimatedFrequency = (zeroCrossings / 2) * (sampleRate / samples.length);
    const duration = samples.length / sampleRate;
    
    // Estimate spectral centroid using FFT-like approach
    let spectralSum = 0;
    let weightedSum = 0;
    const fftSize = Math.min(1024, samples.length);
    for (let i = 0; i < fftSize; i++) {
      const bin = Math.abs(samples[i]) / 32768;
      const freq = (i / fftSize) * sampleRate;
      spectralSum += bin;
      weightedSum += bin * freq;
    }
    const spectralCentroid = spectralSum > 0 ? weightedSum / spectralSum : 0;
    
    return {
      pitch: estimatedFrequency * 2,
      frequency: estimatedFrequency,
      amplitude: maxAmplitude,
      rmsEnergy,
      spectralCentroid: Math.min(spectralCentroid / 1000, 10),
      zcrRate: Math.min(zcrRate / 5000, 10),
      duration: Math.min(duration, 30)
    };
  }

  private classifyEmotion(animal: AnimalType, features: AudioFeatures): Record<EmotionType, number> {
    const scores: Record<EmotionType, number> = {
      fear: 0.1,
      stress: 0.1,
      aggression: 0.1,
      comfort: 0.1,
      happiness: 0.1,
      sadness: 0.1,
      anxiety: 0.1,
      contentment: 0.1,
      alertness: 0.1,
    };

    const { frequency, amplitude, rmsEnergy, spectralCentroid, zcrRate } = features;

    // Normalize features to 0-1 range
    const freqNorm = Math.min(frequency / 2000, 1);
    const ampNorm = Math.min(amplitude / 1, 1);
    const energyNorm = Math.min(rmsEnergy * 3, 1);
    const centroidNorm = Math.min(spectralCentroid / 10, 1);
    const zcrNorm = Math.min(zcrRate / 10, 1);

    // Universal emotion patterns based on acoustic features
    
    // Aggression: high amplitude, high energy, high centroid
    scores.aggression += (ampNorm * 0.3 + energyNorm * 0.3 + centroidNorm * 0.2) * 0.7;
    
    // Fear: high frequency, moderate-high amplitude, high ZCR
    scores.fear += (freqNorm * 0.3 + ampNorm * 0.2 + zcrNorm * 0.3) * 0.6;
    
    // Stress: moderate frequency, moderate amplitude, variable energy
    scores.stress += (Math.abs(freqNorm - 0.5) < 0.3 ? 0.3 : 0.1) * energyNorm * 0.6;
    
    // Happiness: high frequency, moderate-high amplitude, regular rhythm
    scores.happiness += (freqNorm * 0.35 + ampNorm * 0.25 + (1 - Math.abs(zcrNorm - 0.5)) * 0.15) * 0.7;
    
    // Alertness: high frequency, high amplitude, high ZCR
    scores.alertness += (freqNorm * 0.25 + ampNorm * 0.25 + zcrNorm * 0.3) * 0.7;
    
    // Sadness: low frequency, low amplitude, low energy
    scores.sadness += ((1 - freqNorm) * 0.3 + (1 - ampNorm) * 0.3 + (1 - energyNorm) * 0.2) * 0.6;
    
    // Anxiety: high ZCR, moderate frequency, variable amplitude
    scores.anxiety += (zcrNorm * 0.35 + Math.abs(freqNorm - 0.4) * 0.2 + Math.abs(ampNorm - 0.5) * 0.15) * 0.6;
    
    // Contentment: low-moderate frequency, low-moderate amplitude, smooth
    scores.contentment += ((1 - freqNorm) * 0.25 + (1 - ampNorm) * 0.25 + (1 - zcrNorm) * 0.2) * 0.6;
    
    // Comfort: very low frequency, low amplitude, low energy
    scores.comfort += ((1 - freqNorm) * 0.3 + (1 - ampNorm) * 0.3 + (1 - energyNorm) * 0.15) * 0.6;

    // Normalize to probabilities
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    Object.keys(scores).forEach((key) => {
      const emotion = key as EmotionType;
      scores[emotion] = scores[emotion] / (total || 0.9);
    });

    return scores;
  }

  async analyze(animal: AnimalType, audioBuffer: Buffer, sampleRate: number): Promise<AudioAnalysis> {
    const features = this.extractAudioFeatures(audioBuffer, sampleRate);
    const emotionScores = this.classifyEmotion(animal, features);
    
    let dominantEmotion: EmotionType = 'contentment';
    let maxScore = 0;
    
    Object.entries(emotionScores).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion as EmotionType;
      }
    });

    return {
      id: randomUUID(),
      animal,
      timestamp: new Date().toISOString(),
      dominantEmotion,
      emotionScores,
      audioFeatures: features,
    };
  }
}

export const audioAnalyzer = new AudioAnalyzer();
