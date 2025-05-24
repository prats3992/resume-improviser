"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  Clock,
  LightbulbIcon,
  CheckCircle2,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Code,
  FileText,
  AlertCircle,
} from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getDsaChallenge, submitDsaSolution, getUserSkillLevel, updateUserSkillLevel } from "@/lib/firebase"
import type { User } from "@/types/user"

interface DsaChallengeProps {
  user: User
  isOpen: boolean
  onClose: () => void
}

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  category: string
  hints: string[]
  sampleInput: string
  sampleOutput: string
  constraints: string[]
  solution: string
  explanation: string
}

export default function DsaChallenge({ user, isOpen, onClose }: DsaChallengeProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [solution, setSolution] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean
    feedback: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState("problem")
  const [revealedHints, setRevealedHints] = useState<number[]>([])
  const [skillLevel, setSkillLevel] = useState<string>("beginner")

  // Timer state
  const [time, setTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadChallenge = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const userSkillLevel = await getUserSkillLevel(user.username)
        setSkillLevel(userSkillLevel || "beginner")

        const challengeData = await getDsaChallenge(user.username, userSkillLevel || "beginner")
        setChallenge(challengeData)

        // Start timer automatically when challenge loads
        startTimer()
      } catch (err) {
        console.error("Error loading DSA challenge:", err)
        setError("Failed to load challenge. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      loadChallenge()
    }

    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isOpen, user.username])

  const startTimer = () => {
    setIsTimerRunning(true)
    timerRef.current = setInterval(() => {
      setTime((prevTime) => prevTime + 1)
    }, 1000)
  }

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsTimerRunning(false)
  }

  const resetTimer = () => {
    pauseTimer()
    setTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleRevealHint = (index: number) => {
    if (!revealedHints.includes(index)) {
      setRevealedHints([...revealedHints, index])
    }
  }

  const handleSubmit = async () => {
    if (!solution.trim()) {
      setError("Please enter your solution")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitDsaSolution(user.username, challenge?.id || "", solution, time, revealedHints.length)
      setSubmissionResult(result)

      // Update skill level if solution is correct
      if (result.success) {
        const newSkillLevel = calculateNewSkillLevel(
          skillLevel,
          challenge?.difficulty || "Easy",
          time,
          revealedHints.length,
        )
        await updateUserSkillLevel(user.username, newSkillLevel)
        setSkillLevel(newSkillLevel)
      }

      // Pause timer on submission
      pauseTimer()
    } catch (err) {
      console.error("Error submitting solution:", err)
      setError("Failed to submit solution. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateNewSkillLevel = (
    currentLevel: string,
    difficulty: string,
    timeSpent: number,
    hintsUsed: number,
  ): string => {
    // Simple algorithm to adjust skill level based on performance
    if (currentLevel === "beginner" && difficulty === "Easy" && timeSpent < 300 && hintsUsed <= 1) {
      return "intermediate"
    } else if (currentLevel === "intermediate" && difficulty === "Medium" && timeSpent < 600 && hintsUsed <= 1) {
      return "advanced"
    } else if (currentLevel === "advanced" && difficulty === "Hard" && timeSpent < 900 && hintsUsed <= 1) {
      return "expert"
    } else if (currentLevel === "intermediate" && (timeSpent > 900 || hintsUsed >= 3)) {
      return "beginner"
    } else if (currentLevel === "advanced" && (timeSpent > 1200 || hintsUsed >= 3)) {
      return "intermediate"
    } else if (currentLevel === "expert" && (timeSpent > 1500 || hintsUsed >= 3)) {
      return "advanced"
    }

    return currentLevel
  }

  const handleRefreshChallenge = async () => {
    setIsLoading(true)
    setError(null)
    setSubmissionResult(null)
    setSolution("")
    setRevealedHints([])
    resetTimer()

    try {
      const challengeData = await getDsaChallenge(user.username, skillLevel)
      setChallenge(challengeData)
      startTimer()
    } catch (err) {
      console.error("Error loading new DSA challenge:", err)
      setError("Failed to load new challenge. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    pauseTimer()
    setChallenge(null)
    setSolution("")
    setSubmissionResult(null)
    setRevealedHints([])
    setTime(0)
    onClose()
  }

  const difficultyColors = {
    Easy: "bg-green-100 text-green-800 border-green-200",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Hard: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Daily DSA Challenge</DialogTitle>
          <DialogDescription>
            Solve today's algorithm challenge tailored to your skill level ({skillLevel})
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error && !challenge ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefreshChallenge} className="bg-primary hover:bg-primary/90">
              Try Again
            </Button>
          </div>
        ) : challenge ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={difficultyColors[challenge.difficulty] || difficultyColors.Easy}>
                  {challenge.difficulty}
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  {challenge.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-sm font-medium">
                  <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                  {formatTime(time)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={isTimerRunning ? pauseTimer : startTimer}
                >
                  {isTimerRunning ? (
                    <PauseCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <PlayCircle className="h-5 w-5 text-primary" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetTimer}>
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="problem" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="problem" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Problem
                </TabsTrigger>
                <TabsTrigger value="solution" className="flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  Your Solution
                </TabsTrigger>
              </TabsList>

              <TabsContent value="problem" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{challenge.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="whitespace-pre-line">{challenge.description}</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Constraints:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {challenge.constraints.map((constraint, index) => (
                          <li key={index} className="text-sm">
                            {constraint}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Sample Input:</h4>
                        <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto">{challenge.sampleInput}</pre>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Sample Output:</h4>
                        <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto">{challenge.sampleOutput}</pre>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-start border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <LightbulbIcon className="mr-1 h-4 w-4 text-yellow-500" />
                      Hints:
                    </h4>
                    <div className="space-y-2 w-full">
                      {challenge.hints.map((hint, index) => (
                        <div key={index}>
                          {revealedHints.includes(index) ? (
                            <p className="text-sm bg-muted p-2 rounded-md">{hint}</p>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-primary border-primary/20 hover:bg-primary/10"
                              onClick={() => handleRevealHint(index)}
                            >
                              Reveal Hint {index + 1}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="solution" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Solution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="Write your solution here..."
                      className="min-h-[300px] font-mono text-sm border-primary/20 focus-visible:ring-primary"
                      disabled={!!submissionResult}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    {submissionResult ? (
                      <div className="w-full space-y-4">
                        <div
                          className={`p-3 rounded-md ${
                            submissionResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {submissionResult.success ? (
                              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                            ) : (
                              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium">
                                {submissionResult.success ? "Correct Solution!" : "Not Quite Right"}
                              </p>
                              <div className="text-sm mt-1 prose dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {submissionResult.feedback}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={handleRefreshChallenge} className="bg-primary hover:bg-primary/90">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Another Challenge
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <div className="ml-auto">
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !solution.trim()}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Solution"
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

