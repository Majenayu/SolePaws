import { AnimalType, EmotionType, emotionTypes, animalTypes } from "@shared/schema";

interface DemoAudioConfig {
  pitch: number;
  frequency: number;
  amplitude: number;
  duration: number;
  label: string;
}

const demoConfigs: Record<AnimalType, Record<EmotionType, DemoAudioConfig>> = {
  dog: {
    fear: { pitch: 300, frequency: 400, amplitude: 0.4, duration: 1.5, label: "Dog - Scared Bark" },
    stress: { pitch: 280, frequency: 450, amplitude: 0.6, duration: 2.0, label: "Dog - Stressed Whine" },
    aggression: { pitch: 150, frequency: 200, amplitude: 0.8, duration: 1.0, label: "Dog - Aggressive Growl" },
    comfort: { pitch: 250, frequency: 350, amplitude: 0.3, duration: 2.5, label: "Dog - Contentment Whimper" },
    happiness: { pitch: 400, frequency: 500, amplitude: 0.7, duration: 1.8, label: "Dog - Happy Bark" },
    sadness: { pitch: 200, frequency: 300, amplitude: 0.4, duration: 3.0, label: "Dog - Sad Whine" },
    anxiety: { pitch: 320, frequency: 420, amplitude: 0.5, duration: 2.2, label: "Dog - Anxious Pant" },
    contentment: { pitch: 260, frequency: 360, amplitude: 0.35, duration: 2.8, label: "Dog - Content Sigh" },
    alertness: { pitch: 350, frequency: 480, amplitude: 0.65, duration: 0.8, label: "Dog - Alert Yelp" },
  },
  cat: {
    fear: { pitch: 350, frequency: 500, amplitude: 0.45, duration: 1.2, label: "Cat - Frightened Hiss" },
    stress: { pitch: 320, frequency: 480, amplitude: 0.55, duration: 1.8, label: "Cat - Stressed Meow" },
    aggression: { pitch: 280, frequency: 420, amplitude: 0.75, duration: 0.9, label: "Cat - Aggressive Spit" },
    comfort: { pitch: 380, frequency: 520, amplitude: 0.4, duration: 2.3, label: "Cat - Comfort Purr" },
    happiness: { pitch: 420, frequency: 560, amplitude: 0.65, duration: 2.0, label: "Cat - Happy Chirp" },
    sadness: { pitch: 250, frequency: 350, amplitude: 0.38, duration: 2.7, label: "Cat - Sad Cry" },
    anxiety: { pitch: 360, frequency: 510, amplitude: 0.48, duration: 1.5, label: "Cat - Anxious Meow" },
    contentment: { pitch: 390, frequency: 530, amplitude: 0.42, duration: 2.5, label: "Cat - Contentment Purr" },
    alertness: { pitch: 400, frequency: 540, amplitude: 0.60, duration: 0.7, label: "Cat - Alert Meow" },
  },
  lovebirds: {
    fear: { pitch: 600, frequency: 800, amplitude: 0.5, duration: 1.3, label: "Lovebird - Fearful Squawk" },
    stress: { pitch: 580, frequency: 780, amplitude: 0.6, duration: 1.9, label: "Lovebird - Stressed Chirp" },
    aggression: { pitch: 500, frequency: 700, amplitude: 0.8, duration: 0.8, label: "Lovebird - Aggressive Screech" },
    comfort: { pitch: 650, frequency: 850, amplitude: 0.35, duration: 2.4, label: "Lovebird - Comfort Song" },
    happiness: { pitch: 700, frequency: 900, amplitude: 0.7, duration: 2.1, label: "Lovebird - Happy Tweet" },
    sadness: { pitch: 450, frequency: 600, amplitude: 0.42, duration: 2.8, label: "Lovebird - Sad Call" },
    anxiety: { pitch: 620, frequency: 820, amplitude: 0.52, duration: 1.6, label: "Lovebird - Anxious Chirp" },
    contentment: { pitch: 670, frequency: 870, amplitude: 0.45, duration: 2.6, label: "Lovebird - Contentment Song" },
    alertness: { pitch: 680, frequency: 880, amplitude: 0.65, duration: 0.9, label: "Lovebird - Alert Call" },
  },
  chicken: {
    fear: { pitch: 400, frequency: 550, amplitude: 0.48, duration: 1.4, label: "Chicken - Frightened Cluck" },
    stress: { pitch: 380, frequency: 520, amplitude: 0.58, duration: 2.0, label: "Chicken - Stressed Cluck" },
    aggression: { pitch: 300, frequency: 420, amplitude: 0.78, duration: 0.85, label: "Chicken - Aggressive Screech" },
    comfort: { pitch: 420, frequency: 570, amplitude: 0.38, duration: 2.5, label: "Chicken - Comfort Coo" },
    happiness: { pitch: 480, frequency: 620, amplitude: 0.68, duration: 2.2, label: "Chicken - Happy Cluck" },
    sadness: { pitch: 320, frequency: 450, amplitude: 0.40, duration: 2.9, label: "Chicken - Sad Whimper" },
    anxiety: { pitch: 410, frequency: 560, amplitude: 0.50, duration: 1.7, label: "Chicken - Anxious Cluck" },
    contentment: { pitch: 440, frequency: 580, amplitude: 0.44, duration: 2.7, label: "Chicken - Contentment Coo" },
    alertness: { pitch: 460, frequency: 600, amplitude: 0.63, duration: 0.8, label: "Chicken - Alert Cluck" },
  },
  pigeon: {
    fear: { pitch: 380, frequency: 520, amplitude: 0.46, duration: 1.3, label: "Pigeon - Frightened Coo" },
    stress: { pitch: 360, frequency: 500, amplitude: 0.56, duration: 1.9, label: "Pigeon - Stressed Call" },
    aggression: { pitch: 280, frequency: 400, amplitude: 0.76, duration: 0.9, label: "Pigeon - Aggressive Coo" },
    comfort: { pitch: 400, frequency: 550, amplitude: 0.36, duration: 2.6, label: "Pigeon - Comfort Coo" },
    happiness: { pitch: 460, frequency: 600, amplitude: 0.66, duration: 2.3, label: "Pigeon - Happy Call" },
    sadness: { pitch: 300, frequency: 420, amplitude: 0.39, duration: 3.0, label: "Pigeon - Sad Coo" },
    anxiety: { pitch: 390, frequency: 530, amplitude: 0.48, duration: 1.6, label: "Pigeon - Anxious Call" },
    contentment: { pitch: 420, frequency: 560, amplitude: 0.43, duration: 2.8, label: "Pigeon - Contentment Coo" },
    alertness: { pitch: 440, frequency: 580, amplitude: 0.61, duration: 0.8, label: "Pigeon - Alert Call" },
  },
};

