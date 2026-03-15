import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts and parses JSON from AI-generated responses that may contain markdown code blocks
 * @param text - The raw text response from the AI model
 * @returns Parsed JSON object
 * @throws Error if JSON cannot be parsed
 */
export function extractAndParseJSON(text: string): any {
  // Step 1: Try to extract from markdown code blocks
  let jsonString = text.trim()
  
  // Try ```json...``` pattern first
  const jsonCodeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonCodeBlockMatch) {
    jsonString = jsonCodeBlockMatch[1].trim()
  }
  
  // Step 2: Remove trailing commas (common issue with AI-generated JSON)
  jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1")
  
  // Step 3: Find the first { or [ and the last } or ] to handle cases where there's extra text
  const firstBraceIndex = jsonString.search(/[{[]/)
  const lastBraceIndex = Math.max(
    jsonString.lastIndexOf("}"),
    jsonString.lastIndexOf("]")
  )
  
  if (firstBraceIndex !== -1 && lastBraceIndex !== -1) {
    jsonString = jsonString.substring(firstBraceIndex, lastBraceIndex + 1)
  }
  
  // Step 4: Attempt to parse
  return JSON.parse(jsonString)
}

