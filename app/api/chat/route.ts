
import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { updateChatSummary } from "@/lib/summaryUtils";

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
    const client = await clientPromise;
    const db = client.db("ai-chat-db");

    const body = (await req.json()) as {
      messages: ChatMessage[];
      userProfile: UserProfile;
      chatId?: string;
    };

    const { messages, userProfile, chatId } = body;
    const lastUserMessage = messages[messages.length - 1].parts[0].text;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    // 1. Fetch Chat Context (Summary)
    let currentChatId = chatId ? new ObjectId(chatId) : null;
    let chatDoc = null;

    if (currentChatId) {
      chatDoc = await db.collection("Chat").findOne({ _id: currentChatId });
    } else {
      const newChat = await db.collection("Chat").insertOne({
        title: lastUserMessage.substring(0, 40) + "...",
        summary: "", // Initialize summary
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      currentChatId = newChat.insertedId;
    }

    // 2. Save User Message
    await db.collection("Message").insertOne({
      chatId: currentChatId,
      role: "user",
      content: lastUserMessage,
      createdAt: new Date(),
    });

    // 3. Prepare Payload with Summary
    const existingSummary = chatDoc?.summary || "No previous summary.";
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      system_instruction: {
        parts: [{ 
          text: `You are an AI Mentor. Your expertise is strictly limited to  ${userProfile.skills}.
          --- CHAT CONTEXT SUMMARY ---
          ${existingSummary}
          ----------------------------
        1.  Use the summary above to maintain continuity.
        2. Only answer technical questions related to these topics.
        3. Use a professional yet supportive tone.
        4. If the user asks about non-tech topics (e.g., life advice, food, history), strictly refuse with: 'Main sirf AI aur Tech related sawalon ke jawab de sakta hoon. Chalo kuch naya build karte hain!'
        5. Provide code snippets only in Javascript/React/TypeScript/Next.js context when applicable.`
        }]
      },
      // Last 10 messages for immediate context
      contents: messages.slice(-10).map((m) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.parts[0].text }],
      })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiResponse) {
      // 4. Save AI Response
      await db.collection("Message").insertOne({
        chatId: currentChatId,
        role: "model",
        content: aiResponse,
        createdAt: new Date(),
      });

      // 5. Update Chat Metadata (and potentially trigger summary refresh if > 20 msgs)
      await db.collection("Chat").updateOne(
        { _id: currentChatId },
        { $set: { updatedAt: new Date() } }
      );

      
      const updatedMessages = [
  ...messages, 
  { role: "user" as const, parts: [{ text: lastUserMessage }] }, 
  { role: "model" as const, parts: [{ text: aiResponse }] }
];
      // Har 10 messages par summary update karo
      if (updatedMessages.length % 10 === 0) {
        updateChatSummary(currentChatId.toString(), updatedMessages)
          .catch(err => console.error("Summary update failed:", err));
      }

      return NextResponse.json({ text: aiResponse, chatId: currentChatId.toString() });
    } else {
      throw new Error("AI response failed");
    }

  } catch (error: unknown) {
          console.error("API Error:", error); // <-- Yahan check karein

    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Error" }, { status: 500 });
  }
}