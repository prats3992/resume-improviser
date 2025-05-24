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
    const { jobTitle, resumeData } = await req.json()

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 })
    }

    const googleAI = getGeminiModel()

    const prompt = `
      Generate 5 behavioral interview questions based on the STAR method (Situation, Task, Action, Result) for a ${jobTitle} position.
      
      Consider the candidate's resume data:
      ${JSON.stringify(resumeData)}
      
      For each question:
      1. Create a challenging but realistic behavioral question relevant to the job title
      2. Assign a category (leadership, teamwork, challenge, conflict, failure, success, communication, initiative)
      3. Provide guidance for each part of the STAR method to help the candidate structure their answer
      
      Return the questions in **strictly valid JSON format** as an array of objects with the following structure. Ensure there are no trailing commas or other syntax errors.
      [
        {
          "id": "unique-id",
          "question": "The full behavioral question",
          "category": "The category of the question",
          "starPrompt": {
            "situation": "Guidance for describing the situation",
            "task": "Guidance for describing the task",
            "action": "Guidance for describing the action taken",
            "result": "Guidance for describing the result"
          }
        }
      ]
      
      Return ONLY the valid JSON array, without any introductory text, explanations, or markdown formatting like \`\`\`json.
    `

    const { text } = await generateText({
      model: googleAI("gemini-2.5-flash-preview-04-17"),
      prompt,
      system:
        "You are an expert interview coach specializing in behavioral interviews. Your task is to generate tailored STAR-based behavioral questions for job candidates. You MUST output strictly valid JSON.",
      maxTokens: 7000,
    })

    console.log("Raw AI response text:", text); // Added logging

    // Parse the JSON response
    let questions
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks (less likely with the updated prompt, but kept as a fallback)
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/)
      let jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim() // Trim whitespace

      // Attempt to remove potential trailing commas (simple approach)
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1'); 
      
      console.log("Attempting to parse JSON string:", jsonString); // Added logging

      questions = JSON.parse(jsonString)

      // Ensure each question has a unique ID
      questions = questions.map((q) => ({
        ...q,
        id: q.id || uuidv4(),
      }))
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      console.error("Problematic JSON string:", text) // Log the original text on error
      return NextResponse.json({ error: "Failed to parse questions from AI response" }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Error in behavioral-questions API route:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

