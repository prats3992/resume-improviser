# Career Assistant - Interview Helper & Resume Improviser

A full-stack application leveraging AI to provide comprehensive assistance for interview preparation and resume improvement.

## Features

- **AI-Powered Chat Interface:** Engage in interactive conversations for interview practice, advice, and general queries.
- **Job Description Analyzer:** Submit job descriptions to get insights, identify key skills, and tailor your application.
- **Resume Analyzer:** Upload or paste your resume for AI-driven feedback on content, formatting, and ATS compatibility.
- **Behavioral Question Generator:** Receive a variety of behavioral questions, potentially customized to specific roles or scenarios.
- **DSA Challenge & Evaluator:** Practice Data Structures and Algorithms problems and get your solutions evaluated.
- **Mock Interview Simulation:** Experience a simulated interview environment to hone your skills and build confidence.
- **Secure User Authentication:** Firebase-powered authentication to manage user accounts and protect data.
- **User Profile Management:** Easily manage and update your personal information.
- **Responsive Design:** Fully responsive interface for use on various devices.
- **Theming:** Light and dark mode support for user preference.

## Tech Stack

- **Frontend:**
    - Next.js (React Framework)
    - React
    - TypeScript
    - Tailwind CSS (Utility-first CSS framework)
    - shadcn (Reusable UI components)
    - React Context API (State Management)
- **Backend (API Layer):**
    - Next.js API Routes (Serverless functions)
- **AI Integration:**
    - Google Gemini API
- **Authentication:**
    - Firebase Authentication
- **Deployment:**
    - Vercel (or similar platform for Next.js applications)

## Application Flow

1.  **Authentication:** Users sign up or log in via Firebase Authentication. User session is managed client-side.
2.  **Feature Selection:** The user chooses a feature from the dashboard, such as Resume Analysis, Job Description Analysis, Behavioral Question Practice, DSA Challenge, or Mock Interview.
3.  **User Input:** The frontend, built with React and Next.js, collects necessary input from the user (e.g., resume text, job description details, code for a DSA problem, chat messages).
4.  **API Request:** The client-side application sends a request to the appropriate Next.js API Route (e.g., `/api/analyze-resume`, `/api/chat`).
5.  **Backend Processing & AI Interaction:**
    - The Next.js API Route receives the request.
    - It may perform validation and then interacts with the Google Gemini API, sending the user's data for processing (e.g., analyzing text, generating questions, evaluating code).
6.  **API Response:** The Gemini API returns the processed information to the Next.js API Route.
7.  **Data to Client:** The API Route forwards the response (e.g., resume feedback, job insights, AI-generated chat message, DSA solution evaluation) back to the client application.
8.  **UI Update:** The React components dynamically update the user interface to display the results, feedback, or next steps to the user.

## Sample User ID and Password
- **User ID:** `iioWeFES`
- **Password:** `hX9BkqjR`