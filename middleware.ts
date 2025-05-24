import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/"

  // Get the authentication status from cookies or localStorage
  // For simplicity, we'll check if the user is stored in localStorage on the client side
  // This is handled in the auth-context.tsx file

  // For paths that require authentication, we'll handle the redirect in the page component
  // using the useAuth hook and useEffect

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

