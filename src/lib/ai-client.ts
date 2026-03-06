interface ScriptResult {
  title: string;
  summary: string;
  script: string;
}

interface AIConfig {
  provider: "openai" | "anthropic";
  apiKey: string;
  model: string;
  systemPrompt?: string;
  targetLength: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are a podcast script writer. Write engaging, conversational scripts that:
- Are natural and easy to read aloud
- Include an intro greeting, main content, and outro
- Use natural speech patterns with occasional pauses noted as "..."
- Avoid complex jargon unless explaining it
- Include occasional rhetorical questions to engage listeners

Respond in JSON format with these fields:
- "title": A catchy episode title (max 100 chars)
- "summary": A brief episode description (1-2 sentences)
- "script": The full podcast script text`;

export async function generateScript(
  topic: string,
  config: AIConfig
): Promise<ScriptResult> {
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const userPrompt = `Write a podcast script about: ${topic}\n\nTarget length: approximately ${config.targetLength} words.`;

  if (config.provider === "openai") {
    return generateWithOpenAI(systemPrompt, userPrompt, config);
  } else {
    return generateWithAnthropic(systemPrompt, userPrompt, config);
  }
}

async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  config: AIConfig
): Promise<ScriptResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content) as ScriptResult;
}

async function generateWithAnthropic(
  systemPrompt: string,
  userPrompt: string,
  config: AIConfig
): Promise<ScriptResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system: systemPrompt + "\n\nYou MUST respond with valid JSON only.",
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Extract JSON from response (Anthropic may wrap in markdown)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");

  return JSON.parse(jsonMatch[0]) as ScriptResult;
}
