"use client";

import { Button } from "@/components/ui/button";
import { Smile, Coffee, Moon, PartyPopper, Heart } from "lucide-react";

const moods = [
  { id: "happy", label: "Happy", icon: Smile, color: "text-yellow-500", bg: "bg-yellow-50" },
  { id: "tired", label: "Tired", icon: Coffee, color: "text-brown-500", bg: "bg-orange-50" },
  { id: "late night", label: "Cravings", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "party", label: "Party", icon: PartyPopper, color: "text-pink-500", bg: "bg-pink-50" },
  { id: "comfort", label: "Comfort", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
];

interface MoodSelectorProps {
  selectedMood: string;
  onMoodSelect: (mood: string) => void;
}

export function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {moods.map((mood) => {
        const Icon = mood.icon;
        const isActive = selectedMood === mood.id;
        
        return (
          <Button
            key={mood.id}
            variant={isActive ? "default" : "outline"}
            className={`h-auto py-3 px-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
              isActive ? "" : `${mood.bg} ${mood.color} border-transparent hover:border-muted`
            }`}
            onClick={() => onMoodSelect(mood.id)}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-semibold">{mood.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
