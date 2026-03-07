"use client";

import { useSettings } from "@/hooks/use-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Sparkles,
  Settings,
  Rss,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const {
    settings,
    loaded,
    isAiConfigured,
    isVoiceConfigured,
    isCloudinaryConfigured,
    isPodcastConfigured,
    isFullyConfigured,
  } = useSettings();
  const [copied, setCopied] = useState(false);

  if (!loaded) return null;

  const feedParams = new URLSearchParams({
    cn: settings.cloudinaryCloudName,
    name: settings.podcastName,
    desc: settings.podcastDescription,
    author: settings.podcastAuthor,
    cat: settings.podcastCategory,
    ...(settings.podcastCoverUrl && { cover: settings.podcastCoverUrl }),
    ...(settings.podcastExplicit && { explicit: "true" }),
    ...(settings.podcastOwnerEmail && { email: settings.podcastOwnerEmail }),
    ...(settings.podcastWebsiteUrl && { website: settings.podcastWebsiteUrl }),
  });

  const feedUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/feed?${feedParams.toString()}`
      : "";

  const handleCopyFeed = async () => {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Podcast Automation</h1>
      <p className="text-muted-foreground">
        Generate AI-powered podcast episodes and publish them to Apple
        Podcasts & Spotify automatically.
      </p>

      {/* Setup Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckItem ok={isAiConfigured} label="AI Provider (OpenAI or Anthropic)" />
          <CheckItem ok={isVoiceConfigured} label="Voice (ElevenLabs or OpenAI TTS)" />
          <CheckItem ok={isCloudinaryConfigured} label="Cloudinary (free audio storage)" />
          <CheckItem ok={isPodcastConfigured} label="Podcast info (name at minimum)" />

          {!isFullyConfigured && (
            <Link href="/settings">
              <Button variant="outline" className="mt-2 w-full">
                <Settings className="mr-2 h-4 w-4" />
                Complete Setup
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Generate CTA */}
      {isFullyConfigured && (
        <>
          <Link href="/episodes/new">
            <Card className="cursor-pointer transition-colors hover:border-primary">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Generate & Publish Episode</p>
                  <p className="text-sm text-muted-foreground">
                    Enter a topic and publish to your podcast feed in one click
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* RSS Feed URL */}
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="rounded-lg bg-blue-100 p-3">
                <Rss className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Your RSS Feed URL</p>
                <p className="truncate text-xs text-muted-foreground">
                  {feedUrl}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit this URL to Apple Podcasts & Spotify for Podcasters
                  (one-time setup)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyFeed}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={ok ? "text-green-600" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}
