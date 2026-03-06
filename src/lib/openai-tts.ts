export interface OpenAITTSConfig {
  apiKey: string;
  modelId: string;
  voice: string;
}

export async function generateOpenAIAudio(
  text: string,
  config: OpenAITTSConfig
): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.modelId,
      voice: config.voice,
      input: text,
      format: "mp3",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI TTS error: ${res.status} - ${err}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
