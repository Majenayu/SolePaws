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
    <Card className="p-4 lg:p-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground" data-testid="text-results">
        Results
      </h2>
      
      {currentAnalysis ? (
        <div className="space-y-6">
          <div className="bg-muted/40 rounded-lg p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Current Reading
            </div>
            <div 
              className="text-3xl font-bold text-foreground capitalize mb-2"
              data-testid="text-current-emotion"
            >
              {currentAnalysis.dominantEmotion}
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span 
                className="text-4xl font-mono font-bold text-primary"
                data-testid="text-current-confidence"
              >
                {Math.round(currentAnalysis.emotionScores[currentAnalysis.dominantEmotion] * 100)}%
              </span>
              <span className="text-sm text-muted-foreground">confidence</span>
            </div>
            <div className="text-xs text-muted-foreground capitalize" data-testid="text-current-animal">
              {currentAnalysis.animal}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2" data-testid="text-current-timestamp">
              <Clock className="w-3 h-3" />
              {formatTimestamp(currentAnalysis.timestamp)}
            </div>
          </div>

          <div className="bg-card rounded-lg p-3 border border-border">
            <h3 className="text-sm font-semibold mb-2 text-foreground">Audio Features</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Pitch</div>
                <div className="font-mono font-semibold text-foreground" data-testid="text-pitch">
                  {currentAnalysis.audioFeatures.pitch.toFixed(1)} Hz
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Frequency</div>
                <div className="font-mono font-semibold text-foreground" data-testid="text-frequency">
                  {currentAnalysis.audioFeatures.frequency.toFixed(0)} Hz
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Amplitude</div>
                <div className="font-mono font-semibold text-foreground" data-testid="text-amplitude">
                  {(currentAnalysis.audioFeatures.amplitude * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Duration</div>
                <div className="font-mono font-semibold text-foreground" data-testid="text-duration">
                  {currentAnalysis.audioFeatures.duration.toFixed(1)}s
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
