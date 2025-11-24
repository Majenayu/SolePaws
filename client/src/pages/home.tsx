import { useState } from "react";
import { AnimalType, AudioAnalysis } from "@shared/schema";
import { PetSelector } from "@/components/pet-selector";
import { AudioInput } from "@/components/audio-input";
import { EmotionCircle } from "@/components/emotion-circle";
import { AudioWaveform } from "@/components/audio-waveform";
import { ResultsPanel } from "@/components/results-panel";
import { Activity } from "lucide-react";

export default function Home() {
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalType | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AudioAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AudioAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioData, setAudioData] = useState<number[] | null>(null);

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
          <Activity className="w-6 h-6 text-primary" data-testid="icon-logo" />
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-title">
            Animal Emotion Detection System
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-3">
            <PetSelector
              selectedAnimal={selectedAnimal}
              onSelectAnimal={setSelectedAnimal}
            />
          </div>

          <div className="lg:col-span-6 space-y-4 lg:space-y-6">
            <AudioInput
              selectedAnimal={selectedAnimal}
              onAnalysisComplete={handleAnalysisComplete}
              onAnalyzing={setIsAnalyzing}
              onAudioData={handleAudioData}
            />

            <EmotionCircle
              analysis={currentAnalysis}
              isAnalyzing={isAnalyzing}
            />

            <AudioWaveform
              audioData={audioData}
              isActive={isAnalyzing}
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
