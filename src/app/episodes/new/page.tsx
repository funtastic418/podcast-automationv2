"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import {
  Loader2,
  Sparkles,
  CheckCircle,
  XCircle,
  FileAudio,
  Upload,
  FileText,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface StepStatus {
  step: string;
  status: string;
  [key: string]: unknown;
}

const STEP_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  generating_script: {
    label: "Generating script with AI",
    icon: <FileText className="h-4 w-4" />,
  },
  generating_audio: {
    label: "Converting script to audio",
    icon: <FileAudio className="h-4 w-4" />,
  },
  uploading: {
    label: "Uploading audio to Cloudinary",
    icon: <Upload className="h-4 w-4" />,
  },
  saving_metadata: {
    label: "Saving episode metadata",
    icon: <Upload className="h-4 w-4" />,
  },
  done: {
    label: "Episode published!",
    icon: <CheckCircle className="h-4 w-4" />,
  },
};

export default function GeneratePage() {
  const { toast } = useToast();
  const { settings, isFullyConfigured, loaded } = useSettings();
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [steps, setSteps] = useState<StepStatus[]>([]);
  const [result, setResult] = useState<StepStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      const aiKey =
        settings.aiProvider === "openai"
          ? settings.openaiApiKey
          : settings.anthropicApiKey;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          ai: {
            provider: settings.aiProvider,
            apiKey: aiKey,
            model: settings.aiModel,
            systemPrompt: settings.defaultPromptTemplate || undefined,
            targetLength: settings.targetScriptLength,
          },
          voice: {
            provider: settings.voiceProvider,
            elevenlabsApiKey: settings.elevenlabsApiKey,
            elevenlabsVoiceId: settings.elevenlabsVoiceId,
            elevenlabsModelId: settings.elevenlabsModelId,
            elevenlabsStability: settings.elevenlabsStability,
            elevenlabsSimilarity: settings.elevenlabsSimilarity,
            openaiTtsModelId: settings.openaiTtsModelId,
            openaiVoice: settings.openaiVoice,
          },
          cloudinary: {
            cloudName: settings.cloudinaryCloudName,
            apiKey: settings.cloudinaryApiKey,
            apiSecret: settings.cloudinaryApiSecret,
          },
          podcast: {
            name: settings.podcastName,
          },
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg: StepStatus = JSON.parse(line);
            if (msg.step === "error") {
              setError(msg.error as string);
            } else if (msg.step === "done") {
              setResult(msg);
            } else {
              setSteps((prev) => {
                const existing = prev.findIndex((s) => s.step === msg.step);
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = msg;
                  return updated;
                }
                return [...prev, msg];
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }

    setGenerating(false);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isFullyConfigured) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Generate Episode</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <AlertTriangle className="h-10 w-10 text-yellow-500" />
            <p className="text-center text-muted-foreground">
              Please configure all your API keys and podcast info in Settings
              before generating episodes.
            </p>
            <Link href="/settings">
              <Button>Go to Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Generate & Publish Episode</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            New Episode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Episode Topic</Label>
            <Textarea
              rows={4}
              placeholder={
                "Enter your episode topic or idea.\n\nExamples:\n- The future of AI in healthcare\n- 5 tips for better sleep\n- Why remote work is here to stay"
              }
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={generating}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate & Publish
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((s) => {
              const info = STEP_LABELS[s.step] || {
                label: s.step,
                icon: null,
              };
              return (
                <div key={s.step} className="flex items-center gap-3">
                  {s.status === "completed" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : s.status === "started" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    info.icon
                  )}
                  <span
                    className={
                      s.status === "completed"
                        ? "text-green-600"
                        : s.status === "started"
                          ? "text-blue-600 font-medium"
                          : ""
                    }
                  >
                    {info.label}
                  </span>
                  {typeof s.title === "string" && (
                    <span className="text-sm text-muted-foreground">
                      — {s.title}
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="flex items-center gap-3 py-4">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {result && (
        <Card className="border-green-200">
          <CardContent className="space-y-3 py-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Episode Published!</span>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Title:</strong>{" "}
                {(result.episode as { title: string })?.title}
              </p>
              <p>
                <strong>Audio:</strong>{" "}
                <a
                  href={(result.episode as { audioUrl: string })?.audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Listen
                </a>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your RSS feed has been updated. Apple Podcasts and Spotify will
              pick up the new episode automatically (may take a few hours).
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setTopic("");
                setSteps([]);
                setResult(null);
                setError(null);
              }}
            >
              Generate Another Episode
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
