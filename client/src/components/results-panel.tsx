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
    <Card className="p-4 lg:p-6 bg-gradient-to-br from-teal-800 to-slate-800 border-2 border-teal-600">
      <h2 className="text-xl font-bold mb-4 text-teal-200" data-testid="text-results">
        📊 Results
      </h2>
      
      {currentAnalysis ? (
        <div className="space-y-6">
          <div className="bg-slate-700 rounded-lg p-3 border border-teal-600">
            <h3 className="text-sm font-semibold mb-2 text-teal-200">Bio Echoistics Features</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-teal-400">Pitch</div>
                <div className="font-mono font-semibold text-teal-100" data-testid="text-pitch">
                  {currentAnalysis.audioFeatures?.pitch != null ? `${currentAnalysis.audioFeatures.pitch.toFixed(1)} Hz` : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-teal-400">Frequency</div>
                <div className="font-mono font-semibold text-teal-100" data-testid="text-frequency">
                  {currentAnalysis.audioFeatures?.frequency != null ? `${currentAnalysis.audioFeatures.frequency.toFixed(0)} Hz` : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-teal-400">Amplitude</div>
                <div className="font-mono font-semibold text-teal-100" data-testid="text-amplitude">
                  {currentAnalysis.audioFeatures?.amplitude != null ? `${(currentAnalysis.audioFeatures.amplitude * 100).toFixed(0)}%` : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-teal-400">Duration</div>
                <div className="font-mono font-semibold text-teal-100" data-testid="text-duration">
                  {currentAnalysis.audioFeatures?.duration != null ? `${currentAnalysis.audioFeatures.duration.toFixed(1)}s` : "N/A"}
                </div>
              </div>
            </div>
          </div>
          
          {history.length > 0 && (
            <>
              <Separator />
              
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent History
                </h3>
                <ScrollArea className="h-[300px] pr-3">
                  <div className="space-y-2">
                    {history.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-md border border-border bg-card hover-elevate transition-all"
                        data-testid={`history-item-${index}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground capitalize" data-testid={`history-emotion-${index}`}>
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Analysis results will appear here after processing audio
          </p>
        </div>
      )}
    </Card>
  );
}
