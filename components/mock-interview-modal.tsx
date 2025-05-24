"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { startMockInterview } from "@/lib/firebase"
import type { User } from "@/types/user"

interface MockInterviewModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onStartInterview: (chatId: string) => void
}

export default function MockInterviewModal({ user, isOpen, onClose, onStartInterview }: MockInterviewModalProps) {
  const [role, setRole] = useState(user.targetRole || "")
  const [interviewType, setInterviewType] = useState("technical")
  const [isLoading, setIsLoading] = useState(false)

  const handleStartInterview = async () => {
    setIsLoading(true)
    try {
      const { chatId } = await startMockInterview(user.username, role, interviewType)
      onStartInterview(chatId)
      onClose()
    } catch (error) {
      console.error("Error starting mock interview:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">Mock Interview</DialogTitle>
          <DialogDescription>Set up a mock interview session with our AI interviewer</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Target Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, Product Manager"
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label>Interview Type</Label>
            <RadioGroup value={interviewType} onValueChange={setInterviewType} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="technical" id="technical" className="border-primary text-primary" />
                <Label htmlFor="technical" className="cursor-pointer">
                  Technical
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="behavioral" id="behavioral" className="border-primary text-primary" />
                <Label htmlFor="behavioral" className="cursor-pointer">
                  Behavioral
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" className="border-primary text-primary" />
                <Label htmlFor="mixed" className="cursor-pointer">
                  Mixed
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleStartInterview}
            disabled={!role || isLoading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Setting up..." : "Start Interview"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

