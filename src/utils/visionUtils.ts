import OpenAI from "openai";

// Function to convert a file to a base64 data URL
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Process an image using vision capabilities
export const processImageWithVision = async (
  client: OpenAI,
  imageDataUrl: string,
  prompt: string
): Promise<string> => {
  try {
    console.log("Processing image with vision API...");
    console.log("Client initialized:", !!client);
    console.log("Image data URL length:", imageDataUrl.length);
    console.log("Prompt:", prompt);

    // Check if the API key exists and is correctly loaded
    if (!client.apiKey) {
      console.error("API key is missing or invalid");
      return "I couldn't analyze this image. There seems to be an issue with the API configuration.";
    }

    // Try with first model option
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini", // Using the more affordable model with vision capabilities
        messages: [
          {
            role: "system",
            content:
              "You are a helpful and knowledgeable assistant with the ability to analyze images. When presented with an image, describe what you see in detail, focusing on the visual elements present. If the image relates to microbiology or science, provide relevant scientific information. Be factual and descriptive.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt || "Please describe this image in detail.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                  detail: "high", // Request high detail analysis
                },
              },
            ],
          },
        ],
        max_tokens: 1000, // Increased token limit for more detailed responses
        temperature: 0.7, // Slightly reduced temperature for more focused responses
      });

      console.log("Vision API response received:", !!response);

      // Check if we have a valid content response
      if (!response.choices[0].message.content) {
        throw new Error("Empty response from vision API");
      }

      const content = response.choices[0].message.content;

      // If content indicates policy restriction, try fallback
      if (
        content.includes("guidelines") ||
        content.includes("can't analyze") ||
        content.includes("policy")
      ) {
        throw new Error("Content policy restriction detected");
      }

      return content;
    } catch (primaryError) {
      console.log(
        "Primary model attempt failed, trying fallback...",
        primaryError
      );

      // Fallback to more general approach with GPT-4o
      const fallbackResponse = await client.chat.completions.create({
        model: "gpt-4o", // Try with the main model as fallback
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that can see and analyze images. Describe what you see in the image in a helpful, accurate, and detailed way. Focus on objective visual elements.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What do you see in this image? Please be detailed but factual.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      return (
        fallbackResponse.choices[0].message.content ||
        "I'm unable to analyze this image in detail. Please try a different image."
      );
    }
  } catch (error) {
    console.error("Error processing image with vision:", error);

    // More detailed error messages based on error type
    if (error instanceof Error) {
      console.error("Error message:", error.message);

      // Check for common API errors
      if (error.message.includes("API key")) {
        return "I couldn't analyze this image due to an API key issue. Please check your OpenAI API key configuration.";
      } else if (
        error.message.includes("permission") ||
        error.message.includes("scope")
      ) {
        return "I couldn't analyze this image because your API key doesn't have permission to use the vision capabilities. Please make sure your OpenAI account has access to GPT-4 Vision models.";
      } else if (
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        return "I couldn't analyze this image due to rate limiting. Please try again later.";
      } else if (
        error.message.includes("format") ||
        error.message.includes("image")
      ) {
        return "I couldn't analyze this image. The image format might not be supported or the file might be corrupted.";
      }
    }

    return "I encountered an error while analyzing this image. Please try again with a different image.";
  }
};