export function generateDemoAudio(animal: AnimalType, emotion: EmotionType): Buffer {
  const config = demoConfigs[animal][emotion];
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * config.duration);
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const baseFreq = config.frequency;
    const modulationFreq = Math.random() * 50 + 50;
    
    const wave = Math.sin(2 * Math.PI * baseFreq * t) * 
                Math.sin(2 * Math.PI * modulationFreq * t * 0.1) *
                config.amplitude;
    
    const envelope = Math.exp(-t / config.duration);
    audioData[i] = wave * envelope;
  }

  const int16Array = new Int16Array(samples);
  for (let i = 0; i < samples; i++) {
    int16Array[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
  }

  return Buffer.from(int16Array.buffer);
}

export function getDemoAudioLabel(animal: AnimalType, emotion: EmotionType): string {
  return demoConfigs[animal][emotion].label;
}

export function getDemoAudioConfig(animal: AnimalType, emotion: EmotionType) {
  return demoConfigs[animal][emotion];
}

export function getAllDemoSamples() {
  const samples = [];
  for (const animal of animalTypes) {
    for (const emotion of emotionTypes) {
      samples.push({
        animal,
        emotion,
        label: getDemoAudioLabel(animal, emotion),
        config: getDemoAudioConfig(animal, emotion),
      });
    }
  }
  return samples;
}
