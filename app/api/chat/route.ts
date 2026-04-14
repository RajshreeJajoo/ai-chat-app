import { NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface UserProfile {
  experience: string;
  skills: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { messages: ChatMessage[], userProfile: UserProfile };
    const { messages, userProfile } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing in .env" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
    // 1. Payload Cleanup: Filter empty messages and ensure correct structure
    const cleanedContents = messages
      .filter((m) => m.parts && m.parts[0]?.text?.trim()) // Remove empty or whitespace-only messages
      .map((m) => ({
        role: m.role === "model" ? "model" : "user", // Role must be exactly 'user' or 'model'
        parts: [{ text: m.parts[0].text.trim() }]
      }));

    if (cleanedContents.length === 0) {
      return NextResponse.json({ error: "No valid messages found" }, { status: 400 });
    }

    // 2. Inject System Prompt into the FIRST message
    const systemPrompt = `
  Tum ek friendly aur concise AI assistant ho. 
  User ka profile bas context ke liye hai, har baar usey repeat mat karo.
  Jawab chota aur point-to-point rakho (Short & Sweet).
  Hindi-English mix use karo.
`;
    if (cleanedContents[0].role === "user") {
      cleanedContents[0].parts[0].text = `${systemPrompt}\n\nUser Question: ${cleanedContents[0].parts[0].text}`;
    }

    // 3. Native Fetch Call
   const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: cleanedContents,
  }),
});

    const result = await response.json();

    if (!response.ok) {
      console.error("Google API Response Error:", result);
      return NextResponse.json({ 
        error: result.error?.message || "Google API failed",
        details: result 
      }, { status: response.status });
    }

    // 4. Send Clean Response
    if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
      const aiResponse = result.candidates[0].content.parts[0].text;
      return NextResponse.json({ text: aiResponse });
    } else {
      throw new Error("Invalid response format from Google API");
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Next.js Route Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}