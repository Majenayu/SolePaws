import { useEffect, useState } from "react";
import { AudioAnalysis, emotionTypes } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

interface AnimatedResultsProps {
  analysis: AudioAnalysis | null;
  isAnalyzing: boolean;
}

interface ChartDataPoint {
  time: number;
  [key: string]: number;
}

export function AnimatedResults({ analysis, isAnalyzing }: AnimatedResultsProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [displayedScores, setDisplayedScores] = useState<Record<string, number>>({});
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
    setDisplayedScores(initialData);

    // Animate for 7 seconds
    let currentTime = 0;
    const animationInterval = setInterval(() => {
      currentTime += 0.5; // Update every 500ms

      if (currentTime >= 7) {
        // Animation complete - show final values
        const finalData: ChartDataPoint = { time: 7 };
        emotionTypes.forEach(emotion => {
          finalData[emotion] = analysis.emotionScores[emotion];
        });
        setChartData(prev => [...prev, finalData]);
        setDisplayedScores(analysis.emotionScores);
        setAnimationComplete(true);
        clearInterval(animationInterval);
        return;
      }

      // Generate random readings with slight bias towards final values
      const newData: ChartDataPoint = { time: parseFloat(currentTime.toFixed(1)) };
      const progress = currentTime / 7;
      
      emotionTypes.forEach(emotion => {
        const randomValue = Math.random() * 0.5;
        const finalValue = analysis.emotionScores[emotion];
        // Gradually bias towards the final value as time progresses
        newData[emotion] = randomValue * (1 - progress) + finalValue * progress;
      });

      setChartData(prev => [...prev, newData]);
      setDisplayedScores(newData);
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

  // Prepare bar chart data from displayed scores
  const barData = emotionTypes.map(emotion => ({
    emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    score: Math.round(displayedScores[emotion] * 100),
  }));

  return (
    <div className="space-y-4">
      {/* Line Chart - Live Animation */}
      <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-teal-600">
        <h3 className="text-sm font-semibold text-teal-200 mb-3">Live Emotion Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
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
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            {emotionTypes.map((emotion, idx) => (
              <Line
                key={emotion}
                type="monotone"
                dataKey={emotion}
                stroke={emotionColors[emotion]}
                dot={false}
                isAnimationActive={isAnalyzing}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        {animationComplete && (
          <div className="mt-2 text-center text-xs text-green-400 font-semibold">
            Analysis Complete
          </div>
        )}
      </Card>

      {/* Bar Chart - Final Scores */}
      <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-teal-600">
        <h3 className="text-sm font-semibold text-teal-200 mb-3">Emotion Confidence Scores</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis type="number" stroke="rgba(148, 163, 184, 0.5)" domain={[0, 100]} />
            <YAxis dataKey="emotion" type="category" stroke="rgba(148, 163, 184, 0.5)" width={100} />
            <Tooltip 
              contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid #14b8a6" }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value) => `${value}%`}
            />
            <Bar dataKey="score" fill="#14b8a6" isAnimationActive={isAnalyzing} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Emotions Summary */}
      <Card className="p-4 bg-gradient-to-br from-teal-800 to-teal-700 border-teal-500">
        <h3 className="text-sm font-semibold text-teal-100 mb-3">Analysis Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-teal-200">Dominant Emotion</span>
            <span className="text-lg font-bold text-teal-100 capitalize">{analysis.dominantEmotion}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-teal-200">Confidence</span>
            <span className="text-lg font-bold text-yellow-300">{Math.round(analysis.emotionScores[analysis.dominantEmotion] * 100)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-teal-200">Animal Species</span>
            <span className="text-lg font-bold text-teal-100 capitalize">{analysis.animal}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
