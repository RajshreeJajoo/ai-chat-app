# AI Career Mentor

A full-stack AI chat application that provides real-time career guidance for frontend and AI engineers. Built with Next.js App Router, TypeScript, Gemini API, and MongoDB.

## Features

- **Real-time AI chat** — Gemini 2.5 Flash with typing animation and abort support
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

<img width="1440" height="900" alt="AI Mentor welcome screen" src="https://github.com/user-attachments/assets/9827dd5b-c50a-45bf-96ff-f9666ad7480c" />
<img width="1440" height="900" alt="Chat conversation view" src="https://github.com/user-attachments/assets/50cbd1d2-ee98-4395-a9f7-1408c2e06ade" />
<img width="1440" height="900" alt="Voice and markdown features" src="https://github.com/user-attachments/assets/eab7b0f3-96c6-408e-a632-47ffab1751b5" />

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

If this project helped you, consider giving it a star.
