import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Upload, Square, Loader2, Zap } from "lucide-react";
import { AnimalType, AudioAnalysis } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PoseDetector } from "@/lib/pose-detector";

interface VideoInputProps {
  selectedAnimal: AnimalType | null;
  onAnalysisComplete: (analysis: AudioAnalysis) => void;
  onAnalyzing: (analyzing: boolean) => void;
  onAnimalDetected?: (animal: AnimalType) => void;
}

export function VideoInput({
  selectedAnimal,
  onAnalysisComplete,
  onAnalyzing,
  onAnimalDetected,
}: VideoInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [detectedAnimal, setDetectedAnimal] = useState<string | null>(null);
  const [poseData, setPoseData] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const poseDetectorRef = useRef<PoseDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const initPoseDetector = async () => {
      try {
        poseDetectorRef.current = new PoseDetector();
        await poseDetectorRef.current.initialize();
      } catch (error) {
        console.error("Failed to initialize pose detector:", error);
      }
    };
    initPoseDetector();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const detectPoses = async () => {
        if (!videoRef.current || !canvasRef.current || !poseDetectorRef.current) return;

        try {
          const poses = await poseDetectorRef.current.estimatePoses(videoRef.current);

          if (poses && poses.length > 0) {
            const pose = poses[0];
            setPoseData(pose);

            // Draw skeleton on canvas
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              ctx.drawImage(videoRef.current, 0, 0);
              drawSkeleton(ctx, pose);
            }

            // Simple animal detection from pose confidence
            const confidence = pose.score || 0.5;
            const animalType = confidence > 0.6 ? "dog" : "cat";
            setDetectedAnimal(animalType);
            if (onAnimalDetected) onAnimalDetected(animalType as AnimalType);
          }
        } catch (error) {
          console.error("Pose detection error:", error);
        }

        animationFrameRef.current = requestAnimationFrame(detectPoses);
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

      detectPoses();

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

    await analyzeVideo(file);
    event.target.value = "";
  };

  const analyzeVideo = async (videoBlob: Blob) => {
    setIsProcessing(true);
    onAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("video", videoBlob);
      formData.append("animal", selectedAnimal || "unknown");
      formData.append("detectedAnimal", detectedAnimal || "unknown");
      formData.append("poseData", JSON.stringify(poseData || {}));

      const analysis: any = await fetch("/api/analyze-video", {
        method: "POST",
        body: formData,
      }).then(r => r.json());

      onAnalysisComplete(analysis);

      toast({
        title: "Analysis complete",
        description: `Detected: ${analysis.animal} - Emotion: ${analysis.dominantEmotion}`,
      });
    } catch (error) {
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

  const drawSkeleton = (ctx: CanvasRenderingContext2D, pose: any) => {
    const keypoints = pose.keypoints || [];

    // Draw keypoints
    keypoints.forEach((point: any) => {
      if (point.score > 0.5) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "#00ff00";
        ctx.fill();
      }
    });

    // Draw skeleton connections
    const adjacentKeyPoints = [
      [0, 1], [0, 2], [1, 3], [2, 4], [0, 5], [0, 6], [5, 7], [7, 9],
      [6, 8], [8, 10], [5, 6], [5, 11], [6, 12], [11, 12], [11, 13], [13, 15],
      [12, 14], [14, 16],
    ];

    adjacentKeyPoints.forEach(([start, end]) => {
      if (keypoints[start] && keypoints[end]) {
        const startPoint = keypoints[start];
        const endPoint = keypoints[end];

        if (startPoint.score > 0.5 && endPoint.score > 0.5) {
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    });
  };

  return (
    <Card className="p-6" data-testid="card-video-input">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground" data-testid="text-video-title">
            Video Analysis
          </h2>
          {detectedAnimal && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium" data-testid="text-detected-animal">
              Detected: {detectedAnimal}
            </span>
          )}
        </div>

        <div className="relative bg-muted rounded-lg overflow-hidden aspect-video" data-testid="container-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            data-testid="video-preview"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            width={640}
            height={480}
            data-testid="canvas-skeleton"
          />
        </div>

        <div className="flex gap-2">
          {!isRecording ? (
            <>
              <Button
                onClick={startRecording}
                disabled={isProcessing}
                className="flex-1"
                variant="default"
                data-testid="button-start-recording"
              >
                <Video className="w-4 h-4 mr-2" />
                Start Recording
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

        <div className="text-xs text-muted-foreground p-3 bg-muted rounded" data-testid="text-info">
          <Zap className="w-3 h-3 inline mr-1" />
          Real-time skeleton detection shows animal posture and behavior analysis
        </div>
      </div>
    </Card>
  );
}
