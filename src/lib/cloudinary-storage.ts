import { v2 as cloudinary } from "cloudinary";

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface EpisodeMeta {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  pubDate: string;
  duration: string;
  fileSize: number;
}

function configure(config: CloudinaryConfig) {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
}

export async function uploadAudio(
  audioBuffer: Buffer,
  episodeId: string,
  config: CloudinaryConfig
): Promise<{ url: string; bytes: number }> {
  configure(config);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        public_id: `podcast/${episodeId}`,
        overwrite: true,
        format: "mp3",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          url: result.secure_url || result.url,
          bytes: result.bytes || audioBuffer.length,
        });
      }
    );
    stream.end(audioBuffer);
  });
}

export async function getEpisodes(
  config: CloudinaryConfig
): Promise<EpisodeMeta[]> {
  configure(config);

  try {
    // Try to download the episodes.json metadata file
    const url = cloudinary.url("podcast/episodes", {
      resource_type: "raw",
      secure: true,
    });
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveEpisodes(
  episodes: EpisodeMeta[],
  config: CloudinaryConfig
): Promise<void> {
  configure(config);

  const json = JSON.stringify(episodes, null, 2);
  const buffer = Buffer.from(json, "utf-8");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: "podcast/episodes",
        overwrite: true,
        format: "json",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Failed to save episodes metadata"));
          return;
        }
        resolve();
      }
    );
    stream.end(buffer);
  });
}

// Public read — no credentials needed, just the cloud name
export async function getEpisodesPublic(
  cloudName: string
): Promise<EpisodeMeta[]> {
  try {
    const url = `https://res.cloudinary.com/${cloudName}/raw/upload/podcast/episodes.json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function testConnection(
  config: CloudinaryConfig
): Promise<{ ok: boolean; message: string }> {
  try {
    configure(config);
    await cloudinary.api.ping();
    return { ok: true, message: "Cloudinary connected" };
  } catch (e) {
    return { ok: false, message: `Cloudinary error: ${e}` };
  }
}
