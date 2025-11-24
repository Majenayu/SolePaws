import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { AudioAnalysis, animalTypes, emotionTypes, AnimalType, EmotionType } from "@shared/schema";
import { Play, Volume2 } from "lucide-react";
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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
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
        description: `${selectedAnimal} emotional state: ${analysis.dominantEmotion}`,
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Could not analyze demo audio",
        variant: "destructive",
      });
    },
  });

  const playAndAnalyze = async (emotion: EmotionType) => {
    try {
      setIsPlayingAudio(true);
      
      await analyzeDemo(selectedAnimal, emotion);
      analyzeMutation.mutate(emotion);
    } catch (error) {
      console.error("Error playing demo:", error);
      toast({
        title: "Playback failed",
        description: "Could not play demo audio",
        variant: "destructive",
      });
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const animalSamples = (samples as DemoSample[] | undefined)?.filter((s: DemoSample) => s.animal === selectedAnimal) || [];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground" data-testid="text-demo-title">
        Try Demo Audio
      </h2>

      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-3 block">Select Animal</label>
        <div className="grid grid-cols-2 gap-2">
          {animalTypes.map((animal) => (
            <Button
              key={animal}
              variant={selectedAnimal === animal ? "default" : "outline"}
              onClick={() => setSelectedAnimal(animal)}
              className="capitalize"
              data-testid={`button-select-demo-animal-${animal}`}
            >
              {animal}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Select Emotion to Hear & Analyze
        </label>
        <div className="grid grid-cols-3 gap-2">
          {emotionTypes.map((emotion) => {
            const sample = animalSamples.find((s: DemoSample) => s.emotion === emotion);
            const isLoading =
              analyzeMutation.isPending && isPlayingAudio;

            return (
              <Button
                key={emotion}
                variant="outline"
                size="sm"
                onClick={() => playAndAnalyze(emotion)}
                disabled={isLoading}
                className="capitalize text-xs h-auto py-2"
                data-testid={`button-demo-play-${emotion}`}
              >
                <Play className="w-3 h-3 mr-1" />
                {emotion}
              </Button>
            );
          })}
        </div>
      </div>

      {animalSamples.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Click any emotion button to hear a sample and analyze it
          </p>
        </div>
      )}
    </Card>
  );
}

async function analyzeDemo(animal: AnimalType, emotion: EmotionType) {
  const audioContext = new AudioContext();
  const sampleRate = audioContext.sampleRate;
  
  const duration = 2.0;
  const samples = Math.floor(sampleRate * duration);
  const audioData = new Float32Array(samples);

  const frequencies: Record<EmotionType, number> = {
    fear: 400,
    stress: 450,
    aggression: 200,
    comfort: 350,
    happiness: 500,
    sadness: 300,
    anxiety: 420,
    contentment: 360,
    alertness: 480,
  };

  const freq = frequencies[emotion];

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const wave = Math.sin(2 * Math.PI * freq * t) * Math.sin(2 * Math.PI * 50 * t * 0.1);
    const envelope = Math.exp(-t / duration);
    audioData[i] = wave * envelope * 0.5;
  }

  const buffer = audioContext.createBuffer(1, samples, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    channelData[i] = audioData[i];
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
  
  await new Promise((resolve) => setTimeout(resolve, duration * 1000 + 200));
  audioContext.close();
}
