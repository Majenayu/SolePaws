import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { audioAnalyzer } from "./audio-analyzer";
import { analyzeAudioSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const poseData = req.body.poseData ? JSON.parse(req.body.poseData) : {};

      // For now, create a mock analysis with video context
      // In production, would process the actual video file
      const videoAnalysis = await audioAnalyzer.analyze(
        animal as any,
        Buffer.from([0]),
        44100
      );

      // Enhance with pose data if available
      if (poseData && Object.keys(poseData).length > 0) {
        // Modify emotion scores based on pose features
        const posureConfidence = poseData.score || 0.5;
        Object.keys(videoAnalysis.emotionScores).forEach(emotion => {
          videoAnalysis.emotionScores[emotion as any] *= (0.5 + posureConfidence * 0.5);
        });
      }

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
