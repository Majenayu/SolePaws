import { useState } from "react";
import { AudioAnalysis } from "@shared/schema";
import { AudioInput } from "@/components/audio-input";
import { VideoInput } from "@/components/video-input";
import { EmotionCircle } from "@/components/emotion-circle";
import { ResultsPanel } from "@/components/results-panel";
import { PetChatbot } from "@/components/pet-chatbot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Video } from "lucide-react";

export default function Home() {
  const [currentAnalysis, setCurrentAnalysis] = useState<AudioAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AudioAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<"audio" | "video">("audio");

  const handleAnalysisComplete = (analysis: AudioAnalysis) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory(prev => [analysis, ...prev].slice(0, 7));
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <header className="h-16 border-b-2 border-purple-200 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center px-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 text-white font-bold text-2xl" data-testid="icon-logo">🐾</div>
          <h1 className="text-2xl font-bold text-white drop-shadow-md" data-testid="text-title">
            SoulPaws - Pet Emotion Detection
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            {currentAnalysis && (
              <div className="bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-400 rounded-lg p-6 border-2 border-blue-300 shadow-lg">
                <div className="text-xs text-blue-900 font-semibold mb-4 flex items-center gap-1">
                  🐾 Current Animal
                </div>
                <div 
                  className="text-5xl font-bold text-white capitalize drop-shadow-md"
                  data-testid="text-animal-left"
                >
                  {currentAnalysis.animal}
                </div>

                <div className="mt-6 pt-6 border-t-2 border-blue-300">
                  <div className="text-xs text-blue-900 font-semibold mb-3 flex items-center gap-1">
                    ❤️ Emotion Analysis
                  </div>
                  <div 
                    className="text-2xl font-bold text-white capitalize drop-shadow-md mb-4"
                    data-testid="text-emotion-left"
                  >
                    {currentAnalysis.dominantEmotion}
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span 
                      className="text-lg font-mono font-bold text-yellow-300 drop-shadow-md"
                      data-testid="text-confidence-left"
                    >
                      {Math.round(currentAnalysis.emotionScores[currentAnalysis.dominantEmotion] * 100)}%
                    </span>
                    <span className="text-xs text-blue-900 font-semibold">confidence</span>
                  </div>
                  
                  <EmotionCircle
                    analysis={currentAnalysis}
                    isAnalyzing={isAnalyzing}
                    size="compact"
                  />
                </div>
              </div>
            )}
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
                />
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <VideoInput
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalyzing={setIsAnalyzing}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <ResultsPanel
              currentAnalysis={currentAnalysis}
              history={analysisHistory}
            />
            <PetChatbot />
          </div>
        </div>
      </main>
    </div>
  );
}
