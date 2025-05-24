"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertCircle, SendIcon, Edit2, Check, X } from "lucide-react"
import { getChatMessages, sendMessage, updateChatTitle } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "model"
  parts: string[]
}

interface ChatInterfaceProps {
  chatId: string
  username: string
  chatTitle: string
  onTitleChange: (newTitle: string) => void
}

export default function ChatInterface({ chatId, username, chatTitle, onTitleChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(chatTitle)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMessages = async () => {
      setInitialLoad(true)
      setError(null)
      try {
        const chatMessages = await getChatMessages(username, chatId)
        setMessages(chatMessages)
      } catch (error) {
        console.error("Error loading messages:", error)
        setError("Failed to load messages. Please try refreshing the page.")
      } finally {
        setInitialLoad(false)
      }
    }

    if (chatId) {
      loadMessages()
    }
  }, [chatId, username])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isTyping])

  useEffect(() => {
    setTitleInput(chatTitle)
  }, [chatTitle])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    setError(null)
    const userMessage: Message = { role: "user", parts: [input] }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      // If this is the first message, update the chat title
      if (messages.length === 0) {
        const title = generateChatTitle(input)
        await updateChatTitle(username, chatId, title)
        onTitleChange(title)
      }

      const response = await sendMessage(username, chatId, userMessage)
      setIsTyping(false)
      setMessages((prev) => [...prev, response])
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to send message. Please try again.")
      setIsTyping(false)
      // Add error message
      setMessages((prev) => [
        ...prev,
        { role: "model", parts: ["Sorry, there was an error processing your request. Please try again."] },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleTitleSave = async () => {
    if (titleInput.trim() && titleInput !== chatTitle) {
      try {
        await updateChatTitle(username, chatId, titleInput)
        onTitleChange(titleInput)
      } catch (error) {
        console.error("Error updating chat title:", error)
        setTitleInput(chatTitle)
      }
    } else {
      setTitleInput(chatTitle)
    }
    setEditingTitle(false)
  }

  // Generate a meaningful chat title from the first message
  const generateChatTitle = (message: string): string => {
    // Extract first 5-7 words or 50 characters, whichever is shorter
    const words = message.split(" ")
    const titleWords = words.slice(0, Math.min(7, words.length))
    let title = titleWords.join(" ")

    if (title.length > 50) {
      title = title.substring(0, 47) + "..."
    }

    return title
  }

  // Format code blocks in markdown
  const formatMarkdown = (text: string) => {
    return text
  }

  if (initialLoad) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4 flex items-center">
        {editingTitle ? (
          <div className="flex items-center gap-2 w-full">
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="flex-1 border-primary/20 focus-visible:ring-primary"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTitleSave}
              className="h-8 w-8 text-primary hover:bg-primary/10"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingTitle(false)
                setTitleInput(chatTitle)
              }}
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <h2 className="text-lg font-medium flex-1 truncate">{chatTitle}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingTitle(true)}
              className="h-8 w-8 text-primary hover:bg-primary/10"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <div className="rounded-lg bg-accent p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-medium">Welcome to InterviewGPT</h3>
                <p className="text-muted-foreground">Start the conversation by sending a message</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 p-4",
                  message.role === "user"
                    ? "ml-auto max-w-[80%] chat-bubble-user"
                    : "mr-auto max-w-[80%] chat-bubble-ai",
                )}
              >
                {message.role === "model" && (
                  <Avatar className="h-8 w-8 bg-secondary border-2 border-primary/20">
                    <AvatarFallback className="text-primary-foreground bg-primary">AI</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
                  {message.role === "model" ? (
                    <ReactMarkdown>{message.parts[0]}</ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.parts[0]}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 bg-primary/10 border-2 border-primary/20">
                    <AvatarFallback className="text-primary-foreground bg-primary">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex items-start gap-3 p-4 mr-auto max-w-[80%] chat-bubble-ai">
              <Avatar className="h-8 w-8 bg-secondary border-2 border-primary/20">
                <AvatarFallback className="text-primary-foreground bg-primary">AI</AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div
                  className="h-2 w-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
                <div
                  className="h-2 w-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "600ms" }}
                ></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4 bg-background/80 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[80px] flex-1 resize-none border-primary/20 focus-visible:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
