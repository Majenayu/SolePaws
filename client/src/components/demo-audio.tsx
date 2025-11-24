import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { AudioAnalysis, animalTypes, emotionTypes, AnimalType, EmotionType } from "@shared/schema";
import { Play, Volume2, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DemoSample {
  animal: AnimalType;
  emotion: EmotionType;
  label: string;
  config: {
    pitch: number;
    frequency: number;
    amplitude: number;
    duration: number;
  };
}

interface DemoAudioProps {
  onAnalysisComplete: (analysis: AudioAnalysis) => void;
}

export function DemoAudio({ onAnalysisComplete }: DemoAudioProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalType>("dog");
  const [currentPlaying, setCurrentPlaying] = useState<EmotionType | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSource | null>(null);
  const { toast } = useToast();

  const { data: samples } = useQuery({
    queryKey: ["/api/demo-samples"],
  });

  const analyzeMutation = useMutation({
    mutationFn: async (emotion: EmotionType) => {
      const res = await apiRequest("POST", "/api/demo-analyze", {
        animal: selectedAnimal,
        emotion,
      });
      return res.json() as Promise<AudioAnalysis>;
    },
    onSuccess: (analysis) => {
      onAnalysisComplete(analysis);
      toast({
        title: "Demo analyzed",
        description: `${selectedAnimal}: ${analysis.dominantEmotion} (${Math.round(analysis.emotionScores[analysis.dominantEmotion] * 100)}%)`,
      });
      setCurrentPlaying(null);
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Could not analyze demo audio",
        variant: "destructive",
      });
      setCurrentPlaying(null);
    },
  });

  const playAndAnalyze = async (emotion: EmotionType) => {
    try {
      setCurrentPlaying(emotion);
      
      const emotionFrequencies: Record<EmotionType, number> = {
        fear: 350,
        stress: 380,
        aggression: 150,
        comfort: 280,
        happiness: 450,
        sadness: 200,
        anxiety: 320,
        contentment: 290,
        alertness: 400,
      };

      const duration = 1.5;
      const freq = emotionFrequencies[emotion];

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const sampleRate = ctx.sampleRate;
      const samples = Math.floor(sampleRate * duration);
      
      const buffer = ctx.createBuffer(1, samples, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const modulation = Math.sin(2 * Math.PI * 4 * t) * 0.3 + 0.7;
        const wave = Math.sin(2 * Math.PI * freq * modulation * t);
        const envelope = Math.exp(-t * 1.5);
        data[i] = wave * envelope * 0.3;
      }

      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch (e) {
          console.log("Source already stopped");
        }
      }

      sourceRef.current = ctx.createBufferSource();
      sourceRef.current.buffer = buffer;
      sourceRef.current.connect(ctx.destination);
      sourceRef.current.start(0);

      await new Promise((resolve) => {
        setTimeout(resolve, (duration + 0.2) * 1000);
      });

      analyzeMutation.mutate(emotion);
    } catch (error) {
      console.error("Error playing demo:", error);
      toast({
        title: "Playback failed",
        description: "Could not play demo audio. Try opening the browser console.",
        variant: "destructive",
      });
      setCurrentPlaying(null);
    }
  };

  const animalSamples = (samples as DemoSample[] | undefined)?.filter(
    (s: DemoSample) => s.animal === selectedAnimal
  ) || [];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2" data-testid="text-demo-title">
        <Volume2 className="w-5 h-5" />
        Demo Audio
      </h2>

      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-3 block">Select Animal</label>
        <div className="grid grid-cols-2 gap-2">
          {animalTypes.map((animal) => (
            <Button
              key={animal}
              variant={selectedAnimal === animal ? "default" : "outline"}
              onClick={() => setSelectedAnimal(animal)}
              className="capitalize text-xs"
              size="sm"
              data-testid={`button-select-demo-animal-${animal}`}
            >
              {animal}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Click to Hear & Analyze
        </label>
        <div className="grid grid-cols-3 gap-1">
          {emotionTypes.map((emotion) => {
            const isLoading = currentPlaying === emotion && analyzeMutation.isPending;
            const isPlaying = currentPlaying === emotion;

            return (
              <Button
                key={emotion}
                variant={isPlaying ? "default" : "outline"}
                size="sm"
                onClick={() => playAndAnalyze(emotion)}
                disabled={currentPlaying !== null}
                className="capitalize text-xs h-auto py-2"
                data-testid={`button-demo-play-${emotion}`}
              >
                {isLoading ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 mr-1" />
                )}
                {emotion.slice(0, 3)}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded border border-border">
        <p className="text-xs text-muted-foreground">
          Click an emotion button to hear a sample sound and see analysis results in the visualization.
        </p>
      </div>
    </Card>
  );
}
