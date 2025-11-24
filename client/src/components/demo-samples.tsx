import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Video, Loader2 } from "lucide-react";
import { useState } from "react";
import { AnimalType, AudioAnalysis } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface DemoSamplesProps {
  onAudioSampleLoad?: (file: File, analysis?: AudioAnalysis) => void;
  onVideoSampleLoad?: (file: File) => void;
}

interface SampleFile {
  id: string;
  name: string;
  type: "audio" | "video";
  animal: AnimalType;
  emotion: string;
  description: string;
  path: string;
  filesize: string;
}

const DEMO_SAMPLES: SampleFile[] = [
  {
    id: "dog-bark",
    name: "dog_0",
    type: "audio",
    animal: "dog",
    emotion: "Alertness/Aggression",
    description: "Real dog barking - alert and aroused state",
    path: "/attached_assets/dog_0_1763980119819.wav",
    filesize: "218 KB",
  },
  {
    id: "anger-vocalization",
    name: "anger31-5",
    type: "audio",
    animal: "dog",
    emotion: "Aggression/Stress",
    description: "Real animal vocalization - aggressive state",
    path: "/attached_assets/anger31-5_1763980119819.wav",
    filesize: "54 KB",
  },
];

export function DemoSamples({ onAudioSampleLoad, onVideoSampleLoad }: DemoSamplesProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAudioSample = async (sample: SampleFile) => {
    setLoadingId(sample.id);
    try {
      const response = await fetch(sample.path);
      if (!response.ok) throw new Error("Failed to load sample");

      const blob = await response.blob();
      const file = new File([blob], sample.name, { type: "audio/wav" });

      onAudioSampleLoad?.(file);

      toast({
        title: "Sample loaded",
        description: `Loaded: ${sample.name} (${sample.emotion})`,
      });
    } catch (error) {
      toast({
        title: "Failed to load sample",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const loadVideoSample = async (sample: SampleFile) => {
    setLoadingId(sample.id);
    try {
      const response = await fetch(sample.path);
      if (!response.ok) throw new Error("Failed to load sample");

      const blob = await response.blob();
      const file = new File([blob], sample.name, { type: "video/mp4" });

      onVideoSampleLoad?.(file);

      toast({
        title: "Sample loaded",
        description: `Loaded: ${sample.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to load sample",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const audioSamples = DEMO_SAMPLES.filter((s) => s.type === "audio");
  const videoSamples = DEMO_SAMPLES.filter((s) => s.type === "video");

  return (
    <Card className="p-4 bg-muted/50" data-testid="card-demo-samples">
      <h3 className="text-sm font-semibold text-foreground mb-3" data-testid="text-demo-title">
        Quick Demo Samples
      </h3>

      {audioSamples.length > 0 && (
        <div className="space-y-2 mb-4" data-testid="container-audio-samples">
          <p className="text-xs text-muted-foreground font-medium">Audio Samples:</p>
          {audioSamples.map((sample) => (
            <Button
              key={sample.id}
              onClick={() => loadAudioSample(sample)}
              disabled={loadingId !== null}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-2"
              data-testid={`button-load-audio-${sample.id}`}
            >
              {loadingId === sample.id ? (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <Mic className="w-3 h-3 mr-2" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-xs font-medium truncate">{sample.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {sample.emotion} • {sample.filesize}
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}

      {videoSamples.length > 0 && (
        <div className="space-y-2" data-testid="container-video-samples">
          <p className="text-xs text-muted-foreground font-medium">Video Samples:</p>
          {videoSamples.map((sample) => (
            <Button
              key={sample.id}
              onClick={() => loadVideoSample(sample)}
              disabled={loadingId !== null}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-2"
              data-testid={`button-load-video-${sample.id}`}
            >
              {loadingId === sample.id ? (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <Video className="w-3 h-3 mr-2" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{sample.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {sample.emotion} • {sample.filesize}
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t" data-testid="text-demo-info">
        💡 Click any sample to instantly load it for analysis
      </p>
    </Card>
  );
}
