import { useState } from "react";
import { AudioAnalysis } from "@shared/schema";
import { AudioInput } from "@/components/audio-input";
import { VideoInput } from "@/components/video-input";
import { EmotionCircle } from "@/components/emotion-circle";
import { AnimatedResults } from "@/components/animated-results";
import { ResultsPanel } from "@/components/results-panel";
import { DraggableChatbot } from "@/components/draggable-chatbot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Video } from "lucide-react";

const ANIMAL_EMOJIS: { [key: string]: string } = {
  dog: "🐕",
  cat: "🐈",
  lovebird: "🦜",
  chicken: "🐓",
  pigeon: "🕊️",
};

const getAnimalEmoji = (animal: string) => ANIMAL_EMOJIS[animal.toLowerCase()] || "🐾";

export default function Home() {
  const [currentAnalysis, setCurrentAnalysis] = useState<AudioAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AudioAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<"audio" | "video">("audio");
  const [humanDetected, setHumanDetected] = useState(false);

  const handleAnalysisComplete = (analysis: AudioAnalysis) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory(prev => [analysis, ...prev].slice(0, 7));
    setIsAnalyzing(false);
  };

  const handleResetAnalysis = () => {
    setCurrentAnalysis(null);
    setIsAnalyzing(false);
    setHumanDetected(false);
  };

  const handleHumanDetected = (detected: boolean) => {
    setHumanDetected(detected);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-800 to-teal-950">
      <header className="h-16 border-b-2 border-teal-600 bg-gradient-to-r from-teal-700 to-teal-800 flex items-center justify-center px-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 text-teal-300 font-bold text-2xl" data-testid="icon-logo">🐾</div>
          <h1 className="text-2xl font-bold text-teal-100 drop-shadow-md" data-testid="text-title">
            SoulPaws - Smarter Care, Safer Connection
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            {currentAnalysis && (
              <div className="bg-gradient-to-br from-teal-700 to-teal-800 rounded-lg p-6 border-2 border-teal-500 shadow-lg">
                <div className="text-xs text-teal-200 font-semibold mb-4 flex items-center gap-1">
                  📍 Current Species
                </div>
                <div 
                  className="text-5xl font-bold text-teal-100 drop-shadow-md mb-2"
                  data-testid="text-animal-left"
                >
                  {getAnimalEmoji(currentAnalysis.animal)}
                </div>
                <div className="text-sm text-teal-200 capitalize font-semibold">{currentAnalysis.animal}</div>

                <div className="mt-6 pt-6 border-t-2 border-teal-500">
                  <div className="text-xs text-teal-200 font-semibold mb-3 flex items-center gap-1">
                    💫 Behaviour Analysis
                  </div>
                  <div 
                    className="text-2xl font-bold text-teal-100 capitalize drop-shadow-md mb-4"
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
                  Bio Echoistics
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
                  onResetAnalysis={handleResetAnalysis}
                  onHumanVoiceDetected={handleHumanDetected}
                />
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <VideoInput
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalyzing={setIsAnalyzing}
                  onResetAnalysis={handleResetAnalysis}
                  onHumanDetected={handleHumanDetected}
                />
              </TabsContent>
            </Tabs>

            {/* Animated Results with Charts */}
            {(isAnalyzing || currentAnalysis) && (
              <AnimatedResults 
                analysis={currentAnalysis}
                isAnalyzing={isAnalyzing}
              />
            )}
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <ResultsPanel
              currentAnalysis={currentAnalysis}
              history={analysisHistory}
              humanDetected={humanDetected}
            />
          </div>
        </div>
      </main>

      {/* Draggable Floating Chatbot */}
      <DraggableChatbot />
    </div>
  );
}
