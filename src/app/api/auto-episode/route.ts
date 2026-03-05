import { NextRequest, NextResponse } from 'next/server';
import { getEpisodes, saveEpisodes, Episode } from '@/lib/simple-storage';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

async function uploadToCloudinary(
  audioBuffer: Buffer,
  episodeId: string,
  config: CloudinaryConfig
): Promise<{ url: string; bytes: number }> {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        public_id: episodeId,
        overwrite: true,
        format: 'mp3',
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ url: result.secure_url || result.url, bytes: result.bytes || audioBuffer.length });
      }
    );
    stream.end(audioBuffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const { topic, script, audioData, cloudinaryConfig } = await request.json();
    
    // Generate unique ID
    const episodeId = `episode-${Date.now()}`;
    
    const audioBuffer = Buffer.from(audioData, 'base64');
    const audioFilename = `${episodeId}.mp3`;
    const audioDir = join(process.cwd(), 'public', 'audio');
    const audioPath = join(audioDir, audioFilename);
    
    // Ensure audio directory exists
    try {
      await writeFile(join(audioDir, '.gitkeep'), '');
    } catch {}
    
    let audioUrl = `/audio/${audioFilename}`;
    let fileSize = audioBuffer.length;

    if (
      cloudinaryConfig &&
      cloudinaryConfig.cloudName &&
      cloudinaryConfig.apiKey &&
      cloudinaryConfig.apiSecret
    ) {
      const uploaded = await uploadToCloudinary(audioBuffer, episodeId, cloudinaryConfig);
      audioUrl = uploaded.url;
      fileSize = uploaded.bytes;
    } else {
      await writeFile(audioPath, audioBuffer);
    }
    
    // Create new episode
    const newEpisode: Episode = {
      id: episodeId,
      title: topic,
      description: script,
      audioUrl,
      pubDate: new Date().toUTCString(),
      duration: "00:10:00", // You can calculate this from audio
      fileSize
    };
    
    // Get existing episodes and add new one
    const episodes = await getEpisodes();
    episodes.unshift(newEpisode); // Add to beginning
    await saveEpisodes(episodes);
    
    // Trigger RSS feed update (happens automatically when feed is requested)
    
    return NextResponse.json({ 
      success: true,
      episode: newEpisode,
      rssFeedUrl: `${new URL(request.url).origin}/api/feed`,
      message: "Episode added and RSS feed updated! Apple Podcasts will pick this up within 24 hours."
    });
    
  } catch (error) {
    console.error('Auto episode error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to create episode',
      details: errorMessage 
    }, { status: 500 });
  }
}
