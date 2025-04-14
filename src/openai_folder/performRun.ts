import OpenAI from "openai"
import { Thread } from "openai/resources/beta/threads/threads"
import { Run } from "openai/resources/beta/threads/runs/runs"
import { handleRunToolCall } from "./handleRunToolCall"

export async function performRun(client: OpenAI, thread: Thread, run: Run) {
	while (run.status === "requires_action") {
		run = await handleRunToolCall(client, thread, run)
	}

	if (run.status === "failed") {
		const erroMessage = `I encountered an error: ${run.last_error?.message || "Unknown error"}`
		console.error("Run failed:", run.last_error)
		await client.beta.threads.messages.create(thread.id, {
			role: "assistant",
			content: erroMessage,
		})
		return {
			type: "text",
			text: {
				value: erroMessage,
				annotations: [],
			},
		}
	}

	const messages = await client.beta.threads.messages.list(thread.id)
	const assistantMessages = messages.data.find((message) => message.role === "assistant")

	return (
		assistantMessages?.content[0] || {
			type: "text",
			text: { value: "No response from assistant", annotations: [] },
		}
	)
}
