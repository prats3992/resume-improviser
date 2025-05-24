import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { v4 as uuidv4 } from "uuid"

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
    const { skillLevel } = await req.json()

    if (!skillLevel) {
      return NextResponse.json({ error: "Skill level is required" }, { status: 400 })
    }

    const googleAI = getGeminiModel()

    // Adjust difficulty based on skill level
    let difficulty
    let categories

    switch (skillLevel.toLowerCase()) {
      case "beginner":
        difficulty = "Easy"
        categories = ["Arrays", "Strings", "Basic Math", "Simple Recursion"]
        break
      case "intermediate":
        difficulty = "Medium"
        categories = ["Hash Tables", "Two Pointers", "Binary Search", "Linked Lists", "Stacks", "Queues"]
        break
      case "advanced":
        difficulty = "Medium to Hard"
        categories = ["Trees", "Graphs", "Dynamic Programming", "Greedy Algorithms", "Backtracking"]
        break
      case "expert":
        difficulty = "Hard"
        categories = [
          "Advanced Dynamic Programming",
          "Complex Graph Algorithms",
          "System Design",
          "Advanced Data Structures",
        ]
        break
      default:
        difficulty = "Easy to Medium"
        categories = ["Arrays", "Strings", "Hash Tables", "Two Pointers"]
    }

    // Randomly select a category
    const category = categories[Math.floor(Math.random() * categories.length)]

    const prompt = `
      Generate a ${difficulty} level coding challenge in the category of ${category} for a ${skillLevel} programmer.
      
      The challenge should include:
      1. A clear problem statement
      2. Constraints on the input
      3. Sample input and output
      4. 3 progressive hints that guide the user without giving away the solution
      5. A correct solution in pseudocode
      6. A brief explanation of the solution approach
      
      Return the challenge in JSON format with the following structure:
      {
        "id": "unique-id",
        "title": "Challenge title",
        "description": "Detailed problem description",
        "difficulty": "${difficulty}",
        "category": "${category}",
        "constraints": ["constraint1", "constraint2", ...],
        "sampleInput": "Example input",
        "sampleOutput": "Expected output",
        "hints": ["hint1", "hint2", "hint3"],
        "solution": "Solution in pseudocode",
        "explanation": "Explanation of the solution approach"
      }
      
      Return ONLY a valid JSON object with these fields.
    `

    const { text } = await generateText({
      model: googleAI("gemini-2.5-flash-preview-04-17"),
      prompt,
      system:
        "You are an expert programming instructor specializing in data structures and algorithms. Your task is to create challenging but educational coding problems.",
      maxTokens: 10000,
    })

    // Parse the JSON response
    let challenge
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : text
      challenge = JSON.parse(jsonString)

      // Ensure the challenge has a unique ID
      challenge.id = challenge.id || uuidv4()
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      return NextResponse.json({ error: "Failed to parse challenge" }, { status: 500 })
    }

    return NextResponse.json({ challenge })
  } catch (error) {
    console.error("Error in dsa-challenge API route:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

