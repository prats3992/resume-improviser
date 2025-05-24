import LoginForm from "@/components/login-form"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">InterviewGPT</h1>
          <p className="mt-2 text-white/80">Your AI-powered interview preparation assistant</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
