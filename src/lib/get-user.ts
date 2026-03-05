import prisma from "./prisma";

export async function getDefaultUser() {
  try {
    let user = await prisma.user.findFirst({
      include: { settings: true },
    });

    // Auto-create default user if none exists (first run / fresh deploy)
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "default@podcast.local",
          name: "Default User",
          settings: { create: {} },
        },
        include: { settings: true },
      });
    }

    return user;
  } catch (error) {
    console.error('Database connection error:', error);
    // Return a mock user structure if database is not available
    return {
      id: 'mock-user',
      email: "default@podcast.local",
      name: "Default User",
      settings: {
        aiProvider: "openai",
        aiModel: "gpt-4o",
        podcastName: "My Podcast",
        podcastDescription: "An automated podcast",
        podcastAuthor: "Podcast Creator",
        podcastCategory: "Technology",
        podcastLanguage: "en-us",
        podcastExplicit: false,
        targetScriptLength: 1500,
        elevenlabsModelId: "eleven_multilingual_v2",
        elevenlabsStability: 0.5,
        elevenlabsSimilarity: 0.75,
      }
    };
  }
}
