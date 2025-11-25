import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export class AnimalDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private initialized = false;

  async initialize() {
    try {
      console.log("Loading COCO-SSD model for animal detection...");
      this.model = await cocoSsd.load();
      this.initialized = true;
      console.log("Animal detector initialized successfully");
    } catch (error) {
      console.error("Failed to initialize animal detector:", error);
      this.initialized = false;
    }
  }

  async detectAnimals(videoElement: HTMLVideoElement): Promise<{ animal: string; confidence: number } | null> {
    if (!this.initialized || !this.model) {
      return null;
    }

    try {
      const predictions = await this.model.detect(videoElement);
      
      // Filter for animal classes
      const animalClasses = ["dog", "cat", "bird", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe"];
      const animalPredictions = predictions.filter(pred => 
        animalClasses.includes(pred.class.toLowerCase())
      );

      if (animalPredictions.length === 0) {
        return null;
      }

      // Get highest confidence detection
      const bestDetection = animalPredictions.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      // Map detected animal to our supported types
      let mappedAnimal = this.mapToSupportedAnimal(bestDetection.class.toLowerCase());

      return {
        animal: mappedAnimal,
        confidence: bestDetection.score
      };
    } catch (error) {
      console.error("Animal detection error:", error);
      return null;
    }
  }

  private mapToSupportedAnimal(detectedClass: string): string {
    // Map COCO-SSD classes to our animal types
    const mapping: Record<string, string> = {
      "dog": "dog",
      "cat": "cat",
      "bird": "lovebirds",  // Generic bird -> lovebirds
      "chicken": "chicken",
      "pigeon": "pigeon"
    };

    return mapping[detectedClass] || detectedClass;
  }
}
