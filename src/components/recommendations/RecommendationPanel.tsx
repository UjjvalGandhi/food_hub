"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, CloudRain, Thermometer, Clock, RefreshCw } from "lucide-react";
import { MoodSelector } from "./MoodSelector";
import { Button } from "@/components/ui/button";

interface Recommendation {
  _id: string;
  name: string;
  description: string;
  price: number;
  restaurant: { name: string };
  aiReasoning: string;
  matchPercentage: number;
}

interface ContextInfo {
  weather: { condition: string; temperature: number; description: string };
  timeOfDay: string;
  mood: string;
}

export function RecommendationPanel() {
  const [mood, setMood] = useState("happy");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ recommendations: Recommendation[]; summary: string; context: ContextInfo } | null>(null);

  const fetchRecommendations = async (selectedMood: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recommendations/contextual?mood=${selectedMood}`, {
        method: "GET", // Changing to GET as per contextual route implementation
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(mood);
  }, [mood]);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-none bg-gradient-to-br from-primary/5 via-background to-background shadow-xl overflow-hidden ring-1 ring-primary/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5 fill-primary" />
              <CardTitle className="text-xl font-bold italic">Smart Suggestions</CardTitle>
            </div>
            {data?.context?.weather && (
              <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border">
                <div className="flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>{data.context.weather.condition}</span>
                </div>
                <div className="flex items-center gap-1 border-l pl-3">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>{data.context.weather.temperature}°C</span>
                </div>
                <div className="flex items-center gap-1 border-l pl-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{data.context.timeOfDay}</span>
                </div>
              </div>
            )}
          </div>
          <CardDescription className="text-sm">
            AI-powered recommendations based on your mood, local weather, and preference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
               How's your mood?
            </p>
            <MoodSelector selectedMood={mood} onMoodSelect={setMood} />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-3xl border p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : data && data.recommendations ? (
            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                <p className="text-sm text-primary font-medium italic">"{data.summary}"</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recommendations.map((item) => (
                  <div 
                    key={item._id} 
                    className="group relative rounded-3xl border bg-background p-5 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{item.name}</h4>
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100">
                        {item.matchPercentage}% Match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-bold">
                      {item.restaurant.name}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                      {item.aiReasoning}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <p className="text-xl font-black text-primary">₹{item.price}</p>
                      <Button size="sm" className="rounded-xl px-4 shadow-lg shadow-primary/20">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="text-center py-8 text-muted-foreground">
               <p>Select a mood to get started!</p>
             </div>
          )}
        </CardContent>
      </Card>
      
      <Button 
        variant="ghost" 
        className="text-xs text-muted-foreground hover:text-primary h-auto p-0 flex items-center gap-1 mx-auto"
        onClick={() => fetchRecommendations(mood)}
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        Refresh recommendations
      </Button>
    </div>
  );
}
