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
  mfcc: number[];
  spectralFlux: number;
  spectralRolloff: number;
  tempoDynamics: number;
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
    
    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    
    const zcrRate = (zeroCrossings / samples.length) * sampleRate;
    const estimatedFrequency = (zeroCrossings / 2) * (sampleRate / samples.length);
    const duration = samples.length / sampleRate;
    
    // Enhanced spectral analysis
    const fftSize = Math.min(2048, Math.pow(2, Math.ceil(Math.log2(Math.min(samples.length, 4096)))));
    const spectrum = this.simpleFFT(samples, fftSize);
    
    // Spectral centroid
    let spectralSum = 0;
    let weightedSum = 0;
    for (let i = 0; i < spectrum.length; i++) {
      const freq = (i / fftSize) * sampleRate;
      spectralSum += spectrum[i];
      weightedSum += spectrum[i] * freq;
    }
    const spectralCentroid = spectralSum > 0 ? weightedSum / spectralSum : 0;
    
    // Spectral rolloff (95% of energy)
    let energySum = 0;
    let rolloffIdx = 0;
    const totalEnergy = spectralSum;
    for (let i = 0; i < spectrum.length; i++) {
      energySum += spectrum[i];
      if (energySum >= totalEnergy * 0.95) {
        rolloffIdx = i;
        break;
      }
    }
    const spectralRolloff = (rolloffIdx / fftSize) * sampleRate;
    
    // Spectral flux (energy change over time)
    const spectralFlux = this.calculateSpectralFlux(samples, sampleRate);
    
    // Simple MFCC approximation
    const mfcc = this.approximateMFCC(spectrum, sampleRate, 13);
    
    // Tempo dynamics (variability in amplitude envelope)
    const tempoDynamics = this.calculateTempoDynamics(samples, sampleRate);
    
    return {
      pitch: estimatedFrequency * 2,
      frequency: estimatedFrequency,
      amplitude: maxAmplitude,
      rmsEnergy,
      spectralCentroid: Math.min(spectralCentroid / 1000, 10),
      spectralRolloff: Math.min(spectralRolloff / 1000, 10),
      spectralFlux,
      zcrRate: Math.min(zcrRate / 5000, 10),
      mfcc,
      tempoDynamics,
      duration: Math.min(duration, 30)
    };
  }

  private simpleFFT(samples: Int16Array, size: number): number[] {
    const spectrum = new Array(size).fill(0);
    const windowSize = Math.min(size, samples.length);
    
    for (let i = 0; i < windowSize; i++) {
      const normalized = samples[i] / 32768;
      spectrum[i] = Math.abs(normalized);
    }
    
    return spectrum;
  }

  private calculateSpectralFlux(samples: Int16Array, sampleRate: number): number {
    const windowSize = 2048;
    const hopSize = 512;
    let flux = 0;
    let prevSpectrum: number[] | null = null;
    let count = 0;
    
    for (let i = 0; i < samples.length - windowSize; i += hopSize) {
      const window = samples.slice(i, i + windowSize);
      const spectrum = Array.from(window).map(s => Math.abs(s / 32768));
      
      if (prevSpectrum) {
        let fluxValue = 0;
        for (let j = 0; j < spectrum.length; j++) {
          fluxValue += Math.pow(spectrum[j] - prevSpectrum[j], 2);
        }
        flux += Math.sqrt(fluxValue);
        count++;
      }
      prevSpectrum = spectrum;
    }
    
    return count > 0 ? flux / count : 0;
  }

  private approximateMFCC(spectrum: number[], sampleRate: number, numCoeffs: number): number[] {
    const mfcc: number[] = [];
    const melBands = 40;
    const melScale = this.frequencyToMel(spectrum, sampleRate, melBands);
    
    for (let i = 0; i < Math.min(numCoeffs, melScale.length); i++) {
      mfcc.push(Math.log(melScale[i] + 1e-10));
    }
    
    return mfcc;
  }

  private frequencyToMel(spectrum: number[], sampleRate: number, numBands: number): number[] {
    const mel = new Array(numBands).fill(0);
    const bandWidth = spectrum.length / numBands;
    
    for (let i = 0; i < numBands; i++) {
      const start = Math.floor(i * bandWidth);
      const end = Math.floor((i + 1) * bandWidth);
      let sum = 0;
      for (let j = start; j < end; j++) {
        if (j < spectrum.length) sum += spectrum[j];
      }
      mel[i] = sum / (end - start);
    }
    
    return mel;
  }

  private calculateTempoDynamics(samples: Int16Array, sampleRate: number): number {
    const windowSize = Math.floor(sampleRate * 0.02); // 20ms windows
    const windows: number[] = [];
    
    for (let i = 0; i < samples.length - windowSize; i += windowSize) {
      let energy = 0;
      for (let j = i; j < i + windowSize; j++) {
        const normalized = samples[j] / 32768;
        energy += normalized * normalized;
      }
      windows.push(Math.sqrt(energy / windowSize));
    }
    
    // Calculate variance of energy
    const mean = windows.reduce((a, b) => a + b, 0) / windows.length;
    const variance = windows.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windows.length;
    
    return Math.sqrt(variance);
  }

  private classifyAnimal(features: AudioFeatures): AnimalType {
    const { frequency, amplitude, rmsEnergy, spectralCentroid, zcrRate } = features;
    
    // Animal frequency ranges (Hz) and characteristics
    // Pigeon: 200-800 Hz (low coos)
    // Dog: 400-2000 Hz (barks)
    // Cat: 300-1500 Hz (meows)
    // Chicken: 1000-3000 Hz (clucks)
    // Lovebirds: 2000-6000 Hz (chirps)
    
    const scores = {
      pigeon: 0,
      dog: 0,
      cat: 0,
      chicken: 0,
      lovebirds: 0
    };
    
    // Primary classifier: frequency
    if (frequency < 600) {
      scores.pigeon += 0.4;  // Pigeon coos are low frequency
    } else if (frequency < 1000) {
      scores.dog += 0.3;
      scores.cat += 0.2;
    } else if (frequency < 1800) {
      scores.dog += 0.3;
      scores.chicken += 0.2;
    } else if (frequency < 3000) {
      scores.chicken += 0.35;
      scores.lovebirds += 0.15;
    } else {
      scores.lovebirds += 0.4;  // High frequency = birds
    }
    
    // Secondary: ZCR (zero crossing rate) - higher ZCR = more oscillation
    // Birds have higher ZCR, mammals lower
    if (zcrRate > 6) {
      scores.lovebirds += 0.2;
      scores.chicken += 0.15;
    } else if (zcrRate < 3) {
      scores.pigeon += 0.2;
      scores.dog += 0.15;
    }
    
    // Tertiary: Amplitude dynamics
    // Dogs bark with sharp attacks (high amplitude)
    if (amplitude > 0.7) {
      scores.dog += 0.1;
      scores.chicken += 0.05;
    }
    
    // Cats have smooth contours
    if (amplitude < 0.5 && rmsEnergy < 0.3) {
      scores.cat += 0.15;
    }
    
    // Pigeons and lovebirds have sustained notes
    if (rmsEnergy > 0.4) {
      scores.pigeon += 0.1;
      scores.lovebirds += 0.1;
    }
    
    // Find animal with highest score
    let detectedAnimal: AnimalType = 'dog';
    let maxScore = 0;
    
    Object.entries(scores).forEach(([animal, score]) => {
      if (score > maxScore) {
        maxScore = score;
        detectedAnimal = animal as AnimalType;
      }
    });
    
    return detectedAnimal;
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

    const { frequency, amplitude, rmsEnergy, spectralCentroid, zcrRate, spectralRolloff, spectralFlux, tempoDynamics } = features;

    // Normalize features to 0-1 range
    const freqNorm = Math.min(frequency / 2000, 1);
    const ampNorm = Math.min(amplitude, 1);
    const energyNorm = Math.min(rmsEnergy * 3, 1);
    const centroidNorm = Math.min(spectralCentroid / 10, 1);
    const rolloffNorm = Math.min(spectralRolloff / 10, 1);
    const zcrNorm = Math.min(zcrRate / 10, 1);
    const fluxNorm = Math.min(spectralFlux * 10, 1);
    const tempoNorm = Math.min(tempoDynamics * 5, 1);

    // Aggression: high amplitude, high energy, high spectral flux, sharp attacks
    scores.aggression = 0.1 + (
      ampNorm * 0.25 + 
      energyNorm * 0.25 + 
      fluxNorm * 0.2 + 
      centroidNorm * 0.15 +
      (tempoNorm > 0.6 ? 0.15 : 0)
    );
    
    // Fear/Panic: high frequency, high ZCR, high dynamics, rapid changes
    scores.fear = 0.1 + (
      freqNorm * 0.25 + 
      zcrNorm * 0.25 + 
      fluxNorm * 0.2 + 
      tempoNorm * 0.15 +
      (rolloffNorm > 0.7 ? 0.1 : 0)
    );
    
    // Stress: high frequency instability, variable amplitude, moderate energy
    scores.stress = 0.1 + (
      Math.abs(freqNorm - 0.5) * 0.2 +
      energyNorm * 0.2 +
      fluxNorm * 0.25 +
      Math.abs(ampNorm - 0.5) * 0.15 +
      tempoNorm * 0.2
    );
    
    // Happiness: moderate-high frequency, regular rhythm, moderate flux, stable
    scores.happiness = 0.1 + (
      freqNorm * 0.2 + 
      (1 - Math.abs(zcrNorm - 0.5)) * 0.15 +
      (fluxNorm < 0.5 ? 0.2 : 0.1) +
      (tempoNorm < 0.5 ? 0.2 : 0.1) +
      ampNorm * 0.15
    );
    
    // Alertness: high frequency, high amplitude, sharp spectral changes
    scores.alertness = 0.1 + (
      freqNorm * 0.2 + 
      ampNorm * 0.2 + 
      zcrNorm * 0.2 +
      fluxNorm * 0.2 +
      (energyNorm > 0.5 ? 0.2 : 0)
    );
    
    // Sadness: low frequency, low amplitude, low energy, stable
    scores.sadness = 0.1 + (
      (1 - freqNorm) * 0.25 + 
      (1 - ampNorm) * 0.25 + 
      (1 - energyNorm) * 0.2 +
      (fluxNorm < 0.4 ? 0.15 : 0.05) +
      (tempoNorm < 0.4 ? 0.1 : 0)
    );
    
    // Anxiety: high ZCR, variable amplitude, moderate-high flux
    scores.anxiety = 0.1 + (
      zcrNorm * 0.25 + 
      Math.abs(ampNorm - 0.5) * 0.2 +
      fluxNorm * 0.2 +
      tempoNorm * 0.2 +
      (freqNorm > 0.4 && freqNorm < 0.8 ? 0.15 : 0)
    );
    
    // Contentment: low-moderate frequency, smooth, low dynamics
    scores.contentment = 0.1 + (
      (1 - freqNorm) * 0.2 + 
      (1 - ampNorm) * 0.2 + 
      (fluxNorm < 0.3 ? 0.25 : 0.1) +
      (1 - zcrNorm) * 0.15 +
      (tempoNorm < 0.3 ? 0.2 : 0.05)
    );
    
    // Comfort: very low frequency, low amplitude, very smooth/stable
    scores.comfort = 0.1 + (
      (1 - freqNorm) * 0.25 + 
      (1 - ampNorm) * 0.25 + 
      (1 - energyNorm) * 0.15 +
      (fluxNorm < 0.2 ? 0.2 : 0.05) +
      (tempoNorm < 0.25 ? 0.1 : 0)
    );

    // Normalize to probabilities
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    Object.keys(scores).forEach((key) => {
      const emotion = key as EmotionType;
      scores[emotion] = Math.max(0, scores[emotion] / (total || 0.9));
    });

    return scores;
  }

  async analyze(animal: AnimalType | null, audioBuffer: Buffer, sampleRate: number): Promise<AudioAnalysis> {
    const features = this.extractAudioFeatures(audioBuffer, sampleRate);
    
    // Auto-detect animal if not provided
    const detectedAnimal = animal || this.classifyAnimal(features);
    
    const emotionScores = this.classifyEmotion(detectedAnimal, features);
    
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
      animal: detectedAnimal,
      timestamp: new Date().toISOString(),
      dominantEmotion,
      emotionScores,
      audioFeatures: features,
    };
  }
}

export const audioAnalyzer = new AudioAnalyzer();
