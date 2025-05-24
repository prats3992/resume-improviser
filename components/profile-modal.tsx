"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@/types/user"
import { GithubIcon, LinkedinIcon, MailIcon, PhoneIcon, GlobeIcon } from "lucide-react"

interface ProfileModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ user, isOpen, onClose }: ProfileModalProps) {
  const { fileData, username } = user
  const personalInfo = fileData?.personalInfo || {}

  const isValidField = (value: any) => {
    return value && value !== "null" && value !== "undefined" && value !== "void" && value !== "none"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>Your personal information</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <Avatar className="h-24 w-24 bg-primary/20 border-2 border-primary">
            <AvatarFallback className="text-2xl font-bold text-primary">
              {personalInfo.name
                ? personalInfo.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)
                : username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h3 className="text-xl font-bold">{isValidField(personalInfo.name) ? personalInfo.name : "User"}</h3>
            {isValidField(personalInfo.role) && <p className="text-muted-foreground">{personalInfo.role}</p>}
          </div>

          <div className="w-full space-y-3">
            {isValidField(personalInfo.email) && (
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${personalInfo.email}`} className="text-sm hover:underline">
                  {personalInfo.email}
                </a>
              </div>
            )}

            {isValidField(personalInfo.phone) && (
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${personalInfo.phone}`} className="text-sm hover:underline">
                  {personalInfo.phone}
                </a>
              </div>
            )}

            {isValidField(personalInfo.website) && (
              <div className="flex items-center gap-2">
                <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                <a
                  href={
                    personalInfo.website.startsWith("http") ? personalInfo.website : `https://${personalInfo.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  {personalInfo.website}
                </a>
              </div>
            )}

            {isValidField(personalInfo.linkedin) && (
              <div className="flex items-center gap-2">
                <LinkedinIcon className="h-4 w-4 text-muted-foreground" />
                <a
                  href={
                    personalInfo.linkedin.startsWith("http")
                      ? personalInfo.linkedin
                      : `https://linkedin.com/in/${personalInfo.linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  LinkedIn
                </a>
              </div>
            )}

            {isValidField(personalInfo.github) && (
              <div className="flex items-center gap-2">
                <GithubIcon className="h-4 w-4 text-muted-foreground" />
                <a
                  href={
                    personalInfo.github.startsWith("http")
                      ? personalInfo.github
                      : `https://github.com/${personalInfo.github}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  GitHub
                </a>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

