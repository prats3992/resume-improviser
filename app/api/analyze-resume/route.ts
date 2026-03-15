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
    const { resumeData, targetRole } = await req.json()

    if (!resumeData || !targetRole) {
      return NextResponse.json({ error: "Resume data and target role are required" }, { status: 400 })
    }

    const googleAI = getGeminiModel()

    const { text } = await generateText({
      model: googleAI("gemini-2.5-flash"),
      prompt: `Analyze this resume data for a ${targetRole} position: ${resumeData}`,
      system: `
        You are a professional resume reviewer and career coach. Analyze the provided resume data for the specified role.
        
        Provide a comprehensive analysis including:
        1. Overall assessment (strengths and weaknesses)
        2. Skills assessment (relevant skills present and missing)
        3. Experience evaluation (how well it aligns with the target role)
        4. Specific improvement suggestions
        5. ATS optimization tips
        
        Format your response in clear sections with headers. Be specific, actionable, and constructive.
      `,
      maxTokens: 5000,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in analyze-resume API route:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

