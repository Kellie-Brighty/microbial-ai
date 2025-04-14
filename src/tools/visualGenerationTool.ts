import { ToolConfig } from "./allTools";

interface VisualGenerationArgs {
  prompt: string;
  size?: string; // Optional image size
}

export const visualGenerationTool: ToolConfig<VisualGenerationArgs> = {
  definition: {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate custom images based on user prompts.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "A detailed description of the image to generate.",
          },
          size: {
            type: "string",
            description:
              "The size of the generated image. Options: 256x256, 512x512, 1024x1024. Default: 1024x1024.",
            enum: ["256x256", "512x512", "1024x1024"],
          },
        },
        required: ["prompt"],
      },
    },
  },
  handler: async ({ prompt, size = "1024x1024" }: VisualGenerationArgs) => {
    // Log the incoming request for debugging
    console.log(
      `Generating image with prompt: "${prompt}" and size: "${size}"`
    );

    try {
      // Fetch the generated image from OpenAI's DALL·E API
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`, // Ensure API key is set in environment variables
          },
          body: JSON.stringify({
            prompt,
            n: 1, // Number of images to generate
            size,
          }),
        }
      );

      const data = await response.json();

      // Check if the response contains a valid image URL
      if (data && data.data && data.data.length > 0) {
        const imageUrl = data.data[0].url;
        console.log("Generated Image URL:", imageUrl);
        return imageUrl;
      } else {
        throw new Error("Image generation failed. No image returned from API.");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error during image generation: ${error.message}`);
        throw new Error(`Image generation failed: ${error.message}`);
      } else {
        console.error("Unknown error during image generation.");
        throw new Error("Image generation failed: Unknown error.");
      }
    }
  },
};
