import { NextResponse } from "next/server";
import { testConnection as testCloudinary } from "@/lib/cloudinary-storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { service } = body;
    const results: Record<string, { ok: boolean; message: string }> = {};

    if (service === "ai" || service === "all") {
      try {
        if (body.aiProvider === "openai" && body.openaiApiKey) {
          const res = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${body.openaiApiKey}` },
          });
          results.ai = res.ok
            ? { ok: true, message: "OpenAI connected" }
            : { ok: false, message: `OpenAI error: ${res.status}` };
        } else if (body.aiProvider === "anthropic" && body.anthropicApiKey) {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": body.anthropicApiKey,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: body.aiModel || "claude-sonnet-4-20250514",
              max_tokens: 10,
              messages: [{ role: "user", content: "Hi" }],
            }),
          });
          results.ai = res.ok
            ? { ok: true, message: "Anthropic connected" }
            : { ok: false, message: `Anthropic error: ${res.status}` };
        } else {
          results.ai = { ok: false, message: "No AI API key provided" };
        }
      } catch (e) {
        results.ai = { ok: false, message: String(e) };
      }
    }

    if (service === "elevenlabs" || service === "all") {
      try {
        if (body.elevenlabsApiKey) {
          const res = await fetch("https://api.elevenlabs.io/v1/voices", {
            headers: { "xi-api-key": body.elevenlabsApiKey },
          });
          results.elevenlabs = res.ok
            ? { ok: true, message: "ElevenLabs connected" }
            : { ok: false, message: `ElevenLabs error: ${res.status}` };
        } else {
          results.elevenlabs = {
            ok: false,
            message: "No ElevenLabs API key provided",
          };
        }
      } catch (e) {
        results.elevenlabs = { ok: false, message: String(e) };
      }
    }

    if (service === "cloudinary" || service === "all") {
      if (body.cloudinaryCloudName && body.cloudinaryApiKey && body.cloudinaryApiSecret) {
        results.cloudinary = await testCloudinary({
          cloudName: body.cloudinaryCloudName,
          apiKey: body.cloudinaryApiKey,
          apiSecret: body.cloudinaryApiSecret,
        });
      } else {
        results.cloudinary = {
          ok: false,
          message: "Cloudinary credentials not provided",
        };
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
