import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export interface AnimalDetection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface DetectionResult {
  animal: string;
  confidence: number;
  detections: AnimalDetection[];
}

export class AnimalDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private initialized = false;

  async initialize() {
    try {
      console.log("Loading COCO-SSD model for object detection...");
      this.model = await cocoSsd.load();
      this.initialized = true;
      console.log("Object detector initialized successfully");
    } catch (error) {
      console.error("Failed to initialize object detector:", error);
      this.initialized = false;
    }
  }

  // Detect ALL objects in video (for green bounding boxes)
  async detectAllObjects(videoElement: HTMLVideoElement): Promise<AnimalDetection[]> {
    if (!this.initialized || !this.model) {
      return [];
    }

    try {
      const predictions = await this.model.detect(videoElement);
      
      // Return ALL detections with confidence > 0.3
      const allDetections = predictions
        .filter(pred => pred.score > 0.3)
        .map(pred => ({
          class: pred.class,
          score: pred.score,
          bbox: pred.bbox as [number, number, number, number]
        }));

      return allDetections;
    } catch (error) {
      console.error("Object detection error:", error);
      return [];
    }
  }

  async detectAnimals(videoElement: HTMLVideoElement): Promise<DetectionResult | null> {
    if (!this.initialized || !this.model) {
      return null;
    }

    try {
      const predictions = await this.model.detect(videoElement);
      
      // Filter for animal classes
      const animalClasses = ["dog", "cat", "bird", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "chicken", "person"];
      const animalPredictions = predictions.filter(pred => 
        animalClasses.includes(pred.class.toLowerCase()) && pred.score > 0.3
      );

      if (animalPredictions.length === 0) {
        return null;
      }

      // Get highest confidence detection
      const bestDetection = animalPredictions.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      // Map detected animal to our supported types
      const mappedAnimal = this.mapToSupportedAnimal(bestDetection.class.toLowerCase());

      return {
        animal: mappedAnimal,
        confidence: bestDetection.score,
        detections: animalPredictions.map(pred => ({
          class: pred.class,
          score: pred.score,
          bbox: pred.bbox as [number, number, number, number]
        }))
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
      "bird": "lovebirds",
      "chicken": "chicken",
      "pigeon": "pigeon"
    };

    return mapping[detectedClass] || detectedClass;
  }
}
