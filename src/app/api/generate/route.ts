import { generateScript } from "@/lib/ai-client";
import { generateAudio, estimateDuration } from "@/lib/elevenlabs-client";
import { generateOpenAIAudio } from "@/lib/openai-tts";
import { formatDuration } from "@/lib/slug";
import {
  uploadAudio,
  getEpisodes,
  saveEpisodes,
} from "@/lib/cloudinary-storage";

export const maxDuration = 300;

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = async (
    step: string,
    status: string,
    data?: Record<string, unknown>
  ) => {
    const msg = JSON.stringify({ step, status, ...data }) + "\n";
    await writer.write(encoder.encode(msg));
  };

  const run = async () => {
    try {
      const body = await request.json();
      const { topic, ai, voice, cloudinary: cld, podcast } = body;

      if (!topic) {
        await send("error", "failed", { error: "Topic is required" });
        return;
      }
      if (!ai?.apiKey) {
        await send("error", "failed", { error: "AI API key is required" });
        return;
      }
      if (!cld?.cloudName || !cld?.apiKey || !cld?.apiSecret) {
        await send("error", "failed", {
          error: "Cloudinary credentials are required",
        });
        return;
      }

      // Step 1: Generate script
      await send("generating_script", "started");
      const scriptResult = await generateScript(topic, {
        provider: ai.provider || "openai",
        apiKey: ai.apiKey,
        model: ai.model || "gpt-4o",
        systemPrompt: ai.systemPrompt || undefined,
        targetLength: ai.targetLength || 1500,
      });
      await send("generating_script", "completed", {
        title: scriptResult.title,
        summary: scriptResult.summary,
      });

      // Step 2: Generate audio
      await send("generating_audio", "started");
      let audioBuffer: Buffer;

      if (voice?.provider === "openai_tts") {
        audioBuffer = await generateOpenAIAudio(scriptResult.script, {
          apiKey: ai.apiKey,
          modelId: voice.openaiTtsModelId || "gpt-4o-mini-tts",
          voice: voice.openaiVoice || "alloy",
        });
      } else {
        if (!voice?.elevenlabsApiKey || !voice?.elevenlabsVoiceId) {
          await send("error", "failed", {
            error: "ElevenLabs API key and Voice ID are required",
          });
          return;
        }
        const result = await generateAudio(scriptResult.script, {
          apiKey: voice.elevenlabsApiKey,
          voiceId: voice.elevenlabsVoiceId,
          modelId: voice.elevenlabsModelId || "eleven_multilingual_v2",
          stability: voice.elevenlabsStability ?? 0.5,
          similarityBoost: voice.elevenlabsSimilarity ?? 0.75,
        });
        audioBuffer = result.audioBuffer;
      }

      const durationSeconds = estimateDuration(audioBuffer);
      await send("generating_audio", "completed", {
        durationSeconds,
        fileSizeMB: +(audioBuffer.length / 1024 / 1024).toFixed(1),
      });

      // Step 3: Upload to Cloudinary
      await send("uploading", "started");
      const episodeId = `ep-${Date.now()}`;
      const cldConfig = {
        cloudName: cld.cloudName,
        apiKey: cld.apiKey,
        apiSecret: cld.apiSecret,
      };

      const uploaded = await uploadAudio(audioBuffer, episodeId, cldConfig);
      await send("uploading", "completed", { audioUrl: uploaded.url });

      // Step 4: Save episode metadata to Cloudinary
      await send("saving_metadata", "started");
      const episodes = await getEpisodes(cldConfig);
      const newEpisode = {
        id: episodeId,
        title: scriptResult.title || topic,
        description: scriptResult.summary || topic,
        audioUrl: uploaded.url,
        pubDate: new Date().toUTCString(),
        duration: formatDuration(durationSeconds),
        fileSize: uploaded.bytes,
      };
      episodes.unshift(newEpisode);
      await saveEpisodes(episodes, cldConfig);
      await send("saving_metadata", "completed");

      // Done
      await send("done", "completed", {
        episode: newEpisode,
        rssFeedPath: "/api/feed",
        podcastName: podcast?.name || "My Podcast",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      await send("error", "failed", { error: message });
    } finally {
      await writer.close();
    }
  };

  run();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
