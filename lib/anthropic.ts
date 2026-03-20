import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn("ANTHROPIC_API_KEY not set — AI features will not work");
}

export const anthropic = new Anthropic({ apiKey: apiKey ?? "" });
