"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Save, Upload, X, Crown } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { createPost, getPostCountThisMonth } from "@/lib/firestore/posts";
import { getFirebaseStorage } from "@/lib/firebase/client";
import { createCheckoutSession } from "@/lib/stripe/checkout";

const TONES = ["Professional", "Casual", "Academic"] as const;
type Tone = (typeof TONES)[number];

const FREE_MONTHLY_LIMIT = 5;

export function BlogGenerator() {
  const { user, userDoc } = useAuth();
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [monthlyCount, setMonthlyCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isPro = userDoc?.subscriptionStatus === "active" || userDoc?.subscriptionStatus === "trialing";
  const postsRemaining = monthlyCount !== null ? Math.max(0, FREE_MONTHLY_LIMIT - monthlyCount) : null;
  const isAtLimit = !isPro && postsRemaining !== null && postsRemaining === 0;

  useEffect(() => {
    if (!user) return;
    getPostCountThisMonth(user.uid).then(setMonthlyCount);
  }, [user]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setCoverImage(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGenerate() {
    if (!topic.trim() || isGenerating || isAtLimit) return;

    setIsGenerating(true);
    setGeneratedContent("");
    setError(null);
    setSaveMessage(null);

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), tone }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to generate");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setGeneratedContent((prev) => prev + content);
            }
          } catch {
            // skip malformed SSE chunks
          }
        }
      }

      if (!isPro) {
        setMonthlyCount((prev) => (prev !== null ? prev + 1 : 1));
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }

  async function handleSave() {
    if (!user || !generatedContent.trim() || isSaving) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      let coverImageUrl: string | null = null;

      if (coverImage) {
        const storageRef = ref(
          getFirebaseStorage(),
          `covers/${user.uid}/${Date.now()}-${coverImage.name}`,
        );
        await uploadBytes(storageRef, coverImage);
        coverImageUrl = await getDownloadURL(storageRef);
      }

      const firstLine = generatedContent.split("\n").find((l) => l.trim());
      const title = firstLine?.replace(/^#+\s*/, "").trim() ?? "Untitled Post";

      await createPost(user.uid, { title, content: generatedContent, coverImageUrl });
      setSaveMessage("Post saved as draft!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveMessage(`Failed to save: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpgrade() {
    if (!user) return;
    setIsUpgrading(true);
    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "";
      const url = await createCheckoutSession(priceId, user.uid);
      if (url) window.location.href = url;
    } finally {
      setIsUpgrading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Generate a Blog Post
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Enter a topic and choose a tone to generate your blog post.</span>
          {!isPro && postsRemaining !== null && (
            <span className={cn("text-xs font-medium", postsRemaining === 0 ? "text-destructive" : "text-muted-foreground")}>
              {postsRemaining} / {FREE_MONTHLY_LIMIT} free posts remaining this month
            </span>
          )}
          {isPro && (
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <Crown className="h-3 w-3" /> Pro — unlimited posts
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAtLimit ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
            <Crown className="h-8 w-8 text-primary mx-auto" />
            <p className="font-semibold">You've used all 5 free posts this month</p>
            <p className="text-sm text-muted-foreground">Upgrade to Pro for unlimited blog posts, advanced AI, and more.</p>
            <Button onClick={handleUpgrade} disabled={isUpgrading}>
              {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
              Upgrade to Pro — $19/month
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium leading-none">
                Topic or prompt
              </label>
              <Textarea
                id="topic"
                placeholder="e.g. The future of renewable energy in urban areas..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium leading-none">Tone</span>
              <div className="flex gap-2">
                {TONES.map((t) => (
                  <Button
                    key={t}
                    variant={tone === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTone(t)}
                    disabled={isGenerating}
                    className={cn(tone === t && "pointer-events-none")}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" />Generate</>
              )}
            </Button>
          </>
        )}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {generatedContent && (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-6">
              <div className="whitespace-pre-wrap">{generatedContent}</div>
            </div>

            {/* Cover image upload */}
            <div className="space-y-2">
              <span className="text-sm font-medium leading-none">Cover Image (optional)</span>
              {coverPreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                  <img src={coverPreview} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover" />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload cover image
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={isSaving} variant="outline">
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save as Draft
              </Button>
              {saveMessage && (
                <span className="text-sm text-muted-foreground">{saveMessage}</span>
              )}
            </div>
          </div>
        )}

        {!generatedContent && !isGenerating && !isAtLimit && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Your generated blog post will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
