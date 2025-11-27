import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, BookOpen } from "lucide-react";

const datasets = {
  dog: [
    {
      name: "Dog Voice Emotion Dataset (Demo-Lite)",
      emotions: "Angry, Happy, Fearful, Sad",
      samples: "163 audio clips",
      size: "~50MB",
      url: "https://www.kaggle.com/datasets/shivarao100/dog-voice-emotion-dataset",
      notes: "Short barks labeled by context. Good starter dataset."
    },
    {
      name: "EmotionalCanines",
      emotions: "Playful, Aggressive, Anxious, etc.",
      samples: "77,202 clips (33+ hours)",
      size: "~10GB",
      url: "https://dl.acm.org/doi/10.1145/3746027.3758298",
      notes: "Diverse breeds/ages. Best for robust training."
    }
  ],
  cat: [
    {
      name: "Cat Sound Classification Dataset V2",
      emotions: "Angry, Happy, Sad, Pain, Fear, etc.",
      samples: "1,200+ clips",
      size: "~200MB",
      url: "https://zenodo.org/records/4724180",
      notes: "Labeled by human annotators. Meows, purrs, growls included."
    },
    {
      name: "CatMeows Dataset",
      emotions: "Brushing, Isolation, Waiting for food",
      samples: "440 clips from 21 cats",
      size: "~100MB",
      url: "https://www.researchgate.net/publication/350548551_CatMeows_A_Publicly-Available_Dataset_of_Cat_Vocalizations",
      notes: "Focuses on meows. Good for valence-arousal mapping."
    }
  ],
  chicken: [
    {
      name: "Avian Emotions Dataset",
      emotions: "Hunger, Happiness, Fear, Distress",
      samples: "~500 clips",
      size: "~150MB",
      url: "https://aber.apacsci.com/index.php/met/article/viewFile/2858/3568",
      notes: "Labeled via behavior observation in farm settings."
    },
    {
      name: "Poultry Vocalization Signal Dataset",
      emotions: "Healthy, Unhealthy, Neutral",
      samples: "346 files",
      size: "~80MB",
      url: "https://data.mendeley.com/datasets/zp4nf2dxbh",
      notes: "Useful for distress detection in real-time."
    }
  ],
  lovebirds: [
    {
      name: "Parrot Vocal Emotion Dataset",
      emotions: "Happy, Angry, Sad",
      samples: "~200 annotated clips",
      size: "~50MB",
      url: "https://www.ijcrt.org/papers/IJCRT2404434.pdf",
      notes: "Includes lovebird-like species. Labeled by pitch/tone."
    },
    {
      name: "AudioSet Bird Calls",
      emotions: "Alarm calls, Courtship, etc.",
      samples: "2,000+ bird clips",
      size: "Large",
      url: "https://research.google.com/audioset/dataset/bird_vocalization_bird_call_bird_song.html",
      notes: "Includes lovebird chirps. Infer emotion via context."
    }
  ],
  pigeon: [
    {
      name: "Pigeon Vocalization Contexts",
      emotions: "Aggressive, Courtship, Distress, Neutral",
      samples: "~100 clips",
      size: "~20MB",
      url: "https://www.researchgate.net/publication/333682550_Expression_of_the_Emotions_in_Pigeons",
      notes: "Coos/grunts labeled by behavior. Scattered across papers."
    },
    {
      name: "Bird Soundscape Dataset (Eastern North America)",
      emotions: "Species/timing labels",
      samples: "16,052 annotations",
      size: "~5GB",
      url: "https://datadryad.org/stash/dataset/doi:10.5061/dryad.d2547d81z",
      notes: "48 species including pigeons. Strong timing/frequency labels."
    }
  ]
};

interface DatasetGuideProps {
  selectedAnimal?: string;
}

export function DatasetGuide({ selectedAnimal = "dog" }: DatasetGuideProps) {
  const animals = ["dog", "cat", "chicken", "lovebirds", "pigeon"] as const;
  const currentDatasets = datasets[selectedAnimal as keyof typeof datasets] || datasets.dog;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Real Datasets</h2>
      </div>

      <Tabs defaultValue={selectedAnimal} className="w-full">
        <TabsList className="grid w-full grid-cols-5 gap-1">
          {animals.map((animal) => (
            <TabsTrigger key={animal} value={animal} className="text-xs capitalize">
              {animal === "lovebirds" ? "Birds" : animal}
            </TabsTrigger>
          ))}
        </TabsList>

        {animals.map((animal) => (
          <TabsContent key={animal} value={animal} className="space-y-3 mt-4">
            {datasets[animal].map((dataset, idx) => (
              <div key={idx} className="p-3 border border-border rounded-lg bg-card/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-foreground">{dataset.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-mono">{dataset.samples}</span> • <span>{dataset.size}</span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="shrink-0"
                    data-testid={`button-dataset-${animal}-${idx}`}
                  >
                    <a href={dataset.url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3 h-3 mr-1" />
                      Get
                    </a>
                  </Button>
                </div>
                <div className="text-xs space-y-1">
                  <p><span className="text-muted-foreground">Emotions:</span> {dataset.emotions}</p>
                  <p><span className="text-muted-foreground">Notes:</span> {dataset.notes}</p>
                </div>
              </div>
            ))}

            <div className="p-3 bg-muted/50 border border-border rounded-lg text-xs space-y-2">
              <p className="font-medium text-foreground">How to use:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Download the dataset for your animal</li>
                <li>Extract and organize audio files locally</li>
                <li>Use the app to upload and analyze real audio files</li>
                <li>Review the emotion detection results</li>
              </ol>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          📚 <strong>Research Tip:</strong> For best results, preprocess audio with MFCCs, pitch extraction, and spectrograms using Librosa or similar tools.
        </p>
      </div>
    </Card>
  );
}
