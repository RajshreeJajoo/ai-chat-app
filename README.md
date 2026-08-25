# AI Career Mentor

> Full-stack AI career mentor — Next.js · TypeScript · Gemini API · MongoDB · Voice Chat

[![Live Demo](https://img.shields.io/badge/demo-vercel-black?style=flat-square&logo=vercel)](https://ai-chat-app-steel-xi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)

A full-stack AI chat application that provides real-time career guidance for frontend and AI engineers. Built with Next.js App Router, TypeScript, Gemini API, and MongoDB.

**Live Demo:** https://ai-chat-app-steel-xi.vercel.app

## Features

- **Dual input modes** — Type for instant text replies; mic for voice answers with clear English TTS
- **Persistent history** — Multi-session chat storage in MongoDB with sidebar navigation
- **Context summarization** — Automatic conversation summaries for long sessions
- **Voice interaction** — Browser Speech-to-Text and Text-to-Speech
- **Markdown rendering** — Code blocks with syntax highlighting via `react-markdown`
- **Responsive UI** — Mobile-friendly layout with Tailwind CSS
- **Starter prompts** — Quick-start cards for React, Next.js, and AI topics

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | MongoDB |
| AI | Google Gemini API |
| Icons | Lucide React |

## Screenshots

| Welcome | Chat | History |
|---------|------|---------|
| <img alt="Welcome screen" src="https://github.com/user-attachments/assets/9827dd5b-c50a-45bf-96ff-f9666ad7480c" width="100%" /> | <img alt="Chat view" src="https://github.com/user-attachments/assets/50cbd1d2-ee98-4395-a9f7-1408c2e06ade" width="100%" /> | <img alt="Features" src="https://github.com/user-attachments/assets/eab7b0f3-96c6-408e-a632-47ffab1751b5" width="100%" /> |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

### Installation

```bash
git clone https://github.com/RajshreeJajoo/ai-chat-app.git
cd ai-chat-app
npm install
```

### Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `DATABASE_URL` | MongoDB connection string |

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Vercel

1. Push this repo to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add `GEMINI_API_KEY` and `DATABASE_URL` in project environment settings
4. Deploy

## Project Structure

```
ai-chat-app/
├── app/
│   ├── api/chat/          # Chat & message endpoints
│   ├── api/history/       # Chat history listing
│   ├── hooks/useSpeech.ts # Voice input/output
│   └── page.tsx           # Main chat UI
├── components/chat/       # Chat UI components
├── lib/
│   ├── mongodb.ts         # Database client
│   └── summaryUtils.ts    # Conversation summarization
└── .env.example
```

## Architecture Highlights

- **Chat persistence** — Separate `Chat` and `Message` collections with ObjectId linking
- **Long-context handling** — Rolling summary updated every 10 messages; last 10 messages sent to Gemini
- **Scoped AI mentor** — System prompt restricts answers to configured tech skills

## Future Improvements

- [ ] User authentication (login/signup)
- [ ] Streaming responses (SSE)
- [ ] Dark mode
- [ ] Export chat history

## Author

**Rajshree Jajoo** — Frontend Engineer | React | Next.js | TypeScript

- [LinkedIn](https://www.linkedin.com/in/rajshree-jajoo-297049184)
- [GitHub](https://github.com/RajshreeJajoo)
- [Live Demo](https://ai-chat-app-steel-xi.vercel.app)

If this project helped you, consider giving it a star.
