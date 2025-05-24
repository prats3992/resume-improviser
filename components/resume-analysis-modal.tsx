"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { analyzeResume } from "@/lib/firebase"
import type { User } from "@/types/user"

interface ResumeAnalysisModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
}

export default function ResumeAnalysisModal({ user, isOpen, onClose }: ResumeAnalysisModalProps) {
  const [targetRole, setTargetRole] = useState(user.targetRole || "")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAnalyzeResume = async () => {
    if (!user.fileData) {
      alert("No resume data found. Please update your profile first.")
      return
    }

    setIsLoading(true)
    try {
      const { chatId } = await analyzeResume(user.username, targetRole, user.fileData)
      router.push(`/chat?id=${chatId}`)
      onClose()
    } catch (error) {
      console.error("Error analyzing resume:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">Resume Analysis</DialogTitle>
          <DialogDescription>Get AI feedback on your resume for your target role</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="targetRole">Target Role</Label>
            <Input
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer, Product Manager"
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>

          <div className="rounded-md bg-secondary/50 p-4">
            <h4 className="mb-2 font-medium text-primary">Resume Data</h4>
            <p className="text-sm text-muted-foreground">
              {user.fileData
                ? "Your resume data will be analyzed based on the information in your profile."
                : "No resume data found. Please update your profile first."}
            </p>
          </div>

          <Button
            onClick={handleAnalyzeResume}
            disabled={!targetRole || isLoading || !user.fileData}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Analyzing..." : "Analyze Resume"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

