import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { audioAnalyzer } from "./audio-analyzer";
import { analyzeAudioSchema } from "@shared/schema";
import { z } from "zod";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let poseLandmarker: PoseLandmarker | null = null;

async function initializePoseDetector() {
  try {
    const vision = await FilesetResolver.forVisionOnServer();
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/image_classifier/mobilenet_v3_small/float32/1model.tflite`,
      },
      runningMode: "IMAGE",
    });
    console.log("PoseLandmarker initialized");
  } catch (error) {
    console.warn("Failed to initialize PoseLandmarker:", error);
  }
}

initializePoseDetector();

// Analyze animal behavior from skeleton keypoints
function analyzeAnimalBehavior(keypoints: any[], animal: string) {
  const emotions = {
    happiness: 0,
    contentment: 0,
    alertness: 0,
    fear: 0,
    stress: 0,
    aggression: 0,
    comfort: 0,
    sadness: 0,
    anxiety: 0,
  };

  if (!keypoints || keypoints.length < 5) return emotions;

  // Extract key body positions
  const nose = keypoints[0];
  const leftShoulder = keypoints[5];
  const rightShoulder = keypoints[6];
  const leftHip = keypoints[11];
  const rightHip = keypoints[12];

  if (!nose || !leftShoulder || !rightShoulder) return emotions;

  // Calculate postural features
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
  const bodyHeight = Math.abs(leftHip.y - shoulderHeight);
  
  // Upright posture = alertness/happiness
  if (bodyHeight > 80) {
    emotions.alertness += 0.7;
    emotions.happiness += 0.5;
  } else {
    emotions.sadness += 0.5;
  }

  // Wide stance = confidence/happiness
  if (shoulderWidth > 120) {
    emotions.happiness += 0.6;
    emotions.contentment += 0.5;
  } else {
    emotions.anxiety += 0.4;
    emotions.fear += 0.3;
  }

  // Head position relative to shoulders
  const noseX = nose.x;
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const headTilt = Math.abs(noseX - shoulderCenterX);

  if (headTilt < 30) {
    emotions.contentment += 0.5;
    emotions.comfort += 0.6;
  } else if (headTilt > 80) {
    emotions.alertness += 0.7;
    emotions.aggression += 0.4;
  }

  // Movement intensity (keypoint confidence variation)
  const confidences = keypoints.map((k: any) => k.score || 0);
  const avgConfidence = confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length;
  
  if (avgConfidence > 0.8) {
    emotions.alertness += 0.6;
  } else if (avgConfidence < 0.5) {
    emotions.stress += 0.5;
    emotions.anxiety += 0.4;
  }

  // Normalize emotions to 0-1 range
  Object.keys(emotions).forEach(emotion => {
    emotions[emotion] = Math.min(emotions[emotion] / 2, 1);
  });

  return emotions;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Pose detection endpoint
  app.post('/api/detect-pose', async (req, res) => {
    try {
      const { imageData } = req.body;
      if (!imageData) {
        return res.json({ poses: [] });
      }

      // For now, return simulated skeleton data
      // In production, process with MediaPipe
      const poses = [{
        score: 0.7,
        keypoints: Array.from({ length: 17 }, (_, i) => ({
          x: Math.random() * 640,
          y: Math.random() * 480,
          score: 0.6 + Math.random() * 0.4,
          name: ["nose", "leftEye", "rightEye", "leftEar", "rightEar",
                  "leftShoulder", "rightShoulder", "leftElbow", "rightElbow",
                  "leftWrist", "rightWrist", "leftHip", "rightHip",
                  "leftKnee", "rightKnee", "leftAnkle", "rightAnkle"][i] || `kp${i}`
        }))
      }];

      res.json({ poses });
    } catch (error) {
      console.error("Pose detection error:", error);
      res.json({ poses: [] });
    }
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const validatedData = analyzeAudioSchema.parse(req.body);
      
      const base64Data = validatedData.audioData.split(',')[1] || validatedData.audioData;
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      if (audioBuffer.length < 100) {
        return res.status(400).json({ 
          error: 'Audio data too short. Please provide a longer audio sample.' 
        });
      }
      
      if (audioBuffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'Audio data too large. Maximum size is 10MB.' 
        });
      }
      
      const analysis = await audioAnalyzer.analyze(
        validatedData.animal, 
        audioBuffer,
        validatedData.sampleRate
      );
      
      await storage.saveAnalysis(analysis);
      
      res.json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data', 
          details: error.errors 
        });
      }
      
      console.error('Analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze audio' 
      });
    }
  });

  app.get('/api/analyses', async (_req, res) => {
    try {
      const analyses = await storage.getAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
      res.status(500).json({ error: 'Failed to fetch analyses' });
    }
  });

  app.get('/api/analyses/:id', async (req, res) => {
    try {
      const analysis = await storage.getAnalysisById(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      res.json(analysis);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      res.status(500).json({ error: 'Failed to fetch analysis' });
    }
  });

  // Video analysis endpoint
  app.post('/api/analyze-video', async (req, res) => {
    try {
      const animal = req.body.animal || req.body.detectedAnimal || 'dog';
      
      // Start with base audio analysis for empty buffer
      // This will give us emotion baseline
      const videoAnalysis = await audioAnalyzer.analyze(
        animal as any,
        Buffer.from([0]),
        44100
      );

      // Enhance with video-specific behavior cues
      // Skeleton data will be used to detect behavioral patterns
      const poseData = req.body.poseData ? JSON.parse(req.body.poseData) : null;
      
      if (poseData && poseData.keypoints) {
        // Analyze posture for behavioral cues
        const behaviorEmotions = analyzeAnimalBehavior(poseData.keypoints, animal);
        
        // Blend video behavior with audio analysis (60% behavior, 40% audio)
        Object.keys(behaviorEmotions).forEach(emotion => {
          const baseScore = videoAnalysis.emotionScores[emotion as any] || 0;
          const behaviorScore = behaviorEmotions[emotion as any] || 0;
          videoAnalysis.emotionScores[emotion as any] = (baseScore * 0.4 + behaviorScore * 0.6);
        });
      }

      // Recalculate dominant emotion based on updated scores
      let maxScore = 0;
      let dominantEmotion = videoAnalysis.dominantEmotion;
      Object.entries(videoAnalysis.emotionScores).forEach(([emotion, score]) => {
        if (score > maxScore) {
          maxScore = score;
          dominantEmotion = emotion as any;
        }
      });
      videoAnalysis.dominantEmotion = dominantEmotion;

      await storage.saveAnalysis(videoAnalysis);
      res.json(videoAnalysis);
    } catch (error) {
      console.error('Video analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze video' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
