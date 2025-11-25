import { useState } from "react";
import { AudioAnalysis } from "@shared/schema";
import { AudioInput } from "@/components/audio-input";
import { VideoInput } from "@/components/video-input";
import { EmotionCircle } from "@/components/emotion-circle";
import { AudioWaveform } from "@/components/audio-waveform";
import { ResultsPanel } from "@/components/results-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Video } from "lucide-react";

export default function Home() {
  const [currentAnalysis, setCurrentAnalysis] = useState<AudioAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AudioAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioData, setAudioData] = useState<number[] | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"audio" | "video">("audio");

  const handleAnalysisComplete = (analysis: AudioAnalysis) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory(prev => [analysis, ...prev].slice(0, 7));
    setIsAnalyzing(false);
  };

  const handleAudioData = (data: number[]) => {
    setAudioData(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border bg-card flex items-center justify-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 text-primary font-bold text-lg" data-testid="icon-logo">🐾</div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-title">
            SoulPaws - Pet Emotion Detection
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
          </div>

          <div className="lg:col-span-6 space-y-4 lg:space-y-6">
            <Tabs value={analysisMode} onValueChange={(v) => setAnalysisMode(v as "audio" | "video")} data-testid="tabs-analysis-mode">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="audio" data-testid="tab-audio">
                  <Mic className="w-4 h-4 mr-2" />
                  Audio Analysis
                </TabsTrigger>
                <TabsTrigger value="video" data-testid="tab-video">
                  <Video className="w-4 h-4 mr-2" />
                  Video Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="audio" className="space-y-4">
                <AudioInput
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalyzing={setIsAnalyzing}
                  onAudioData={handleAudioData}
                />

                <AudioWaveform
                  audioData={audioData}
                  isActive={isAnalyzing}
                />
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <VideoInput
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalyzing={setIsAnalyzing}
                />
              </TabsContent>
            </Tabs>

            <EmotionCircle
              analysis={currentAnalysis}
              isAnalyzing={isAnalyzing}
            />
          </div>

          <div className="lg:col-span-3">
            <ResultsPanel
              currentAnalysis={currentAnalysis}
              history={analysisHistory}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
