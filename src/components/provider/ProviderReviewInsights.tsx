"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquareQuote, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/shared/SafeImage";
import { getErrorMessage } from "@/lib/utils";

type ProviderReview = {
  _id: string;
  rating: number;
  comment?: string;
  photoUrls?: string[];
  createdAt: string;
  providerReply?: {
    message: string;
    repliedAt: string;
  } | null;
  user: {
    name: string;
  };
};

type ReviewsPayload = {
  restaurantName: string;
  summary: {
    averageRating: number;
    lowRatings: number;
    totalReviews: number;
  };
  reviews: ProviderReview[];
};

export function ProviderReviewInsights() {
  const [data, setData] = useState<ReviewsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/provider/reviews");
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch review insights");
      }
      setData(result.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch review insights"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const submitReply = async (reviewId: string) => {
    const message = replyDrafts[reviewId]?.trim();
    if (!message) {
      toast.error("Write a short reply first.");
      return;
    }

    setReplyingId(reviewId);
    try {
      const response = await fetch(`/api/provider/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send reply");
      }

      setData((current) =>
        current
          ? {
              ...current,
              reviews: current.reviews.map((review) =>
                review._id === reviewId
                  ? { ...review, providerReply: result.data.providerReply }
                  : review
              ),
            }
          : current
      );
      setReplyDrafts((current) => ({ ...current, [reviewId]: "" }));
      toast.success(result.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send reply"));
    } finally {
      setReplyingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2].map((item) => (
          <Skeleton key={item} className="h-48 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Guest Feedback</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real reviews from {data.restaurantName} with photo proof and quick reply tools.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Average rating</p>
            <p className="mt-3 text-3xl font-black">{data.summary.averageRating || "New"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total reviews</p>
            <p className="mt-3 text-3xl font-black">{data.summary.totalReviews}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Low ratings</p>
            <p className="mt-3 text-3xl font-black">{data.summary.lowRatings}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {data.reviews.length === 0 ? (
          <Card className="rounded-3xl">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No reviews yet. Once customers start rating orders, feedback and reply tools will appear here.
            </CardContent>
          </Card>
        ) : (
          data.reviews.map((review) => (
            <Card key={review._id} className="rounded-3xl">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{review.user.name}</CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {review.rating}/5
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.comment ? <p className="text-sm leading-6">{review.comment}</p> : null}

                {review.photoUrls && review.photoUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {review.photoUrls.map((photoUrl) => (
                      <div key={photoUrl} className="relative h-28 overflow-hidden rounded-2xl bg-muted">
                        <SafeImage src={photoUrl} alt="Review photo" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}

                {review.providerReply ? (
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Your reply
                    </p>
                    <p className="text-sm">{review.providerReply.message}</p>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-dashed p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <MessageSquareQuote className="h-4 w-4 text-primary" />
                      Reply to this review
                    </div>
                    <Textarea
                      placeholder="Thank them, acknowledge the issue, or explain how you’ll improve."
                      value={replyDrafts[review._id] || ""}
                      onChange={(event) =>
                        setReplyDrafts((current) => ({
                          ...current,
                          [review._id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      className="rounded-2xl"
                      onClick={() => submitReply(review._id)}
                      disabled={replyingId === review._id}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {replyingId === review._id ? "Sending..." : "Send reply"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
