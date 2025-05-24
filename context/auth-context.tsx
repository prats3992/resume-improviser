"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getUserByUsername } from "@/lib/firebase"
import type { User } from "@/types/user"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("interviewgpt_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("interviewgpt_user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const userData = await getUserByUsername(username)

      if (!userData) {
        throw new Error("User not found")
      }

      if (userData.Password !== password) {
        throw new Error("Invalid password")
      }

      const userObj: User = {
        username,
        targetRole: userData["Target Role"] || "",
        pricing: userData.pricing || "",
        template: userData.template || "",
        fileData: userData["file data"] || {},
      }

      setUser(userObj)
      localStorage.setItem("interviewgpt_user", JSON.stringify(userObj))
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("interviewgpt_user")
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

