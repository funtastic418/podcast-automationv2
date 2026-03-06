"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, updateSettings, loaded } = useSettings();
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; message: string }>
  >({});
  const [voices, setVoices] = useState<{ voice_id: string; name: string }[]>(
    []
  );

  const update = (field: string, value: unknown) => {
    updateSettings({ [field]: value });
  };

  const testConnection = async (service: string) => {
    setTesting(service);
    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, ...settings }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, ...data }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [service]: { ok: false, message: "Connection failed" },
      }));
    }
    setTesting(null);
  };

  const loadVoices = async () => {
    try {
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elevenlabsApiKey: settings.elevenlabsApiKey,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data)) setVoices(data);
    } catch {
      toast({ title: "Failed to load voices", variant: "destructive" });
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Badge variant="outline" className="text-xs">
          Saved to your browser automatically
        </Badge>
      </div>

      <Tabs defaultValue="ai">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai">AI Provider</TabsTrigger>
          <TabsTrigger value="elevenlabs">ElevenLabs</TabsTrigger>
          <TabsTrigger value="openai-voice">OpenAI Voice</TabsTrigger>
          <TabsTrigger value="podcast">Podcast Info</TabsTrigger>
          <TabsTrigger value="cloudinary">Cloudinary</TabsTrigger>
        </TabsList>

        {/* AI Provider Tab */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                AI Script Generation
                <div className="flex items-center gap-2">
                  {testResults.ai &&
                    (testResults.ai.ok ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        <XCircle className="mr-1 h-3 w-3" />{" "}
                        {testResults.ai.message}
                      </Badge>
                    ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnection("ai")}
                    disabled={testing === "ai"}
                  >
                    {testing === "ai" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.aiProvider}
                  onChange={(e) => update("aiProvider", e.target.value)}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>

              {settings.aiProvider === "openai" ? (
                <div className="space-y-2">
                  <Label>
                    OpenAI API Key
                    {settings.openaiApiKey && (
                      <Badge variant="secondary" className="ml-2">
                        Set
                      </Badge>
                    )}
                  </Label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={settings.openaiApiKey}
                    onChange={(e) => update("openaiApiKey", e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>
                    Anthropic API Key
                    {settings.anthropicApiKey && (
                      <Badge variant="secondary" className="ml-2">
                        Set
                      </Badge>
                    )}
                  </Label>
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    value={settings.anthropicApiKey}
                    onChange={(e) => update("anthropicApiKey", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={settings.aiModel}
                  onChange={(e) => update("aiModel", e.target.value)}
                  placeholder={
                    settings.aiProvider === "openai"
                      ? "gpt-4o"
                      : "claude-sonnet-4-20250514"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Script Prompt (optional)</Label>
                <Textarea
                  rows={4}
                  value={settings.defaultPromptTemplate}
                  onChange={(e) =>
                    update("defaultPromptTemplate", e.target.value)
                  }
                  placeholder="You are a podcast script writer for a technology news podcast..."
                />
              </div>

              <div className="space-y-2">
                <Label>Target Script Length (words)</Label>
                <Input
                  type="number"
                  value={settings.targetScriptLength}
                  onChange={(e) =>
                    update(
                      "targetScriptLength",
                      parseInt(e.target.value) || 1500
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ElevenLabs Tab */}
        <TabsContent value="elevenlabs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ElevenLabs Voice
                <div className="flex items-center gap-2">
                  {testResults.elevenlabs &&
                    (testResults.elevenlabs.ok ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        <XCircle className="mr-1 h-3 w-3" /> Error
                      </Badge>
                    ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnection("elevenlabs")}
                    disabled={testing === "elevenlabs"}
                  >
                    {testing === "elevenlabs" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  ElevenLabs API Key
                  {settings.elevenlabsApiKey && (
                    <Badge variant="secondary" className="ml-2">
                      Set
                    </Badge>
                  )}
                </Label>
                <Input
                  type="password"
                  placeholder="Your ElevenLabs API key"
                  value={settings.elevenlabsApiKey}
                  onChange={(e) => update("elevenlabsApiKey", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Voice</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.elevenlabsVoiceId}
                    onChange={(e) =>
                      update("elevenlabsVoiceId", e.target.value)
                    }
                    placeholder="Voice ID or click Load Voices"
                  />
                  <Button variant="outline" onClick={loadVoices}>
                    Load Voices
                  </Button>
                </div>
                {voices.length > 0 && (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings.elevenlabsVoiceId}
                    onChange={(e) =>
                      update("elevenlabsVoiceId", e.target.value)
                    }
                  >
                    <option value="">Select a voice...</option>
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.elevenlabsModelId}
                  onChange={(e) => update("elevenlabsModelId", e.target.value)}
                >
                  <option value="eleven_multilingual_v2">
                    Multilingual v2
                  </option>
                  <option value="eleven_monolingual_v1">Monolingual v1</option>
                  <option value="eleven_turbo_v2_5">Turbo v2.5</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stability: {settings.elevenlabsStability}</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    className="w-full"
                    value={settings.elevenlabsStability}
                    onChange={(e) =>
                      update("elevenlabsStability", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Similarity: {settings.elevenlabsSimilarity}</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    className="w-full"
                    value={settings.elevenlabsSimilarity}
                    onChange={(e) =>
                      update(
                        "elevenlabsSimilarity",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OpenAI Voice Tab */}
        <TabsContent value="openai-voice">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI Voice (Alternative to ElevenLabs)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Provider</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.voiceProvider}
                  onChange={(e) => update("voiceProvider", e.target.value)}
                >
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="openai_tts">OpenAI TTS</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>TTS Model</Label>
                <Input
                  value={settings.openaiTtsModelId}
                  onChange={(e) => update("openaiTtsModelId", e.target.value)}
                  placeholder="gpt-4o-mini-tts"
                />
              </div>
              <div className="space-y-2">
                <Label>Voice Name</Label>
                <Input
                  value={settings.openaiVoice}
                  onChange={(e) => update("openaiVoice", e.target.value)}
                  placeholder="alloy"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Uses your OpenAI API key from the AI Provider tab. Available
                voices: alloy, echo, fable, onyx, nova, shimmer.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Podcast Info Tab */}
        <TabsContent value="podcast">
          <Card>
            <CardHeader>
              <CardTitle>Podcast Info (for RSS Feed)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Podcast Name *</Label>
                <Input
                  value={settings.podcastName}
                  onChange={(e) => update("podcastName", e.target.value)}
                  placeholder="My AI Podcast"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={settings.podcastDescription}
                  onChange={(e) =>
                    update("podcastDescription", e.target.value)
                  }
                  placeholder="A weekly podcast about..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input
                    value={settings.podcastAuthor}
                    onChange={(e) => update("podcastAuthor", e.target.value)}
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings.podcastCategory}
                    onChange={(e) => update("podcastCategory", e.target.value)}
                  >
                    <option>Technology</option>
                    <option>Business</option>
                    <option>Education</option>
                    <option>News</option>
                    <option>Entertainment</option>
                    <option>Health &amp; Fitness</option>
                    <option>Science</option>
                    <option>Society &amp; Culture</option>
                    <option>Comedy</option>
                    <option>Arts</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cover Image URL (3000x3000px recommended)</Label>
                <Input
                  value={settings.podcastCoverUrl}
                  onChange={(e) => update("podcastCoverUrl", e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Input
                    value={settings.podcastLanguage}
                    onChange={(e) => update("podcastLanguage", e.target.value)}
                    placeholder="en-us"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="explicit"
                    checked={settings.podcastExplicit}
                    onChange={(e) =>
                      update("podcastExplicit", e.target.checked)
                    }
                  />
                  <Label htmlFor="explicit">Explicit Content</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cloudinary Tab */}
        <TabsContent value="cloudinary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Cloudinary (Free Audio Storage)
                <div className="flex items-center gap-2">
                  {testResults.cloudinary &&
                    (testResults.cloudinary.ok ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        <XCircle className="mr-1 h-3 w-3" /> Error
                      </Badge>
                    ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnection("cloudinary")}
                    disabled={testing === "cloudinary"}
                  >
                    {testing === "cloudinary" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign up free at cloudinary.com. Find your credentials in the
                Dashboard under &quot;Programmable Media&quot;.
              </p>
              <div className="space-y-2">
                <Label>Cloud Name</Label>
                <Input
                  value={settings.cloudinaryCloudName}
                  onChange={(e) =>
                    update("cloudinaryCloudName", e.target.value)
                  }
                  placeholder="your-cloud-name"
                />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={settings.cloudinaryApiKey}
                  onChange={(e) => update("cloudinaryApiKey", e.target.value)}
                  placeholder="your-api-key"
                />
              </div>
              <div className="space-y-2">
                <Label>API Secret</Label>
                <Input
                  type="password"
                  value={settings.cloudinaryApiSecret}
                  onChange={(e) =>
                    update("cloudinaryApiSecret", e.target.value)
                  }
                  placeholder="your-api-secret"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
