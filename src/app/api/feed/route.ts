import { NextResponse } from "next/server";
import { getEpisodesPublic } from "@/lib/cloudinary-storage";

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

    const podcastName = url.searchParams.get("name") || "My Podcast";
    const podcastDescription =
      url.searchParams.get("desc") || "An AI-generated podcast";
    const podcastAuthor = url.searchParams.get("author") || "Podcast Author";
    let podcastCoverUrl = url.searchParams.get("cover") || "";

    // Auto-fix Cloudinary URLs for Apple Podcasts (3000x3000, JPG, Optimized)
    if (podcastCoverUrl.includes("res.cloudinary.com") && podcastCoverUrl.includes("/upload/") && !podcastCoverUrl.includes("/upload/c_")) {
      podcastCoverUrl = podcastCoverUrl.replace("/upload/", "/upload/c_fill,w_3000,h_3000,q_auto,f_jpg/");
    }

    const podcastCategory = url.searchParams.get("cat") || "Technology";
    const podcastLanguage = url.searchParams.get("lang") || "en-us";
    const podcastExplicit = url.searchParams.get("explicit") === "true";
    const podcastOwnerEmail = url.searchParams.get("email") || "";
    const podcastWebsiteUrl = url.searchParams.get("website") || baseUrl;

    if (!cloudName) {
      return NextResponse.json(
        { error: "Cloudinary cloud name required as query param: cn" },
        { status: 400 }
      );
    }

    const episodes = await getEpisodesPublic(cloudName);

    const feedUrl = request.url;
    const imageTag = podcastCoverUrl
      ? `<itunes:image href="${escapeXml(podcastCoverUrl)}" />
    <image>
      <url>${escapeXml(podcastCoverUrl)}</url>
      <title>${escapeXml(podcastName)}</title>
      <link>${escapeXml(podcastWebsiteUrl)}</link>
    </image>`
      : "";

    const ownerTag = podcastOwnerEmail
      ? `\n    <itunes:owner>
      <itunes:name>${escapeXml(podcastAuthor)}</itunes:name>
      <itunes:email>${escapeXml(podcastOwnerEmail)}</itunes:email>
    </itunes:owner>`
      : "";

    const items = episodes
      .map(
        (ep) => `    <item>
      <title>${escapeXml(ep.title)}</title>
      <description><![CDATA[${ep.description}]]></description>
      <enclosure url="${escapeXml(ep.audioUrl)}" length="${ep.fileSize}" type="audio/mpeg" />
      <pubDate>${ep.pubDate}</pubDate>
      <author>${escapeXml(podcastAuthor)}</author>
      <itunes:author>${escapeXml(podcastAuthor)}</itunes:author>
      <itunes:duration>${ep.duration}</itunes:duration>
      <itunes:episodeType>full</itunes:episodeType>
      <guid isPermaLink="false">${ep.id}</guid>
    </item>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(podcastName)}</title>
    <link>${escapeXml(podcastWebsiteUrl)}</link>
    <description>${escapeXml(podcastDescription)}</description>
    <language>${podcastLanguage}</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <author>${escapeXml(podcastAuthor)}</author>
    <itunes:author>${escapeXml(podcastAuthor)}</itunes:author>
    <itunes:summary>${escapeXml(podcastDescription)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:category text="${escapeXml(podcastCategory)}" />
    <itunes:explicit>${podcastExplicit ? "yes" : "no"}</itunes:explicit>
    <pubDate>${episodes.length > 0 ? episodes[0].pubDate : new Date().toUTCString()}</pubDate>${ownerTag}
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
