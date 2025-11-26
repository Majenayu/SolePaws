import { AudioAnalysis } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ResultsPanelProps {
  currentAnalysis: AudioAnalysis | null;
  history: AudioAnalysis[];
}

export function ResultsPanel({ currentAnalysis, history }: ResultsPanelProps) {
  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <Card className="p-4 sm:p-6 h-fit">
      <h2 className="text-lg sm:text-xl font-bold mb-4 text-foreground flex items-center gap-2" data-testid="text-results">
        <TrendingUp className="w-5 h-5" />
        Results
      </h2>
      
      {currentAnalysis ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 uppercase">Latest Reading</div>
            
            <div 
              className="text-2xl sm:text-3xl font-bold text-foreground capitalize mb-2"
              data-testid="text-current-emotion"
            >
              {currentAnalysis.dominantEmotion}
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span 
                className="text-3xl sm:text-4xl font-mono font-bold text-green-600 dark:text-green-400"
                data-testid="text-current-confidence"
              >
                {Math.round(currentAnalysis.emotionScores[currentAnalysis.dominantEmotion] * 100)}%
              </span>
              <span className="text-xs sm:text-sm text-green-700 dark:text-green-300">confidence</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300 mt-2" data-testid="text-current-timestamp">
              <Clock className="w-3 h-3" />
              {formatTimestamp(currentAnalysis.timestamp)}
            </div>
          </div>

          <div className="bg-muted/60 dark:bg-muted/30 rounded-lg p-3 border border-border">
            <h3 className="text-xs sm:text-sm font-semibold mb-3 text-foreground uppercase">Audio Features</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-background/50 dark:bg-background/30 rounded-md p-2">
                <div className="text-muted-foreground text-xs mb-1">Pitch</div>
                <div className="font-mono font-semibold text-foreground" data-testid="text-pitch">
                  {currentAnalysis.audioFeatures?.pitch != null ? `${currentAnalysis.audioFeatures.pitch.toFixed(1)} Hz` : "N/A"}
                </div>
              </div>
              <div className="bg-background/50 dark:bg-background/30 rounded-md p-2">
                <div className="text-muted-foreground text-xs mb-1">Frequency</div>
                <div className="font-mono font-semibold text-foreground" data-testid="text-frequency">
                  {currentAnalysis.audioFeatures?.frequency != null ? `${currentAnalysis.audioFeatures.frequency.toFixed(0)} Hz` : "N/A"}
                </div>
              </div>
              <div className="bg-background/50 dark:bg-background/30 rounded-md p-2">
                <div className="text-muted-foreground text-xs mb-1">Amplitude</div>
                <div className="font-mono font-semibold text-foreground" data-testid="text-amplitude">
                  {currentAnalysis.audioFeatures?.amplitude != null ? `${(currentAnalysis.audioFeatures.amplitude * 100).toFixed(0)}%` : "N/A"}
                </div>
              </div>
              <div className="bg-background/50 dark:bg-background/30 rounded-md p-2">
                <div className="text-muted-foreground text-xs mb-1">Duration</div>
                <div className="font-mono font-semibold text-foreground" data-testid="text-duration">
                  {currentAnalysis.audioFeatures?.duration != null ? `${currentAnalysis.audioFeatures.duration.toFixed(1)}s` : "N/A"}
                </div>
              </div>
            </div>
          </div>
          
          {history.length > 0 && (
            <>
              <Separator className="my-2" />
              
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-3 text-foreground flex items-center gap-2 uppercase">
                  <Clock className="w-4 h-4" />
                  Recent History
                </h3>
                <ScrollArea className="h-48 sm:h-64 pr-3">
                  <div className="space-y-2">
                    {history.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-2 sm:p-3 rounded-md border border-border bg-muted/40 hover-elevate transition-all cursor-pointer"
                        data-testid={`history-item-${index}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs sm:text-sm font-semibold text-foreground capitalize" data-testid={`history-emotion-${index}`}>
                            {item.dominantEmotion}
                          </span>
                          <span className="text-xs font-mono text-primary font-semibold" data-testid={`history-confidence-${index}`}>
                            {Math.round(item.emotionScores[item.dominantEmotion] * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="capitalize" data-testid={`history-animal-${index}`}>{item.animal}</span>
                          <span data-testid={`history-timestamp-${index}`}>{formatTimestamp(item.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-[200px]">
            Start by analyzing audio or video to see results
          </p>
        </div>
      )}
    </Card>
  );
}
