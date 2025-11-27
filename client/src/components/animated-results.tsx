import { useEffect, useState } from "react";
import { AudioAnalysis, emotionTypes } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnimatedResultsProps {
  analysis: AudioAnalysis | null;
  isAnalyzing: boolean;
}

interface ChartDataPoint {
  time: number;
  [key: string]: number;
}

const ANALYSIS_TIME = 8; // 8 seconds for both audio and video

export function AnimatedResults({ analysis, isAnalyzing }: AnimatedResultsProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (!analysis || !isAnalyzing) return;

    setChartData([]);
    setAnimationComplete(false);
    
    // Initialize chart with time 0
    const initialData: ChartDataPoint = { time: 0 };
    emotionTypes.forEach(emotion => {
      initialData[emotion] = Math.random() * 0.3;
    });
    setChartData([initialData]);

    // Animate for 8 seconds
    let currentTime = 0;
    const animationInterval = setInterval(() => {
      currentTime += 0.5; // Update every 500ms

      if (currentTime >= ANALYSIS_TIME) {
        // Animation complete - show final values
        const finalData: ChartDataPoint = { time: ANALYSIS_TIME };
        emotionTypes.forEach(emotion => {
          finalData[emotion] = analysis.emotionScores[emotion];
        });
        setChartData(prev => [...prev, finalData]);
        setAnimationComplete(true);
        clearInterval(animationInterval);
        return;
      }

      // Generate random readings with gradual bias towards final values
      const newData: ChartDataPoint = { time: parseFloat(currentTime.toFixed(1)) };
      const progress = currentTime / ANALYSIS_TIME;
      
      emotionTypes.forEach(emotion => {
        const randomValue = Math.random() * 0.5;
        const finalValue = analysis.emotionScores[emotion];
        newData[emotion] = randomValue * (1 - progress) + finalValue * progress;
      });

      setChartData(prev => [...prev, newData]);
    }, 500);

    return () => clearInterval(animationInterval);
  }, [analysis, isAnalyzing]);

  if (!analysis) return null;

  const colors = [
    "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", 
    "#10b981", "#ec4899", "#06b6d4", "#14b8a6", "#f97316"
  ];

  const emotionColors = emotionTypes.reduce((acc, emotion, idx) => {
    acc[emotion] = colors[idx % colors.length];
    return acc;
  }, {} as Record<string, string>);

  return (
    <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-teal-600">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-teal-200">Emotion Analysis - Live Results</h3>
        {animationComplete && (
          <span className="text-xs text-green-400 font-semibold">Analysis Complete</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis 
            dataKey="time" 
            stroke="rgba(148, 163, 184, 0.5)"
            label={{ value: "Time (sec)", position: "insideBottomRight", offset: -5 }}
          />
          <YAxis 
            stroke="rgba(148, 163, 184, 0.5)"
            domain={[0, 1]}
            label={{ value: "Confidence", angle: -90, position: "insideLeft" }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid #14b8a6" }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          {emotionTypes.map((emotion) => (
            <Line
              key={emotion}
              type="monotone"
              dataKey={emotion}
              stroke={emotionColors[emotion]}
              dot={false}
              isAnimationActive={isAnalyzing}
              animationDuration={300}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
