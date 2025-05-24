"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, PlusCircle, Trash2, GripVertical } from "lucide-react"
import { getUserChats, deleteChat, createNewChat } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ChatSidebarProps {
  username: string
  activeChatId: string | null
  setActiveChatId: (chatId: string) => void
  setActiveChatTitle: (title: string) => void
}

interface ChatItem {
  id: string
  title: string
}

// Default, min and max sidebar widths
const DEFAULT_SIDEBAR_WIDTH = 260
const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 400

export default function ChatSidebar({ username, activeChatId, setActiveChatId, setActiveChatTitle }: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)

  // Load saved sidebar width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem("sidebarWidth")
    if (savedWidth) {
      setSidebarWidth(Number.parseInt(savedWidth))
    }
  }, [])

  // Set up resize event listeners
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      // Save the current width to localStorage
      if (sidebarWidth) {
        localStorage.setItem("sidebarWidth", sidebarWidth.toString())
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = e.clientX
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth)
      }
    }

    const resizeHandle = resizeHandleRef.current
    if (resizeHandle) {
      resizeHandle.addEventListener("mousedown", handleMouseDown)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      if (resizeHandle) {
        resizeHandle.removeEventListener("mousedown", handleMouseDown)
      }
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isResizing, sidebarWidth])

  useEffect(() => {
    const loadChats = async () => {
      try {
        const userChats = await getUserChats(username)
        setChats(userChats)

        // Set first chat as active if none is selected
        if (userChats.length > 0 && !activeChatId) {
          setActiveChatId(userChats[0].id)
          setActiveChatTitle(userChats[0].title)
        }
      } catch (error) {
        console.error("Error loading chats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [username, activeChatId, setActiveChatId, setActiveChatTitle])

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(username, chatId)
      setChats(chats.filter((chat) => chat.id !== chatId))

      if (activeChatId === chatId) {
        const nextChat = chats.find((c) => c.id !== chatId)
        if (nextChat) {
          setActiveChatId(nextChat.id)
          setActiveChatTitle(nextChat.title)
        } else {
          setActiveChatId(null)
          setActiveChatTitle("")
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
    } finally {
      setChatToDelete(null)
    }
  }

  const handleNewChat = async () => {
    try {
      const chatId = await createNewChat(username, `New Chat ${new Date().toLocaleString()}`)
      const newChat = { id: chatId, title: `New Chat ${new Date().toLocaleString()}` }
      setChats([newChat, ...chats])
      setActiveChatId(chatId)
      setActiveChatTitle(newChat.title)
    } catch (error) {
      console.error("Error creating new chat:", error)
    }
  }

  const handleSelectChat = (chat: ChatItem) => {
    setActiveChatId(chat.id)
    setActiveChatTitle(chat.title)
  }

  return (
    <>
      <div
        ref={sidebarRef}
        className={cn("flex flex-col border-r bg-secondary/30 relative", collapsed ? "w-16" : "min-w-[200px]")}
        style={{ width: collapsed ? "4rem" : `${sidebarWidth}px` }}
      >
        <div className="flex items-center justify-between p-4">
          {!collapsed && <h2 className="font-semibold text-primary">Chat History</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-primary hover:bg-primary/10"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          className={cn(
            "mx-2 mb-2 flex items-center gap-2 text-primary hover:bg-primary/10",
            collapsed && "justify-center",
          )}
          onClick={handleNewChat}
        >
          <PlusCircle className="h-4 w-4" />
          {!collapsed && <span>New Chat</span>}
        </Button>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">{!collapsed && "No chat history found"}</div>
          ) : (
            <div className="space-y-1 p-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "flex items-center rounded-md",
                    activeChatId === chat.id ? "bg-primary/20" : "hover:bg-primary/10",
                  )}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between py-2 px-3 h-auto text-left",
                      activeChatId === chat.id && "bg-transparent hover:bg-transparent",
                      collapsed && "justify-center p-2",
                    )}
                    onClick={() => handleSelectChat(chat)}
                  >
                    {!collapsed ? (
                      <span className="truncate">{chat.title}</span>
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </Button>

                  {!collapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 mr-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setChatToDelete(chat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete chat</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Resize handle */}
        {!collapsed && (
          <div
            ref={resizeHandleRef}
            className="absolute top-0 right-0 h-full w-1 cursor-ew-resize hover:bg-primary/50 z-10"
            title="Resize sidebar"
          >
            <div className="absolute top-1/2 right-0 -translate-y-1/2 p-0.5 bg-primary/20 rounded-sm">
              <GripVertical className="h-5 w-5 text-primary/50" />
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
