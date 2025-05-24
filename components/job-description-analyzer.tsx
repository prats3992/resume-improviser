"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { analyzeJobDescription } from "@/lib/firebase"
import type { User } from "@/types/user"

interface JobDescriptionAnalyzerProps {
  user: User
  isOpen: boolean
  onClose: () => void
}

interface AnalysisResult {
  matchingSkills: string[]
  missingSkills: string[]
  matchingExperience: string[]
  missingExperience: string[]
  suggestedChanges: string[]
  overallMatch: number
}

export default function JobDescriptionAnalyzer({ user, isOpen, onClose }: JobDescriptionAnalyzerProps) {
  const [jobDescription, setJobDescription] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError("Please enter a job description")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await analyzeJobDescription(user.username, jobDescription, jobTitle, user.fileData)
      setAnalysisResult(result)
    } catch (err) {
      console.error("Error analyzing job description:", err)
      setError("Failed to analyze job description. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClose = () => {
    setJobDescription("")
    setJobTitle("")
    setAnalysisResult(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary">Job Description Analyzer</DialogTitle>
          <DialogDescription>
            Paste a job description to analyze how well your resume matches and get suggestions for improvement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!analysisResult ? (
            <>
              <div className="space-y-2">
                <label htmlFor="jobTitle" className="text-sm font-medium">
                  Job Title (Optional)
                </label>
                <input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="jobDescription" className="text-sm font-medium">
                  Job Description
                </label>
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="min-h-[200px] border-primary/20 focus-visible:ring-primary"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !jobDescription.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Job Description"
                )}
              </Button>
            </>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Overall Match</span>
                      <Badge
                        className={`text-white ${
                          analysisResult.overallMatch >= 70
                            ? "bg-green-500"
                            : analysisResult.overallMatch >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      >
                        {analysisResult.overallMatch}%
                      </Badge>
                    </CardTitle>
                    <CardDescription>Summary of how well your resume matches this job description</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Strengths</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {analysisResult.matchingSkills.slice(0, 3).map((skill, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Areas to Improve</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {analysisResult.missingSkills.slice(0, 3).map((skill, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md bg-primary/10 p-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        Next Steps
                      </h4>
                      <p className="text-sm mt-1">
                        Review the detailed analysis in the tabs above and consider implementing the suggested changes
                        to improve your match for this position.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills Analysis</CardTitle>
                    <CardDescription>Matching and missing skills for this position</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Matching Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.matchingSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {skill}
                          </Badge>
                        ))}
                        {analysisResult.matchingSkills.length === 0 && (
                          <p className="text-sm text-muted-foreground">No matching skills found</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-red-600 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Missing Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.missingSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {skill}
                          </Badge>
                        ))}
                        {analysisResult.missingSkills.length === 0 && (
                          <p className="text-sm text-muted-foreground">No missing skills found</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Experience Analysis</CardTitle>
                    <CardDescription>Matching and missing experience for this position</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Relevant Experience
                      </h4>
                      <ul className="space-y-2">
                        {analysisResult.matchingExperience.map((exp, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{exp}</span>
                          </li>
                        ))}
                        {analysisResult.matchingExperience.length === 0 && (
                          <p className="text-sm text-muted-foreground">No relevant experience found</p>
                        )}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-red-600 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Missing Experience
                      </h4>
                      <ul className="space-y-2">
                        {analysisResult.missingExperience.map((exp, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>{exp}</span>
                          </li>
                        ))}
                        {analysisResult.missingExperience.length === 0 && (
                          <p className="text-sm text-muted-foreground">No missing experience found</p>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suggestions" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Suggested Changes</CardTitle>
                    <CardDescription>Recommendations to improve your resume for this position</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysisResult.suggestedChanges.map((suggestion, index) => (
                        <li key={index} className="text-sm flex items-start gap-2 pb-2 border-b last:border-0">
                          <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                      {analysisResult.suggestedChanges.length === 0 && (
                        <p className="text-sm text-muted-foreground">No suggestions available</p>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {analysisResult && (
          <div className="flex justify-end mt-4">
            <Button onClick={handleClose} variant="outline" className="mr-2">
              Close
            </Button>
            <Button onClick={() => setAnalysisResult(null)} className="bg-primary hover:bg-primary/90">
              Analyze Another
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

