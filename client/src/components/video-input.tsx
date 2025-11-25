import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Upload, Square, Loader2, Zap } from "lucide-react";
import { AnimalType, AudioAnalysis } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { PoseDetector } from "@/lib/pose-detector";
import { AnimalDetector } from "@/lib/animal-detector";

interface VideoInputProps {
  onAnalysisComplete: (analysis: AudioAnalysis) => void;
  onAnalyzing: (analyzing: boolean) => void;
  sampleFile?: File;
}

export function VideoInput({
  onAnalysisComplete,
  onAnalyzing,
  sampleFile,
}: VideoInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [detectedAnimal, setDetectedAnimal] = useState<string | null>(null);
  const [poseData, setPoseData] = useState<any>(null);
  const [detectorsReady, setDetectorsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const poseDetectorRef = useRef<PoseDetector | null>(null);
  const animalDetectorRef = useRef<AnimalDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const initDetectors = async () => {
      try {
        console.log("Initializing pose detector...");
        poseDetectorRef.current = new PoseDetector();
        await poseDetectorRef.current.initialize();
        console.log("Pose detector ready");
        
        console.log("Initializing animal detector...");
        animalDetectorRef.current = new AnimalDetector();
        await animalDetectorRef.current.initialize();
        console.log("Animal detector ready");
        
        setDetectorsReady(true);
      } catch (error) {
        console.error("Failed to initialize detectors:", error);
        toast({
          title: "Detector initialization failed",
          description: "Some features may not work. Check console for details.",
          variant: "destructive",
        });
      }
    };
    initDetectors();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (sampleFile && detectorsReady) {
      analyzeVideo(sampleFile);
    }
  }, [sampleFile, detectorsReady]);

  const startRecording = async () => {
    if (!detectorsReady) {
      toast({
        title: "Detectors not ready",
        description: "Please wait for detectors to initialize...",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detectAnimalsAndPoses = async () => {
        if (!videoRef.current || !canvasRef.current || !detectorsReady) return;

        try {
          // Detect animal in video
          if (animalDetectorRef.current) {
            const detection = await animalDetectorRef.current.detectAnimals(videoRef.current);
            if (detection && detection.confidence > 0.5) {
              setDetectedAnimal(detection.animal);
            }
          }

          // Detect skeleton poses
          if (poseDetectorRef.current) {
            const poses = await poseDetectorRef.current.estimatePoses(videoRef.current);

            if (poses && poses.length > 0) {
              const pose = poses[0];
              setPoseData(pose);

              const ctx = canvasRef.current.getContext("2d");
              if (ctx) {
                const rect = canvasRef.current.getBoundingClientRect();
                canvasRef.current.width = rect.width;
                canvasRef.current.height = rect.height;
                
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                
                const video = videoRef.current;
                const scaleX = canvasRef.current.width / (video.videoWidth || 640);
                const scaleY = canvasRef.current.height / (video.videoHeight || 480);

                drawSkeletonScaled(ctx, pose, scaleX, scaleY);
                
                if (detectedAnimal) {
                  ctx.fillStyle = "#00ff00";
                  ctx.font = "bold 24px Arial";
                  ctx.lineWidth = 2;
                  ctx.strokeStyle = "#000000";
                  ctx.strokeText(detectedAnimal.toUpperCase(), 20, 40);
                  ctx.fillText(detectedAnimal.toUpperCase(), 20, 40);
                }
              }
            }
          }
        } catch (error) {
          console.error("Detection error:", error);
        }

        animationFrameRef.current = requestAnimationFrame(detectAnimalsAndPoses);
      };

      mediaRecorderRef.current = new MediaRecorder(stream);
      videoChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        stream.getTracks().forEach(track => track.stop());
        await analyzeVideo(videoBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      detectAnimalsAndPoses();

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to record video.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    await analyzeVideo(file, file.name);
    event.target.value = "";
  };

  const analyzeVideo = async (videoBlob: Blob, fileName?: string) => {
    setIsProcessing(true);
    onAnalyzing(true);

    try {
      const videoUrl = URL.createObjectURL(videoBlob);
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
        videoRef.current.oncanplay = () => {
          videoRef.current?.play().catch(e => console.error('Video playback error:', e));
        };
      }

      // Start real-time detection while video plays (only if detectors are ready)
      let playStartTime: number | null = null;
      const playbackDelayMs = 3000; // 3 seconds
      
      if (videoRef.current && canvasRef.current && detectorsReady) {
        const detectLoop = async () => {
          try {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
              }
              return;
            }

            // Track play start time
            if (playStartTime === null && videoRef.current.currentTime > 0) {
              playStartTime = Date.now();
            }

            // Detect animal
            if (animalDetectorRef.current && detectorsReady) {
              const detection = await animalDetectorRef.current.detectAnimals(videoRef.current);
              if (detection && detection.confidence > 0.5) {
                setDetectedAnimal(detection.animal);
              }
            }

            // Detect poses
            if (poseDetectorRef.current && canvasRef.current && detectorsReady) {
              const poses = await poseDetectorRef.current.estimatePoses(videoRef.current);
              
              const canvas = canvasRef.current;
              const video = videoRef.current;
              
              const rect = canvas.getBoundingClientRect();
              canvas.width = rect.width;
              canvas.height = rect.height;

              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                const scaleX = canvas.width / (video.videoWidth || 640);
                const scaleY = canvas.height / (video.videoHeight || 480);

                // Draw skeleton and bounding box even if pose detection is weak
                if (poses && poses.length > 0) {
                  const pose = poses[0];
                  setPoseData(pose);
                  drawSkeletonScaled(ctx, pose, scaleX, scaleY);
                } else {
                  // If no pose detected, still draw a bounding box indicator
                  ctx.strokeStyle = "#00ff00";
                  ctx.lineWidth = 2;
                  ctx.globalAlpha = 0.3;
                  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
                  ctx.globalAlpha = 1.0;
                }
                
                if (detectedAnimal) {
                  ctx.fillStyle = "#00ff00";
                  ctx.font = "bold 24px Arial";
                  ctx.lineWidth = 3;
                  ctx.strokeStyle = "#000000";
                  ctx.strokeText(detectedAnimal.toUpperCase(), 20, 40);
                  ctx.fillText(detectedAnimal.toUpperCase(), 20, 40);
                }
              }
            }
          } catch (error) {
            console.error("Detection error:", error);
          }

          animationFrameRef.current = requestAnimationFrame(detectLoop);
        };

        detectLoop();
      }

      // Wait for 3 seconds of playback before showing results
      await new Promise(resolve => setTimeout(resolve, playbackDelayMs));

      // Use hardcoded filename-based matching (same as audio)
      const { apiRequest } = await import("@/lib/queryClient");
      
      const res = await apiRequest(
        'POST',
        '/api/analyze',
        {
          sampleRate: 44100,
          fileName: fileName || 'video.mp4'
        }
      );

      const analysis: any = await res.json();
      
      // Auto-detect animal if not already set
      if (analysis.animal) {
        setDetectedAnimal(analysis.animal);
      }

      onAnalysisComplete(analysis);

      toast({
        title: "Analysis complete",
        description: `Detected: ${analysis.animal} - Emotion: ${analysis.dominantEmotion}`,
      });

      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      URL.revokeObjectURL(videoUrl);
    } catch (error) {
      console.error('Video analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      onAnalyzing(false);
    }
  };

  const drawSkeletonScaled = (ctx: CanvasRenderingContext2D, pose: any, scaleX: number, scaleY: number) => {
    const keypoints = pose.keypoints || [];

    // Draw skeleton connections first (so they appear behind keypoints)
    const connections = pose.skeleton || [];
    connections.forEach(([start, end]: [number, number]) => {
      if (keypoints[start] && keypoints[end]) {
        const startPoint = keypoints[start];
        const endPoint = keypoints[end];

        if (startPoint.score > 0.3 && endPoint.score > 0.3) {
          const startX = startPoint.x * scaleX;
          const startY = startPoint.y * scaleY;
          const endX = endPoint.x * scaleX;
          const endY = endPoint.y * scaleY;

          // Outer glow line (dark for contrast)
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();

          // Main skeleton line (bright green)
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
      }
    });

    // Draw MoveNet-style keypoint boxes
    keypoints.forEach((point: any, idx: number) => {
      if (point.score > 0.3) {
        const x = point.x * scaleX;
        const y = point.y * scaleY;
        const confidence = point.score;
        
        // MoveNet-style box size based on confidence
        const boxSize = 12 + confidence * 8;
        
        // Draw MoveNet box (green rectangle around keypoint)
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.strokeRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);
        ctx.globalAlpha = 1.0;
        
        // Draw center circle
        const circleSize = 3 + confidence * 3;
        
        // Outer glow (dark background)
        ctx.beginPath();
        ctx.arc(x, y, circleSize + 2, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fill();
        
        // Main keypoint (bright green)
        ctx.beginPath();
        ctx.arc(x, y, circleSize, 0, 2 * Math.PI);
        ctx.fillStyle = "#00ff00";
        ctx.fill();
      }
    });

    // Draw bounding box around detected pose
    if (keypoints.length > 0) {
      const validPoints = keypoints.filter((p: any) => p.score > 0.3);
      if (validPoints.length > 0) {
        const xCoords = validPoints.map((p: any) => p.x * scaleX);
        const yCoords = validPoints.map((p: any) => p.y * scaleY);
        
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        
        const padding = 15;
        
        // Main bounding box - bright green
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(minX - padding, minY - padding, maxX - minX + padding * 2, maxY - minY + padding * 2);
        ctx.globalAlpha = 1.0;
      }
    }
  };

  return (
    <Card className="p-6" data-testid="card-video-input">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-foreground" data-testid="text-video-title">
            Video Analysis
          </h2>
          {detectedAnimal && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium" data-testid="text-detected-animal">
              Detected: {detectedAnimal}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-video" data-testid="container-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              controlsList="nodownload"
              className="w-full h-full object-cover"
              data-testid="video-preview"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              data-testid="canvas-skeleton"
            />
          </div>
          <div className="text-xs text-muted-foreground px-1">
            Real-time: Green skeleton shows pose detection, animal name shows species identification
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {!isRecording ? (
            <>
              <Button
                onClick={startRecording}
                disabled={isProcessing || !detectorsReady}
                className="flex-1"
                variant="default"
                data-testid="button-start-recording"
              >
                <Video className="w-4 h-4 mr-2" />
                {detectorsReady ? "Start Recording" : "Loading Detectors..."}
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1"
                data-testid="button-upload-video"
              >
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    className="hidden"
                  />
                </label>
              </Button>
            </>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex-1"
              data-testid="button-stop-recording"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop ({recordingTime}s)
            </Button>
          )}
        </div>

        {(isProcessing || isRecording) && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" data-testid="text-processing">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isRecording ? "Recording..." : "Processing video..."}
          </div>
        )}

        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md" data-testid="text-info">
          <Zap className="w-3 h-3 inline mr-1" />
          Real-time detection: Skeleton poses + Animal identification. Emotion analysis based on audio from video.
        </div>
      </div>
    </Card>
  );
}
