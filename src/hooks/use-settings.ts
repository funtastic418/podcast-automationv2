"use client";

import { useState, useEffect } from "react";

export interface AppSettings {
  // AI
  aiProvider: "openai" | "anthropic";
  openaiApiKey: string;
  anthropicApiKey: string;
  aiModel: string;
  defaultPromptTemplate: string;
  targetScriptLength: number;
  // Voice
  voiceProvider: "elevenlabs" | "openai_tts";
  elevenlabsApiKey: string;
  elevenlabsVoiceId: string;
  elevenlabsModelId: string;
  elevenlabsStability: number;
  elevenlabsSimilarity: number;
  openaiTtsModelId: string;
  openaiVoice: string;
  // Cloudinary
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  // Podcast info (for RSS feed)
  podcastName: string;
  podcastDescription: string;
  podcastAuthor: string;
  podcastCoverUrl: string;
  podcastCategory: string;
  podcastLanguage: string;
  podcastExplicit: boolean;
  podcastOwnerEmail: string;
  podcastWebsiteUrl: string;
}

const STORAGE_KEY = "podcast-automation-settings";

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: "openai",
  openaiApiKey: "",
  anthropicApiKey: "",
  aiModel: "gpt-4o",
  defaultPromptTemplate: "",
  targetScriptLength: 1500,
  voiceProvider: "elevenlabs",
  elevenlabsApiKey: "",
  elevenlabsVoiceId: "",
  elevenlabsModelId: "eleven_multilingual_v2",
  elevenlabsStability: 0.5,
  elevenlabsSimilarity: 0.75,
  openaiTtsModelId: "gpt-4o-mini-tts",
  openaiVoice: "alloy",
  cloudinaryCloudName: "",
  cloudinaryApiKey: "",
  cloudinaryApiSecret: "",
  podcastName: "",
  podcastDescription: "",
  podcastAuthor: "",
  podcastCoverUrl: "",
  podcastCategory: "Technology",
  podcastLanguage: "en-us",
  podcastExplicit: false,
  podcastOwnerEmail: "",
  podcastWebsiteUrl: "",
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch { }
    setLoaded(true);
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  const aiKey =
    settings.aiProvider === "openai"
      ? settings.openaiApiKey
      : settings.anthropicApiKey;

  const isAiConfigured = !!aiKey && !!settings.aiModel;

  const isVoiceConfigured =
    settings.voiceProvider === "openai_tts"
      ? !!settings.openaiApiKey
      : !!settings.elevenlabsApiKey && !!settings.elevenlabsVoiceId;

  const isCloudinaryConfigured =
    !!settings.cloudinaryCloudName &&
    !!settings.cloudinaryApiKey &&
    !!settings.cloudinaryApiSecret;

  const isPodcastConfigured = !!settings.podcastName;

  const isFullyConfigured =
    isAiConfigured &&
    isVoiceConfigured &&
    isCloudinaryConfigured &&
    isPodcastConfigured;

  return {
    settings,
    updateSettings,
    loaded,
    isAiConfigured,
    isVoiceConfigured,
    isCloudinaryConfigured,
    isPodcastConfigured,
    isFullyConfigured,
  };
}
