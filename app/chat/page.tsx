"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import ChatSidebar from "@/components/chat-sidebar"
import ChatInterface from "@/components/chat-interface"
import ProfileModal from "@/components/profile-modal"
import ResumeAnalysisModal from "@/components/resume-analysis-modal"
import JobDescriptionAnalyzer from "@/components/job-description-analyzer"
import BehavioralQuestionGenerator from "@/components/behavioral-question-generator"
import DsaChallenge from "@/components/dsa-challenge"
import { Button } from "@/components/ui/button"
import { PlusIcon, UserIcon, FileTextIcon, BriefcaseIcon, HelpCircleIcon, CodeIcon } from "lucide-react"
import { createNewChat } from "@/lib/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ChatPage() {
  const { user, loading, error: authError, logout } = useAuth()
  const router = useRouter()
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeChatTitle, setActiveChatTitle] = useState<string>("")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isResumeAnalysisOpen, setIsResumeAnalysisOpen] = useState(false)
  const [isJobAnalyzerOpen, setIsJobAnalyzerOpen] = useState(false)
  const [isBehavioralQuestionsOpen, setIsBehavioralQuestionsOpen] = useState(false)
  const [isDsaChallengeOpen, setIsDsaChallengeOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  // Add a class to the body when resizing to prevent text selection
  useEffect(() => {
    if (isResizing) {
      document.body.classList.add("resizing")
    } else {
      document.body.classList.remove("resizing")
    }

    return () => {
      document.body.classList.remove("resizing")
    }
  }, [isResizing])

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const handleNewChat = async () => {
    try {
      setError(null)
      const chatId = await createNewChat(user.username, `New Chat ${new Date().toLocaleString()}`)
      setActiveChatId(chatId)
      setActiveChatTitle(`New Chat ${new Date().toLocaleString()}`)
    } catch (err) {
      console.error("Error creating new chat:", err)
      setError(err instanceof Error ? err.message : "Failed to create new chat")
    }
  }

  const handleTitleChange = (newTitle: string) => {
    setActiveChatTitle(newTitle)
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-background ${isResizing ? "resizing" : ""}`}>
      <ChatSidebar
        username={user.username}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        setActiveChatTitle={setActiveChatTitle}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b p-4 bg-secondary/30">
          <h1 className="text-xl font-bold text-primary">InterviewGPT</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsJobAnalyzerOpen(true)}
              className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <BriefcaseIcon className="mr-2 h-4 w-4" />
              Job Analyzer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBehavioralQuestionsOpen(true)}
              className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <HelpCircleIcon className="mr-2 h-4 w-4" />
              STAR Questions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDsaChallengeOpen(true)}
              className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <CodeIcon className="mr-2 h-4 w-4" />
              DSA Challenge
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResumeAnalysisOpen(true)}
              className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <FileTextIcon className="mr-2 h-4 w-4" />
              Resume Analysis
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNewChat}
              className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="sr-only">New Chat</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsProfileOpen(true)}
              className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <UserIcon className="h-4 w-4" />
              <span className="sr-only">Profile</span>
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
            >
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {(error || authError) && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || authError}</AlertDescription>
            </Alert>
          )}

          {activeChatId ? (
            <ChatInterface
              chatId={activeChatId}
              username={user.username}
              chatTitle={activeChatTitle}
              onTitleChange={handleTitleChange}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <div className="max-w-md rounded-lg bg-secondary/30 p-8 shadow-lg">
                <h2 className="mb-2 text-2xl font-bold text-primary">Welcome to InterviewGPT</h2>
                <p className="mb-6 text-muted-foreground">
                  Start a new chat or select an existing one to begin your interview preparation
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={handleNewChat} className="bg-primary hover:bg-primary/90">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    New Chat
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsJobAnalyzerOpen(true)}
                    className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <BriefcaseIcon className="mr-2 h-4 w-4" />
                    Job Analyzer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsBehavioralQuestionsOpen(true)}
                    className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <HelpCircleIcon className="mr-2 h-4 w-4" />
                    STAR Questions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDsaChallengeOpen(true)}
                    className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <CodeIcon className="mr-2 h-4 w-4" />
                    DSA Challenge
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {isProfileOpen && <ProfileModal user={user} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />}
      {isResumeAnalysisOpen && (
        <ResumeAnalysisModal user={user} isOpen={isResumeAnalysisOpen} onClose={() => setIsResumeAnalysisOpen(false)} />
      )}
      {isJobAnalyzerOpen && (
        <JobDescriptionAnalyzer user={user} isOpen={isJobAnalyzerOpen} onClose={() => setIsJobAnalyzerOpen(false)} />
      )}
      {isBehavioralQuestionsOpen && (
        <BehavioralQuestionGenerator
          user={user}
          isOpen={isBehavioralQuestionsOpen}
          onClose={() => setIsBehavioralQuestionsOpen(false)}
        />
      )}
      {isDsaChallengeOpen && (
        <DsaChallenge user={user} isOpen={isDsaChallengeOpen} onClose={() => setIsDsaChallengeOpen(false)} />
      )}
    </div>
  )
}
