import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Upload, Square, Loader2 } from "lucide-react";
import { AudioAnalysis } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AudioInputProps {
  onAnalysisComplete: (analysis: AudioAnalysis) => void;
  onAnalyzing: (analyzing: boolean) => void;
  onAudioData: (data: number[]) => void;
  sampleFile?: File;
}

export function AudioInput({ 
  onAnalysisComplete, 
  onAnalyzing,
  onAudioData,
  sampleFile
}: AudioInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const onAudioDataRef = useRef(onAudioData);
  
  const { toast } = useToast();
  
  useEffect(() => {
    onAudioDataRef.current = onAudioData;
  }, [onAudioData]);

  useEffect(() => {
    if (sampleFile) {
      setSelectedFile(sampleFile);
      analyzeAudio(sampleFile, sampleFile.name);
    }
  }, [sampleFile]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        const normalizedData = Array.from(dataArray).map(v => (v - 128) / 128);
        onAudioDataRef.current(normalizedData);
        
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        await analyzeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      updateWaveform();
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record audio.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file.",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    await analyzeAudio(file, file.name);
    event.target.value = '';
  };

  const analyzeAudio = async (audioBlob: Blob, fileName?: string) => {
    setIsProcessing(true);
    onAnalyzing(true);

    try {
      // Play the audio immediately
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);
      audioElement.play().catch(e => console.error('Playback error:', e));

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const durationSeconds = audioBuffer.duration;
      if (durationSeconds > 30) {
        toast({
          title: "Audio too long",
          description: "Please provide audio shorter than 30 seconds.",
          variant: "destructive",
        });
        audioContext.close();
        audioElement.pause();
        URL.revokeObjectURL(audioUrl);
        return;
      }
      
      const sampleRate = audioBuffer.sampleRate;
      
      let channelData: Float32Array;
      if (audioBuffer.numberOfChannels > 1) {
        const length = audioBuffer.length;
        const channels: Float32Array[] = [];
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
          channels.push(audioBuffer.getChannelData(ch));
        }
        
        const monoData = new Float32Array(length);
        const numChannels = audioBuffer.numberOfChannels;
        let maxAmplitude = 0;
        
        for (let i = 0; i < length; i++) {
          let sum = 0;
          for (let ch = 0; ch < numChannels; ch++) {
            sum += channels[ch][i];
          }
          const averaged = sum / numChannels;
          monoData[i] = averaged;
          maxAmplitude = Math.max(maxAmplitude, Math.abs(averaged));
        }
        
        if (maxAmplitude > 1.0) {
          const normFactor = 1.0 / maxAmplitude;
          for (let i = 0; i < length; i++) {
            monoData[i] *= normFactor;
          }
        }
        
        channelData = monoData;
      } else {
        channelData = audioBuffer.getChannelData(0);
      }
      
      const int16Array = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        int16Array[i] = Math.max(-32768, Math.min(32767, channelData[i] * 32768));
      }
      
      const uint8Array = new Uint8Array(int16Array.buffer);
      const pcmBlob = new Blob([uint8Array], { type: 'audio/pcm' });
      
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(pcmBlob);
      });
      
      audioContext.close();
      
      const res = await apiRequest(
        'POST',
        '/api/analyze',
        {
          audioData: base64Audio,
          sampleRate,
          fileName: fileName || 'recording.wav'
        }
      );
      
      const analysis: AudioAnalysis = await res.json();
      
      onAnalysisComplete(analysis);
      
      toast({
        title: "Analysis complete",
        description: `Detected ${analysis.dominantEmotion} with ${Math.round(analysis.emotionScores[analysis.dominantEmotion] * 100)}% confidence`,
      });
      
      // Cleanup
      audioElement.pause();
      URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedFile(null);
      onAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground" data-testid="text-audio-input">
        Audio Input
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <div className="mb-4">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
              isRecording 
                ? "bg-destructive animate-pulse" 
                : "bg-primary"
            )}>
              {isRecording ? (
                <Square className="w-8 h-8 text-destructive-foreground" />
              ) : (
                <Mic className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
          </div>
          
          <h3 className="font-semibold text-base mb-2 text-foreground">Real-time Recording</h3>
          {isRecording && (
            <p className="text-sm text-muted-foreground mb-3 font-mono" data-testid="text-recording-time">
              {formatTime(recordingTime)}
            </p>
          )}
          
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
            className="min-w-[140px]"
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <div className="mb-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
              <Upload className="w-8 h-8 text-secondary-foreground" />
            </div>
          </div>
          
          <h3 className="font-semibold text-base mb-2 text-foreground">Upload File</h3>
          <p className="text-xs text-muted-foreground mb-3 text-center">
            {selectedFile ? selectedFile.name : 'WAV, MP3, OGG, or M4A'}
          </p>
          
          <label htmlFor="audio-upload">
            <Button
              asChild
              disabled={isProcessing || isRecording}
              size="lg"
              variant="secondary"
              data-testid="button-upload-file"
              className="min-w-[140px]"
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Browse Files
              </span>
            </Button>
          </label>
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="input-audio-file"
          />
        </div>
      </div>
      
      {isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span data-testid="text-analyzing">Analyzing audio...</span>
        </div>
      )}
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
