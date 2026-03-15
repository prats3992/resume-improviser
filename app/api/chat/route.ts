import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

// Initialize the Google Generative AI model with proper error handling
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in environment variables")
    throw new Error("GEMINI_API_KEY is not defined")
  }
  return createGoogleGenerativeAI({ apiKey })
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const googleAI = getGeminiModel()

    const { text } = await generateText({
      model: googleAI("gemini-2.5-flash"),
      prompt: message,
      system:
        "You are InterviewGPT, an AI assistant specialized in helping users prepare for job interviews. Provide concise, helpful responses to questions about interview preparation, resume building, and career advice. Be supportive and professional.",
      maxTokens: 3000,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in chat API route:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

