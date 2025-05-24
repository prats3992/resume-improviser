import { initializeApp } from "firebase/app"
import { getDatabase, ref, get, set, remove, update } from "firebase/database"
import { v4 as uuidv4 } from "uuid"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

// Helper function to safely get database reference
const safeGetRef = (path) => {
  if (!database) {
    console.error("Database is not available. Check your Firebase configuration.")
    throw new Error("Database service is not available")
  }
  return ref(database, path)
}

// User functions
export async function getUserByUsername(username: string) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    const userRef = ref(database, `Users/${username}`)
    const snapshot = await get(userRef)

    if (snapshot.exists()) {
      return snapshot.val()
    }

    return null
  } catch (error) {
    console.error("Error getting user:", error)
    throw error
  }
}

// Chat functions
export async function getUserChats(username: string) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    const chatsRef = ref(database, `Chat/${username}`)
    const snapshot = await get(chatsRef)

    if (snapshot.exists()) {
      const chatsData = snapshot.val()
      return Object.entries(chatsData).map(([id, data]) => ({
        id,
        title: typeof data === "object" && data.title ? data.title : id,
      }))
    }

    return []
  } catch (error) {
    console.error("Error getting user chats:", error)
    return [] // Return empty array instead of throwing to prevent UI errors
  }
}

export async function createNewChat(username: string, title: string) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    const chatId = uuidv4()
    const chatRef = ref(database, `Chat/${username}/${chatId}`)

    // Initialize with empty array and title
    await set(chatRef, {
      title,
      messages: [],
    })

    return chatId
  } catch (error) {
    console.error("Error creating new chat:", error)
    throw error
  }
}

export async function deleteChat(username: string, chatId: string) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    const chatRef = ref(database, `Chat/${username}/${chatId}`)
    await remove(chatRef)
  } catch (error) {
    console.error("Error deleting chat:", error)
    throw error
  }
}

export async function getChatMessages(username: string, chatId: string) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    const messagesRef = ref(database, `Chat/${username}/${chatId}/messages`)
    const snapshot = await get(messagesRef)

    if (snapshot.exists()) {
      return snapshot.val()
    }

    return []
  } catch (error) {
    console.error("Error getting chat messages:", error)
    return [] // Return empty array instead of throwing to prevent UI errors
  }
}

export async function sendMessage(username: string, chatId: string, message: { role: string; parts: string[] }) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    // First, save the user message
    const messagesRef = ref(database, `Chat/${username}/${chatId}/messages`)
    const snapshot = await get(messagesRef)

    let messages = []
    if (snapshot.exists()) {
      messages = snapshot.val()
    }

    messages.push(message)
    await set(messagesRef, messages)

    // Then, get response from Gemini API
    const response = await callGeminiAPI(message.parts[0])

    // Save the model response
    const modelMessage = { role: "model", parts: [response] }
    messages.push(modelMessage)
    await set(messagesRef, messages)

    return modelMessage
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

export async function updateChatTitle(username: string, chatId: string, title: string) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    const chatRef = ref(database, `Chat/${username}/${chatId}`)

    // Get current chat data
    const snapshot = await get(chatRef)
    if (!snapshot.exists()) {
      throw new Error("Chat not found")
    }

    const chatData = snapshot.val()

    // Update only the title
    await update(chatRef, {
      ...chatData,
      title,
    })

    return true
  } catch (error) {
    console.error("Error updating chat title:", error)
    throw error
  }
}

export async function analyzeResume(username: string, targetRole: string, fileData: any) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    const chatId = uuidv4()
    const chatRef = ref(database, `Chat/${username}/${chatId}`)
    const title = `Resume Analysis for ${targetRole}`

    // Create initial system message
    const systemMessage = {
      role: "model",
      parts: [`I'll analyze your resume for the ${targetRole} position. Please give me a moment...`],
    }

    // Initialize with title and system message
    await set(chatRef, {
      title,
      messages: [systemMessage],
      type: "resume_analysis",
      targetRole,
    })

    // Prepare resume data for analysis
    const resumeData = JSON.stringify(fileData)

    // Call Gemini API for resume analysis
    const response = await callGeminiAPIForResumeAnalysis(resumeData, targetRole)

    // Add the analysis response
    const analysisMessage = {
      role: "model",
      parts: [response],
    }

    const messagesRef = ref(database, `Chat/${username}/${chatId}/messages`)
    await set(messagesRef, [systemMessage, analysisMessage])

    return { chatId, analysisMessage }
  } catch (error) {
    console.error("Error analyzing resume:", error)
    throw error
  }
}

// Job Description Analyzer
export async function analyzeJobDescription(
  username: string,
  jobDescription: string,
  jobTitle: string,
  resumeData: any,
) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    // Call Gemini API for job description analysis
    const response = await callGeminiAPIForJobAnalysis(jobDescription, jobTitle, resumeData)

    // Save the analysis to Firebase
    const analysisId = uuidv4()
    const analysisRef = ref(database, `JobAnalysis/${username}/${analysisId}`)

    await set(analysisRef, {
      jobDescription,
      jobTitle,
      timestamp: Date.now(),
      result: response,
    })

    return response
  } catch (error) {
    console.error("Error analyzing job description:", error)
    throw error
  }
}

