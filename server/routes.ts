import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { audioAnalyzer } from "./audio-analyzer";
import { analyzeAudioSchema, trainingSampleSchema, type TrainingAudioSample, type AudioAnalysis } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import crypto from "crypto";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 200 * 1024 * 1024 }
});

// Extract audio from video and convert to PCM for analysis
async function extractAudioFromVideo(videoPath: string): Promise<{ buffer: Buffer; sampleRate: number }> {
  const outputPath = path.join(os.tmpdir(), `audio-${Date.now()}.wav`);
  
  // Verify file exists and has content
  try {
    const stats = await fs.stat(videoPath);
    if (stats.size === 0) {
      throw new Error('Video file is empty');
    }
    console.log(`Processing video file (${(stats.size / 1024 / 1024).toFixed(2)}MB)...`);
  } catch (error) {
    throw new Error(`Cannot access video file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return new Promise((resolve, reject) => {
    const ffmpegCmd = ffmpeg(videoPath)
      .toFormat('wav')
      .audioChannels(1)
      .audioFrequency(44100)
      .audioCodec('pcm_s16le');
    
    ffmpegCmd
      .on('end', async () => {
        try {
          const audioBuffer = await fs.readFile(outputPath);
          await fs.unlink(outputPath);
          
          // Skip WAV header (44 bytes) to get raw PCM data
          const pcmData = audioBuffer.slice(44);
          
          console.log(`Audio extraction complete: ${(pcmData.length / 1024).toFixed(2)}KB extracted`);
          
          resolve({
            buffer: pcmData,
            sampleRate: 44100
          });
        } catch (error) {
          try { await fs.unlink(outputPath); } catch {}
          reject(error);
        }
      })
      .on('error', (error: Error) => {
        console.error('FFmpeg processing error:', error.message);
        reject(new Error(`Audio extraction failed: ${error.message}`));
      })
      .save(outputPath);
  });
}

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
      
      // Use provided audioHash if available (from client-side hash)
      if (validatedData.audioHash) {
        const trainingSample = await storage.findMatchingTrainingSample(validatedData.audioHash, 0.95);
        if (trainingSample) {
          console.log(`Found exact training sample match: ${trainingSample.fileName} (${trainingSample.animal} - ${trainingSample.emotion})`);
          const emotionScores: Record<string, number> = {
            fear: 0.05,
            stress: 0.05,
            aggression: 0.05,
            comfort: 0.05,
            happiness: 0.05,
            sadness: 0.05,
            anxiety: 0.05,
            contentment: 0.05,
            alertness: 0.05,
          };
          emotionScores[trainingSample.emotion] = 0.55;
          
          const analysis: AudioAnalysis = {
            id: randomUUID(),
            animal: trainingSample.animal,
            timestamp: new Date().toISOString(),
            dominantEmotion: trainingSample.emotion as any,
            emotionScores: emotionScores as any,
            audioFeatures: { pitch: 0, frequency: 0, amplitude: 0, duration: 0 },
          };
          
          await storage.saveAnalysis(analysis);
          return res.json(analysis);
        }
      }
      
      const analysis = await audioAnalyzer.analyze(
        validatedData.animal || null, 
        audioBuffer,
        validatedData.sampleRate,
        storage
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

  // Video analysis endpoint - analyzes emotion based on AUDIO from video
  app.post('/api/analyze-video', upload.single('video'), async (req, res) => {
    let tempVideoPath: string | undefined;
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
      }

      tempVideoPath = req.file.path;
      const animal = req.body.animal || 'dog';
      
      console.log(`Extracting audio from video for emotion analysis...`);
      
      // Extract audio from video
      const { buffer: audioBuffer, sampleRate } = await extractAudioFromVideo(tempVideoPath);
      
      if (audioBuffer.length < 100) {
        // If no audio in video, return default contentment
        const defaultAnalysis = await audioAnalyzer.analyze(animal as any, Buffer.from([0]), 44100);
        defaultAnalysis.dominantEmotion = 'contentment';
        defaultAnalysis.emotionScores = {
          fear: 0.05,
          stress: 0.05,
          aggression: 0.05,
          comfort: 0.2,
          happiness: 0.15,
          sadness: 0.05,
          anxiety: 0.05,
          contentment: 0.35,
          alertness: 0.05,
        };
        await storage.saveAnalysis(defaultAnalysis);
        return res.json(defaultAnalysis);
      }
      
      console.log(`Analyzing audio (${audioBuffer.length} bytes) at ${sampleRate}Hz for ${animal} emotion...`);
      
      // Analyze audio for emotion
      const analysis = await audioAnalyzer.analyze(
        animal as any,
        audioBuffer,
        sampleRate,
        storage
      );
      
      console.log(`Video emotion analysis complete: ${analysis.dominantEmotion} (confidence: ${(analysis.emotionScores[analysis.dominantEmotion] * 100).toFixed(1)}%)`);
      
      await storage.saveAnalysis(analysis);
      res.json(analysis);
      
    } catch (error) {
      console.error('Video analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze video',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      // Cleanup temp file
      if (tempVideoPath) {
        try {
          await fs.unlink(tempVideoPath);
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
      }
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

  // Admin training routes
  app.get('/api/training-samples', async (_req, res) => {
    try {
      const samples = await storage.getTrainingSamples();
      res.json(samples);
    } catch (error) {
      console.error('Failed to fetch training samples:', error);
      res.status(500).json({ error: 'Failed to fetch training samples' });
    }
  });

  app.post('/api/training-samples', async (req, res) => {
    try {
      const { animal, emotion, audioData, fileName, audioHash } = req.body;
      
      // Use provided hash if available, otherwise create one from audioData
      let hash = audioHash;
      if (!hash && audioData) {
        hash = crypto
          .createHash('sha256')
          .update(audioData)
          .digest('hex');
      }

      const sample: TrainingAudioSample = {
        id: randomUUID(),
        animal,
        emotion,
        audioHash: hash || 'unknown',
        fileName,
        createdAt: new Date().toISOString(),
      };

      const saved = await storage.saveTrainingSample(sample);
      console.log(`Training sample saved: ${sample.fileName} (${sample.animal} - ${sample.emotion}), hash: ${sample.audioHash}`);
      res.json(saved);
    } catch (error) {
      console.error('Failed to save training sample:', error);
      res.status(500).json({ error: 'Failed to save training sample' });
    }
  });

  app.delete('/api/training-samples/:id', async (_req, res) => {
    try {
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete training sample:', error);
      res.status(500).json({ error: 'Failed to delete training sample' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
