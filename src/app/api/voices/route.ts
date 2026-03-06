import { NextResponse } from "next/server";
import { listVoices } from "@/lib/elevenlabs-client";

export async function POST(request: Request) {
  try {
    const { elevenlabsApiKey } = await request.json();

    if (!elevenlabsApiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key is required" },
        { status: 400 }
      );
    }

    const voices = await listVoices(elevenlabsApiKey);
    return NextResponse.json(voices);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
