import OpenAI from "openai";
import { Thread } from "openai/resources/beta/threads/threads";

interface SystemMessage {
  role: string;
  content: string;
}

export async function createThread(
  client: OpenAI,
  message: string,
  existingThreadId?: string,
  systemMessage?: SystemMessage | null
): Promise<Thread> {
  let thread: Thread;

  if (existingThreadId) {
    // Retrieve an existing thread
    thread = await client.beta.threads.retrieve(existingThreadId);

    // For existing threads, we need to add system guidance differently
    // System message will be added as a special user message
    if (systemMessage) {
      console.log(
        "Adding system guidance to existing thread:",
        systemMessage.content.substring(0, 100) + "..."
      );

      try {
        // Add system instructions to the existing thread as a user message with special prefix
        await client.beta.threads.messages.create(thread.id, {
          role: "user",
          content: `[SYSTEM GUIDANCE: ${systemMessage.content}]`,
        });
      } catch (error) {
        console.log("Error adding system guidance:", error);
      }
    }

    // Add the user message
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });
  } else {
    // Create a new thread
    console.log("Creating new thread");
    thread = await client.beta.threads.create();

    // If we have a system message, add it first for personalization
    // But we need to do it as a user message with special prefix
    if (systemMessage) {
      console.log(
        "Adding system guidance to new thread:",
        systemMessage.content.substring(0, 100) + "..."
      );

      await client.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `[SYSTEM GUIDANCE: ${systemMessage.content}]`,
      });
    } else {
      console.log("No system message/personalization provided for this thread");
    }

    // Then add the user message
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // Save the new thread to local storage
    const threads = JSON.parse(localStorage.getItem("threads") || "[]");
    threads.push({ id: thread.id, created_at: thread.created_at });
    localStorage.setItem("threads", JSON.stringify(threads));

    console.log("Thread created successfully with ID:", thread.id);
  }

  return thread;
}
