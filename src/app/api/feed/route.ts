import { NextResponse } from "next/server";
import { getEpisodes } from "@/lib/cloudinary-storage";

export const dynamic = "force-dynamic";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl = url.origin;
    const cloudName = url.searchParams.get("cn");
    const apiKey = url.searchParams.get("ak");
    const apiSecret = url.searchParams.get("as");

    const podcastName = url.searchParams.get("name") || "My Podcast";
    const podcastDescription =
      url.searchParams.get("desc") || "An AI-generated podcast";
    const podcastAuthor = url.searchParams.get("author") || "Podcast Author";
    const podcastCoverUrl = url.searchParams.get("cover") || "";
    const podcastCategory = url.searchParams.get("cat") || "Technology";
    const podcastLanguage = url.searchParams.get("lang") || "en-us";
    const podcastExplicit = url.searchParams.get("explicit") === "true";

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            "Cloudinary credentials required as query params: cn, ak, as",
        },
        { status: 400 }
      );
    }

    const episodes = await getEpisodes({ cloudName, apiKey, apiSecret });

    const feedUrl = request.url;
    const imageTag = podcastCoverUrl
      ? `<itunes:image href="${escapeXml(podcastCoverUrl)}" />`
      : "";

    const items = episodes
      .map(
        (ep) => `    <item>
      <title>${escapeXml(ep.title)}</title>
      <description><![CDATA[${ep.description}]]></description>
      <enclosure url="${escapeXml(ep.audioUrl)}" length="${ep.fileSize}" type="audio/mpeg" />
      <pubDate>${ep.pubDate}</pubDate>
      <itunes:duration>${ep.duration}</itunes:duration>
      <itunes:episodeType>full</itunes:episodeType>
      <guid isPermaLink="false">${ep.id}</guid>
    </item>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.apple.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(podcastName)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(podcastDescription)}</description>
    <language>${podcastLanguage}</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <itunes:author>${escapeXml(podcastAuthor)}</itunes:author>
    <itunes:summary>${escapeXml(podcastDescription)}</itunes:summary>
    <itunes:category text="${escapeXml(podcastCategory)}" />
    <itunes:explicit>${podcastExplicit ? "yes" : "no"}</itunes:explicit>
    ${imageTag}
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Error generating feed: ${message}`, { status: 500 });
  }
}
