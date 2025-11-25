import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { animalTypes, emotionTypes } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

interface TrainingSample {
  id: string;
  animal: string;
  emotion: string;
  fileName: string;
  createdAt: string;
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<string>("");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [trainingSamples, setTrainingSamples] = useState<TrainingSample[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "0000") {
      setIsAuthenticated(true);
      loadTrainingSamples();
    } else {
      toast({
        title: "Incorrect password",
        description: "Access denied",
        variant: "destructive",
      });
    }
  };

  const loadTrainingSamples = async () => {
    setIsLoadingSamples(true);
    try {
      const res = await fetch("/api/training-samples");
      const data = await res.json();
      setTrainingSamples(data);
    } catch (error) {
      console.error("Failed to load samples:", error);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedAnimal || !selectedEmotion) {
      toast({
        title: "Incomplete form",
        description: "Please select file, animal, and emotion",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/training-samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animal: selectedAnimal,
          emotion: selectedEmotion,
          fileName: selectedFile.name,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      toast({
        title: "Training sample uploaded",
        description: `${selectedFile.name} added to model`,
      });

      setSelectedFile(null);
      setSelectedAnimal("");
      setSelectedEmotion("");
      loadTrainingSamples();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteSample = async (id: string) => {
    try {
      const res = await fetch(`/api/training-samples/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      
      toast({
        title: "Sample deleted",
        description: "Training sample removed from model",
      });
      loadTrainingSamples();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-admin-title">Admin Panel</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium" data-testid="label-password">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                data-testid="input-password"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="button-login">
              Login
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <h1 className="text-2xl font-semibold text-foreground" data-testid="text-admin-header">
          SoulPaws Admin - Train Model
        </h1>
        <Button
          variant="ghost"
          onClick={() => {
            setIsAuthenticated(false);
            navigate("/");
          }}
          data-testid="button-logout"
        >
          Logout
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="p-6" data-testid="card-upload-form">
            <h2 className="text-lg font-semibold mb-4" data-testid="text-upload-title">
              Add Training Sample
            </h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="text-sm font-medium" data-testid="label-animal">Animal</label>
                <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
                  <SelectTrigger data-testid="select-animal">
                    <SelectValue placeholder="Select animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animalTypes.map((animal) => (
                      <SelectItem key={animal} value={animal}>
                        {animal.charAt(0).toUpperCase() + animal.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium" data-testid="label-emotion">Emotion</label>
                <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                  <SelectTrigger data-testid="select-emotion">
                    <SelectValue placeholder="Select emotion" />
                  </SelectTrigger>
                  <SelectContent>
                    {emotionTypes.map((emotion) => (
                      <SelectItem key={emotion} value={emotion}>
                        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium" data-testid="label-file">Audio File</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="audio-input"
                  />
                  <label htmlFor="audio-input" className="cursor-pointer" data-testid="label-file-input">
                    {selectedFile ? (
                      <span className="text-sm text-foreground">{selectedFile.name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Click to select audio file</span>
                    )}
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isUploading || !selectedFile || !selectedAnimal || !selectedEmotion}
                className="w-full"
                data-testid="button-upload-sample"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Sample
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Samples List */}
          <Card className="p-6" data-testid="card-samples-list">
            <h2 className="text-lg font-semibold mb-4" data-testid="text-samples-title">
              Training Samples ({trainingSamples.length})
            </h2>
            {isLoadingSamples ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : trainingSamples.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-samples">
                No training samples yet. Upload your first sample to start!
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {trainingSamples.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm"
                    data-testid={`row-sample-${sample.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground" data-testid={`text-filename-${sample.id}`}>
                        {sample.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-metadata-${sample.id}`}>
                        {sample.animal} - {sample.emotion}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSample(sample.id)}
                      data-testid={`button-delete-${sample.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="mt-6 p-4 bg-muted/50" data-testid="card-info">
          <p className="text-sm text-muted-foreground" data-testid="text-info">
            Train the model by uploading audio samples labeled with emotions. When audio is uploaded on the main page, it will be matched against these training samples to recognize emotions.
          </p>
        </Card>
      </main>
    </div>
  );
}
