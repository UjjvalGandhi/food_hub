"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Sparkles, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";

type InsightTone = "info" | "success" | "warning";

type DashboardInsight = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  tone: InsightTone;
};

type Props = {
  authToken?: string;
  className?: string;
};

const toneStyles: Record<InsightTone, string> = {
  info: "border-sky-200 bg-sky-50/70 text-sky-900",
  success: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
  warning: "border-amber-200 bg-amber-50/80 text-amber-900",
};

export function DashboardSmartSuggestions({ authToken, className }: Props) {
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/dashboard/insights", {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load smart suggestions");
        }

        if (isMounted) {
          setInsights(result.data.insights || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, "Failed to load smart suggestions"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInsights();

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  return (
    <section className={className}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1">
              <Brain className="h-3.5 w-3.5" />
              Smart Suggestions
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">AI-style guidance for your dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Practical next steps generated from your live operational data.
          </p>
        </div>
        <Sparkles className="hidden h-6 w-6 text-primary sm:block" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-44 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="rounded-3xl border-amber-200 bg-amber-50/80">
          <CardContent className="flex items-start gap-3 p-5 text-amber-900">
            <TriangleAlert className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Smart suggestions are unavailable right now</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {insights.map((insight) => (
            <Card
              key={insight.id}
              className={`rounded-3xl border shadow-sm transition-transform hover:-translate-y-0.5 ${toneStyles[insight.tone]}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6">{insight.description}</p>
                <Button asChild variant="outline" className="w-full justify-between rounded-2xl bg-white/70">
                  <Link href={insight.href}>
                    {insight.actionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
