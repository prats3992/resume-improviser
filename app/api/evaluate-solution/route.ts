import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { extractAndParseJSON } from "@/lib/utils"

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
    const { challenge, solution } = await req.json()

    if (!challenge || !solution) {
      return NextResponse.json({ error: "Challenge and solution are required" }, { status: 400 })
    }

    const googleAI = getGeminiModel()

    const prompt = `
      Evaluate this solution to the following coding challenge:
      
      Challenge: ${challenge.title}
      Description: ${challenge.description}
      Constraints: ${JSON.stringify(challenge.constraints)}
      Sample Input: ${challenge.sampleInput}
      Sample Output: ${challenge.sampleOutput}
      
      User's Solution:
      ${solution}
      
      Correct Solution:
      ${challenge.solution}
      
      Evaluate the user's solution and determine:
      1. Is it correct? Does it solve the problem as described?
      2. Does it handle the sample input correctly?
      3. Does it meet all the constraints?
      4. Is it efficient in terms of time and space complexity?
      5. Are there any edge cases it might miss?
      
      Return your evaluation in JSON format with the following structure:
      {
        "success": true/false,
        "feedback": "Detailed feedback on the solution, including what's correct, what's wrong, and suggestions for improvement"
      }
      
      Return ONLY a valid JSON object with these fields.
    `

    const { text } = await generateText({
      model: googleAI("gemini-2.5-flash"),
      prompt,
      system:
        "You are an expert programming instructor and code reviewer. Your task is to evaluate coding solutions fairly and provide constructive feedback.",
      maxTokens: 5000,
    })

    // Parse the JSON response
    let result
    try {
      result = extractAndParseJSON(text)
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      console.error("Raw AI response:", text)
      return NextResponse.json({ error: "Failed to parse evaluation result" }, { status: 500 })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Error in evaluate-solution API route:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
