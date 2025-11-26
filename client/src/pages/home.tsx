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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-4xl sm:text-5xl" data-testid="icon-logo">🐾</div>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent" data-testid="text-title">
              SoulPaws
            </h1>
            <span className="hidden sm:inline text-xs text-muted-foreground">Pet Emotion Detection</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Quick Stats - Show on mobile when analysis exists, hide on desktop */}
          {currentAnalysis && (
            <div className="col-span-1 md:col-span-1 lg:col-span-3 lg:hidden">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase">Current Analysis</div>
                <div className="text-3xl font-bold text-foreground capitalize mb-2">{currentAnalysis.animal}</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">{currentAnalysis.dominantEmotion}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(currentAnalysis.emotionScores[currentAnalysis.dominantEmotion] * 100)}%
                  </span>
                  <span className="text-xs text-blue-700 dark:text-blue-300">confidence</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Input Section */}
          <div className="col-span-1 md:col-span-1 lg:col-span-6">
            <div className="bg-card rounded-xl p-4 sm:p-6 border border-border shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Analyze Pet Emotions</h2>
              
              <Tabs value={analysisMode} onValueChange={(v) => setAnalysisMode(v as "audio" | "video")} data-testid="tabs-analysis-mode">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="audio" data-testid="tab-audio" className="gap-1 sm:gap-2">
                    <Mic className="w-4 h-4" />
                    <span className="hidden sm:inline">Audio</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" data-testid="tab-video" className="gap-1 sm:gap-2">
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">Video</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="audio" className="space-y-3">
                  <AudioInput
                    onAnalysisComplete={handleAnalysisComplete}
                    onAnalyzing={setIsAnalyzing}
                  />
                </TabsContent>

                <TabsContent value="video" className="space-y-3">
                  <VideoInput
                    onAnalysisComplete={handleAnalysisComplete}
                    onAnalyzing={setIsAnalyzing}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Emotion Circle - Mobile only below input */}
            {currentAnalysis && (
              <div className="mt-4 sm:mt-6 lg:hidden">
                <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Emotion Visualization</h3>
                  <EmotionCircle
                    analysis={currentAnalysis}
                    isAnalyzing={isAnalyzing}
                    size="compact"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            {currentAnalysis && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-6 border border-blue-200 dark:border-blue-800 sticky top-24">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase">Current Analysis</div>
                <div className="text-5xl font-bold text-foreground capitalize mb-4">{currentAnalysis.animal}</div>
                <div className="pt-4 border-t border-blue-300 dark:border-blue-700">
                  <div className="text-xs text-blue-700 dark:text-blue-300 mb-2 uppercase font-semibold">Primary Emotion</div>
                  <div className="text-3xl font-bold text-foreground capitalize mb-3">{currentAnalysis.dominantEmotion}</div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(currentAnalysis.emotionScores[currentAnalysis.dominantEmotion] * 100)}%
                    </span>
                    <span className="text-xs text-muted-foreground">confidence</span>
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

          {/* Results and Chatbot */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col gap-4">
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