// Behavioral Question Generator
export async function generateBehavioralQuestions(username: string, jobTitle: string, resumeData: any) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    // Call Gemini API for behavioral questions
    const questions = await callGeminiAPIForBehavioralQuestions(jobTitle, resumeData)

    // Save the questions to Firebase
    const questionsId = uuidv4()
    const questionsRef = ref(database, `BehavioralQuestions/${username}/${questionsId}`)

    await set(questionsRef, {
      jobTitle,
      timestamp: Date.now(),
      questions,
    })

    return questions
  } catch (error) {
    console.error("Error generating behavioral questions:", error)
    throw error
  }
}

// DSA Challenge functions
export async function getUserSkillLevel(username: string) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    const skillRef = ref(database, `Users/${username}/dsaSkillLevel`)
    const snapshot = await get(skillRef)

    if (snapshot.exists()) {
      return snapshot.val()
    }

    // Default to beginner if not set
    return "beginner"
  } catch (error) {
    console.error("Error getting user skill level:", error)
    return "beginner" // Default to beginner on error
  }
}

export async function updateUserSkillLevel(username: string, skillLevel: string) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    const skillRef = ref(database, `Users/${username}/dsaSkillLevel`)
    await set(skillRef, skillLevel)

    return true
  } catch (error) {
    console.error("Error updating user skill level:", error)
    throw error
  }
}

export async function getDsaChallenge(username: string, skillLevel: string) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    // Call Gemini API to generate a DSA challenge based on skill level
    const challenge = await callGeminiAPIForDsaChallenge(skillLevel)

    // Save the challenge to Firebase
    const challengeId = challenge.id
    const challengeRef = ref(database, `DsaChallenges/${username}/${challengeId}`)

    await set(challengeRef, {
      ...challenge,
      timestamp: Date.now(),
      completed: false,
    })

    return challenge
  } catch (error) {
    console.error("Error getting DSA challenge:", error)
    throw error
  }
}

export async function submitDsaSolution(
  username: string,
  challengeId: string,
  solution: string,
  timeSpent: number,
  hintsUsed: number,
) {
  try {
    if (!database) {
      throw new Error("Database service is not available")
    }

    // Get the challenge
    const challengeRef = ref(database, `DsaChallenges/${username}/${challengeId}`)
    const snapshot = await get(challengeRef)

    if (!snapshot.exists()) {
      throw new Error("Challenge not found")
    }

    const challenge = snapshot.val()

    // Call Gemini API to evaluate the solution
    const evaluationResult = await callGeminiAPIForSolutionEvaluation(challenge, solution)

    // Update the challenge with the solution and result
    await update(challengeRef, {
      userSolution: solution,
      completed: true,
      success: evaluationResult.success,
      timeSpent,
      hintsUsed,
      submittedAt: Date.now(),
    })

    return evaluationResult
  } catch (error) {
    console.error("Error submitting DSA solution:", error)
    throw error
  }
}

// Gemini API integration for job description analysis
async function callGeminiAPIForJobAnalysis(jobDescription: string, jobTitle: string, resumeData: any) {
  try {
    const response = await fetch("/api/analyze-job", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobDescription, jobTitle, resumeData }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("API error response:", errorData)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error calling Gemini API for job analysis:", error)
    throw error
  }
}

// Gemini API integration for behavioral questions
async function callGeminiAPIForBehavioralQuestions(jobTitle: string, resumeData: any) {
  try {
    const response = await fetch("/api/behavioral-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobTitle, resumeData }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("API error response:", errorData)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.questions
  } catch (error) {
    console.error("Error calling Gemini API for behavioral questions:", error)
    throw error
  }
}

// Gemini API integration for DSA challenge
async function callGeminiAPIForDsaChallenge(skillLevel: string) {
  try {
    const response = await fetch("/api/dsa-challenge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ skillLevel }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("API error response:", errorData)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.challenge
  } catch (error) {
    console.error("Error calling Gemini API for DSA challenge:", error)
    throw error
  }
}

// Gemini API integration for solution evaluation
async function callGeminiAPIForSolutionEvaluation(challenge: any, solution: string) {
  try {
    const response = await fetch("/api/evaluate-solution", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ challenge, solution }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("API error response:", errorData)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error calling Gemini API for solution evaluation:", error)
    throw error
  }
}

// Gemini API integration for resume analysis
async function callGeminiAPIForResumeAnalysis(resumeData: string, targetRole: string) {
  try {
    const response = await fetch("/api/analyze-resume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resumeData, targetRole }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("API error response:", errorData)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error("Error calling Gemini API for resume analysis:", error)
    return "I'm sorry, I couldn't analyze your resume at the moment. Please try again later."
  }
}

// Gemini API integration
async function callGeminiAPI(message: string) {
  try {
    console.log("Calling Gemini API with message:", message.substring(0, 50) + "...")

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("API error response:", errorData)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.response) {
      console.error("Invalid API response format:", data)
      throw new Error("Invalid API response format")
    }

    return data.response
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return "I'm sorry, I couldn't process your request at the moment. Please try again later."
  }
}
