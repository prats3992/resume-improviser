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
    const { jobDescription, jobTitle, resumeData } = await req.json()

    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 })
    }

    const googleAI = getGeminiModel()

    const prompt = `
      Analyze this job description${jobTitle ? ` for a ${jobTitle} position` : ""} and compare it with the candidate's resume data.
      
      Job Description:
      ${jobDescription}
      
      Resume Data:
      ${JSON.stringify(resumeData)}
      
      Provide a detailed analysis with the following information in JSON format:
      1. matchingSkills: Array of skills from the resume that match the job requirements
      2. missingSkills: Array of skills mentioned in the job description that are missing from the resume
      3. matchingExperience: Array of experiences from the resume that are relevant to the job
      4. missingExperience: Array of experiences mentioned in the job description that are missing from the resume
      5. suggestedChanges: Array of specific suggestions to improve the resume for this job
      6. overallMatch: A percentage (0-100) indicating how well the resume matches the job description
      
      Return ONLY a valid JSON object with these fields.
    `

    const { text } = await generateText({
      model: googleAI("gemini-2.5-flash"),
      prompt,
      system:
        "You are an expert resume analyst and job coach. Your task is to analyze job descriptions and compare them with candidate resumes to provide actionable insights.",
      maxTokens: 5000,
    })

    // Parse the JSON response
    let result
    try {
      result = extractAndParseJSON(text)

      // Ensure all required fields are present
      const requiredFields = [
        "matchingSkills",
        "missingSkills",
        "matchingExperience",
        "missingExperience",
        "suggestedChanges",
        "overallMatch",
      ]
      for (const field of requiredFields) {
        if (!(field in result)) {
          result[field] =
            field.includes("Skills") || field.includes("Experience") ? [] : field === "overallMatch" ? 0 : ""
        }
      }
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      console.error("Raw AI response:", text)
      return NextResponse.json({ error: "Failed to parse analysis result" }, { status: 500 })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Error in analyze-job API route:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
