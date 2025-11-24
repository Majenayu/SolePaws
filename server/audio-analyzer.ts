import { AnimalType, EmotionType, AudioAnalysis, emotionTypes } from "@shared/schema";
import { randomUUID } from "crypto";

interface AudioFeatures {
  pitch: number;
  frequency: number;
  amplitude: number;
  duration: number;
}

export class AudioAnalyzer {
  private extractAudioFeatures(audioBuffer: Buffer, sampleRate: number): AudioFeatures {
    const samples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);
    
    let sum = 0;
    let maxAmplitude = 0;
    
    for (let i = 0; i < samples.length; i++) {
      const normalized = samples[i] / 32768;
      sum += Math.abs(normalized);
      maxAmplitude = Math.max(maxAmplitude, Math.abs(normalized));
    }
    
    const avgAmplitude = sum / samples.length;
    
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    
    const estimatedFrequency = (zeroCrossings / 2) * (sampleRate / samples.length);
    const duration = samples.length / sampleRate;
    
    return {
      pitch: estimatedFrequency * 2,
      frequency: estimatedFrequency,
      amplitude: maxAmplitude,
      duration: Math.min(duration, 30)
    };
  }

  private classifyEmotion(animal: AnimalType, features: AudioFeatures): Record<EmotionType, number> {
    const scores: Record<EmotionType, number> = {
      fear: 0,
      stress: 0,
      aggression: 0,
      comfort: 0,
      happiness: 0,
      sadness: 0,
      anxiety: 0,
      contentment: 0,
      alertness: 0,
    };

    const { pitch, frequency, amplitude } = features;

    switch (animal) {
      case 'dog':
        if (frequency > 800 && amplitude > 0.6) {
          scores.fear = 0.8;
          scores.stress = 0.6;
        } else if (frequency > 600 && amplitude > 0.7) {
          scores.aggression = 0.85;
          scores.alertness = 0.7;
        } else if (frequency < 300 && amplitude < 0.4) {
          scores.sadness = 0.7;
          scores.anxiety = 0.5;
        } else if (frequency > 400 && frequency < 600 && amplitude > 0.5) {
          scores.happiness = 0.75;
          scores.alertness = 0.6;
        } else {
          scores.contentment = 0.7;
          scores.comfort = 0.65;
        }
        break;

      case 'cat':
        if (frequency > 1000 && amplitude > 0.5) {
          scores.aggression = 0.8;
          scores.fear = 0.6;
        } else if (frequency > 700 && amplitude > 0.4) {
          scores.stress = 0.75;
          scores.anxiety = 0.7;
        } else if (frequency < 400 && amplitude < 0.3) {
          scores.contentment = 0.85;
          scores.comfort = 0.8;
        } else if (frequency > 500 && amplitude > 0.6) {
          scores.alertness = 0.7;
          scores.happiness = 0.5;
        } else {
          scores.comfort = 0.6;
          scores.contentment = 0.55;
        }
        break;

      case 'lovebirds':
        if (frequency > 2000 && amplitude > 0.6) {
          scores.happiness = 0.85;
          scores.alertness = 0.7;
        } else if (frequency > 1500 && amplitude > 0.7) {
          scores.aggression = 0.75;
          scores.stress = 0.6;
        } else if (frequency < 1000 && amplitude < 0.4) {
          scores.contentment = 0.8;
          scores.comfort = 0.7;
        } else if (frequency > 1800) {
          scores.fear = 0.7;
          scores.anxiety = 0.65;
        } else {
          scores.comfort = 0.65;
          scores.happiness = 0.6;
        }
        break;

      case 'chicken':
        if (frequency > 600 && amplitude > 0.7) {
          scores.fear = 0.85;
          scores.stress = 0.75;
        } else if (frequency > 450 && amplitude > 0.5) {
          scores.aggression = 0.7;
          scores.alertness = 0.8;
        } else if (frequency < 300) {
          scores.contentment = 0.8;
          scores.comfort = 0.75;
        } else if (amplitude > 0.6) {
          scores.alertness = 0.75;
          scores.happiness = 0.5;
        } else {
          scores.comfort = 0.7;
          scores.contentment = 0.6;
        }
        break;

      case 'pigeon':
        if (frequency > 500 && amplitude > 0.6) {
          scores.aggression = 0.75;
          scores.alertness = 0.8;
        } else if (frequency > 350 && amplitude > 0.5) {
          scores.fear = 0.7;
          scores.anxiety = 0.65;
        } else if (frequency < 250 && amplitude < 0.4) {
          scores.contentment = 0.85;
          scores.comfort = 0.8;
        } else if (amplitude > 0.5) {
          scores.happiness = 0.7;
          scores.alertness = 0.6;
        } else {
          scores.comfort = 0.75;
          scores.contentment = 0.7;
        }
        break;
    }

    const variance = Math.random() * 0.15 - 0.075;
    Object.keys(scores).forEach((key) => {
      const emotion = key as EmotionType;
      scores[emotion] = Math.max(0.1, Math.min(1, scores[emotion] + variance));
    });

    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    Object.keys(scores).forEach((key) => {
      const emotion = key as EmotionType;
      scores[emotion] = scores[emotion] / total;
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
