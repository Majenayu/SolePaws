import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  audioData: number[] | null;
  isActive: boolean;
}

export function AudioWaveform({ audioData, isActive }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    if (!audioData || audioData.length === 0) {
      const borderColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--border')
        .trim()
        .replace(/(\d+)\s+(\d+%)\s+(\d+%)/, 'hsl($1, $2, $3)');
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const barWidth = width / audioData.length;
    const centerY = height / 2;

    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim()
      .replace(/(\d+)\s+(\d+%)\s+(\d+%)/, 'hsl($1, $2, $3)');
    
    const mutedColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--muted')
      .trim()
      .replace(/(\d+)\s+(\d+%)\s+(\d+%)/, 'hsl($1, $2, $3)');

    audioData.forEach((value, index) => {
      const barHeight = Math.abs(value) * (height / 2) * 0.8;
      const x = index * barWidth;

      ctx.fillStyle = isActive ? primaryColor : mutedColor;
      ctx.fillRect(x, centerY - barHeight / 2, Math.max(barWidth - 1, 1), barHeight);
    });
  }, [audioData, isActive]);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 text-foreground" data-testid="text-waveform">
        Audio Waveform
      </h3>
      <div className="relative w-full h-32 bg-muted/30 rounded-md overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          aria-label="Audio waveform visualization"
          data-testid="canvas-waveform"
        />
        {!audioData && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            No audio input
          </div>
        )}
      </div>
    </Card>
  );
}
