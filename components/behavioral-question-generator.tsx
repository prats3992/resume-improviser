"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Copy, CheckCheck, Star } from "lucide-react"
import { generateBehavioralQuestions } from "@/lib/firebase"
import type { User } from "@/types/user"

interface BehavioralQuestionGeneratorProps {
  user: User
  isOpen: boolean
  onClose: () => void
}

interface Question {
  id: string
  question: string
  category: string
  starPrompt: {
    situation: string
    task: string
    action: string
    result: string
  }
}

export default function BehavioralQuestionGenerator({ user, isOpen, onClose }: BehavioralQuestionGeneratorProps) {
  const [jobTitle, setJobTitle] = useState(user.targetRole || "")
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!jobTitle.trim()) {
      setError("Please enter a job title")
      return
    }

    setIsGenerating(true)
    setError(null)
    setQuestions([])

    try {
      const result = await generateBehavioralQuestions(user.username, jobTitle, user.fileData)
      setQuestions(result)
    } catch (err) {
      console.error("Error generating behavioral questions:", err)
      setError("Failed to generate questions. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyQuestion = (questionId: string, questionText: string) => {
    navigator.clipboard.writeText(questionText)
    setCopiedQuestion(questionId)
    setTimeout(() => setCopiedQuestion(null), 2000)
  }

  const toggleExpandQuestion = (questionId: string) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null)
    } else {
      setExpandedQuestion(questionId)
    }
  }

  const handleClose = () => {
    setJobTitle(user.targetRole || "")
    setQuestions([])
    setError(null)
    setExpandedQuestion(null)
    onClose()
  }

  const categoryColors: Record<string, string> = {
    leadership: "bg-blue-100 text-blue-800 border-blue-200",
    teamwork: "bg-green-100 text-green-800 border-green-200",
    challenge: "bg-purple-100 text-purple-800 border-purple-200",
    conflict: "bg-orange-100 text-orange-800 border-orange-200",
    failure: "bg-red-100 text-red-800 border-red-200",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    communication: "bg-indigo-100 text-indigo-800 border-indigo-200",
    initiative: "bg-amber-100 text-amber-800 border-amber-200",
    default: "bg-gray-100 text-gray-800 border-gray-200",
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-primary">STAR Behavioral Question Generator</DialogTitle>
          <DialogDescription>
            Generate tailored behavioral interview questions based on your target role and resume
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1 modal-scrollable">
          {questions.length === 0 ? (
            <>
              <div className="space-y-2">
                <label htmlFor="jobTitle" className="text-sm font-medium">
                  Target Job Title
                </label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !jobTitle.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  "Generate STAR Questions"
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Questions for <span className="text-primary">{jobTitle}</span>
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="text-primary border-primary/20 hover:bg-primary/10"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                {questions.map((question) => (
                  <Card key={question.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge
                          variant="outline"
                          className={categoryColors[question.category.toLowerCase()] || categoryColors.default}
                        >
                          {question.category}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopyQuestion(question.id, question.question)}
                        >
                          {copiedQuestion === question.id ? (
                            <CheckCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <CardTitle className="text-base">{question.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/10 -ml-2"
                        onClick={() => toggleExpandQuestion(question.id)}
                      >
                        <Star className="mr-1 h-4 w-4" />
                        {expandedQuestion === question.id ? "Hide STAR Guide" : "View STAR Guide"}
                      </Button>
                    </CardContent>
                    {expandedQuestion === question.id && (
                      <CardFooter className="flex flex-col items-start bg-muted/50 pt-3 overflow-y-auto max-h-[200px] modal-scrollable">
                        <div className="space-y-2 w-full pb-2">
                          <div>
                            <span className="font-semibold text-sm">Situation: </span>
                            <span className="text-sm">{question.starPrompt.situation}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-sm">Task: </span>
                            <span className="text-sm">{question.starPrompt.task}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-sm">Action: </span>
                            <span className="text-sm">{question.starPrompt.action}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-sm">Result: </span>
                            <span className="text-sm">{question.starPrompt.result}</span>
                          </div>
                        </div>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
