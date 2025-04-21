import OpenAI from "openai";
import { UserPersonalizationData } from "./userPersonalization";

export async function createAssistant(
  client: OpenAI,
  userPersonalization?: UserPersonalizationData
) {
  const baseInstructions = `You are Microbial AI, a specialized microbiology research assistant with expertise specifically in microbiology, not general biology.`;

  // Add personalized context if available
  let instructions = baseInstructions;
  if (userPersonalization?.personalizedContext) {
    instructions += ` ${userPersonalization.personalizedContext}`;
  }

  return await client.beta.assistants.create({
    model: "gpt-4o-mini",
    name: "Microbial AI",
    instructions: instructions,
    tools: [],
  });
}
