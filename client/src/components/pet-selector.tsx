import { AnimalType, animalTypes } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Dog, Cat, Bird } from "lucide-react";
import { cn } from "@/lib/utils";

interface PetSelectorProps {
  selectedAnimal: AnimalType | null;
  onSelectAnimal: (animal: AnimalType) => void;
}

const animalConfig: Record<AnimalType, { label: string; icon: typeof Dog; description: string }> = {
  dog: { 
    label: "Dog", 
    icon: Dog,
    description: "Canine vocalizations"
  },
  cat: { 
    label: "Cat", 
    icon: Cat,
    description: "Feline vocalizations"
  },
  lovebirds: { 
    label: "Love Birds", 
    icon: Bird,
    description: "Parrot family calls"
  },
  chicken: { 
    label: "Chicken", 
    icon: Bird,
    description: "Poultry sounds"
  },
  pigeon: { 
    label: "Pigeon", 
    icon: Bird,
    description: "Dove family coos"
  },
};

export function PetSelector({ selectedAnimal, onSelectAnimal }: PetSelectorProps) {
  return (
    <Card className="p-4 lg:p-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground" data-testid="text-select-animal">
        Select Animal
      </h2>
      <div className="space-y-3">
        {animalTypes.map((animal) => {
          const config = animalConfig[animal];
          const Icon = config.icon;
          const isSelected = selectedAnimal === animal;

          return (
            <button
              key={animal}
              onClick={() => onSelectAnimal(animal)}
              data-testid={`button-select-${animal}`}
              className={cn(
                "w-full p-4 rounded-lg border transition-all duration-200",
                "flex items-center gap-3 text-left hover-elevate active-elevate-2",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-card-foreground border-card-border"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                isSelected ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                <Icon className={cn(
                  "w-6 h-6",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-semibold text-base",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {config.label}
                </div>
                <div className={cn(
                  "text-xs mt-0.5",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {config.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
