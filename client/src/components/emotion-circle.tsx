import { AudioAnalysis, EmotionType, emotionTypes } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Zap, 
  Flame, 
  Heart, 
  Smile, 
  Frown, 
  CloudRain, 
  Shield,
  Bell 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmotionCircleProps {
  analysis: AudioAnalysis | null;
  isAnalyzing: boolean;
}

const emotionConfig: Record<EmotionType, { label: string; icon: typeof Heart; color: string }> = {
  fear: { label: "Fear", icon: AlertTriangle, color: "text-chart-4" },
  stress: { label: "Stress", icon: Zap, color: "text-chart-3" },
  aggression: { label: "Aggression", icon: Flame, color: "text-destructive" },
  comfort: { label: "Comfort", icon: Heart, color: "text-chart-2" },
  happiness: { label: "Happiness", icon: Smile, color: "text-chart-1" },
  sadness: { label: "Sadness", icon: Frown, color: "text-chart-5" },
  anxiety: { label: "Anxiety", icon: CloudRain, color: "text-muted-foreground" },
  contentment: { label: "Contentment", icon: Shield, color: "text-chart-2" },
  alertness: { label: "Alertness", icon: Bell, color: "text-primary" },
};

export function EmotionCircle({ analysis, isAnalyzing }: EmotionCircleProps) {
  const getEmotionAngle = (index: number) => {
    const angleStep = 360 / emotionTypes.length;
    return (angleStep * index - 90) * (Math.PI / 180);
  };

  const getEmotionPosition = (index: number, radius: number) => {
    const angle = getEmotionAngle(index);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-center text-foreground" data-testid="text-emotion-circle">
        Emotion Analysis
      </h2>
      
      <div className="flex items-center justify-center">
        <div className="relative w-full max-w-[400px] aspect-square">
          <svg 
            viewBox="0 0 400 400" 
            className="w-full h-full"
            aria-label="Emotion visualization circle"
          >
            <circle
              cx="200"
              cy="200"
              r="140"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
              className="opacity-30"
            />
            
            <circle
              cx="200"
              cy="200"
              r="100"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
              className="opacity-20"
            />
            
            <circle
              cx="200"
              cy="200"
              r="60"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
              className="opacity-10"
            />
            
            {emotionTypes.map((emotion, index) => {
              const config = emotionConfig[emotion];
              const pos = getEmotionPosition(index, 160);
              const score = analysis?.emotionScores[emotion] || 0;
              const isDominant = analysis?.dominantEmotion === emotion;
              const barLength = score * 50;
              const angle = (getEmotionAngle(index) * 180) / Math.PI;
              
              return (
                <g key={emotion} data-testid={`emotion-segment-${emotion}`}>
                  <line
                    x1="200"
                    y1="200"
                    x2={200 + Math.cos(getEmotionAngle(index)) * barLength}
                    y2={200 + Math.sin(getEmotionAngle(index)) * barLength}
                    stroke={isDominant ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                    strokeWidth={isDominant ? "6" : "3"}
                    className={cn(
                      "transition-all duration-500",
                      score > 0 ? "opacity-100" : "opacity-20"
                    )}
                    data-testid={`emotion-bar-${emotion}`}
                  />
                  
                  <circle
                    cx={200 + pos.x}
                    cy={200 + pos.y}
                    r={isDominant ? "28" : "22"}
                    fill={isDominant ? "hsl(var(--primary))" : "hsl(var(--card))"}
                    stroke={isDominant ? "hsl(var(--primary))" : "hsl(var(--border))"}
                    strokeWidth="2"
                    className={cn(
                      "transition-all duration-500",
                      isDominant && "drop-shadow-lg"
                    )}
                    data-testid={`emotion-circle-${emotion}`}
                  />
                  
                  <text
                    x={200 + pos.x}
                    y={200 + pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={cn(
                      "text-xs font-semibold pointer-events-none select-none",
                      isDominant ? "fill-primary-foreground" : "fill-foreground"
                    )}
                    style={{ fontSize: isDominant ? '11px' : '10px' }}
                    data-testid={`emotion-text-${emotion}`}
                  >
                    {config.label.slice(0, 4)}
                  </text>
                </g>
              );
            })}
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {isAnalyzing ? (
                <div className="animate-pulse">
                  <div className="text-sm text-muted-foreground mb-1">Analyzing...</div>
                  <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : analysis ? (
                <>
                  <div className="text-xs text-muted-foreground mb-1">Detected</div>
                  <div 
                    className="text-2xl font-bold text-foreground capitalize"
                    data-testid="text-dominant-emotion"
                  >
                    {analysis.dominantEmotion}
                  </div>
                  <div className="text-sm font-mono text-muted-foreground mt-1">
                    {Math.round(analysis.emotionScores[analysis.dominantEmotion] * 100)}%
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground px-8">
                  Select an animal and provide audio to begin analysis
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-3 gap-2">
        {emotionTypes.map((emotion) => {
          const config = emotionConfig[emotion];
          const Icon = config.icon;
          const score = analysis?.emotionScores[emotion] || 0;
          const isDominant = analysis?.dominantEmotion === emotion;
          
          return (
            <div
              key={emotion}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md border transition-all",
                isDominant 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card border-border"
              )}
              data-testid={`emotion-label-${emotion}`}
            >
              <Icon className={cn(
                "w-3 h-3 flex-shrink-0",
                isDominant ? "text-primary-foreground" : config.color
              )} />
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-xs font-medium truncate",
                  isDominant ? "text-primary-foreground" : "text-foreground"
                )}>
                  {config.label}
                </div>
                {score > 0 && (
                  <div className={cn(
                    "text-[10px] font-mono",
                    isDominant ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {Math.round(score * 100)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
