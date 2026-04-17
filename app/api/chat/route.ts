import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

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
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    // 1. Database Logic: Chat ID handle karna
    let currentChatId: string;
    if (!chatId) {
      const newChat = await db.collection("Chat").insertOne({
        title: lastUserMessage.substring(0, 40) + "...",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      currentChatId = newChat.insertedId.toString();
    } else {
      currentChatId = chatId;
    }

    // 2. User Message Save Karo
    await db.collection("Message").insertOne({
      chatId: new ObjectId(currentChatId),
      role: "user",
      content: lastUserMessage,
      createdAt: new Date(),
    });

    // 3. Gemini 2.5 API Call (v1beta endpoint & System Instruction Fix)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      // Gemini 2.5 models mein system prompt yahan jata hai
      // system_instruction: {
      //   parts: [{ text: `You are an AI Mentor. Your expertise is strictly limited to ${userProfile}. If a user asks anything outside these topics (like cooking, history, or general gossip), politely refuse and say: 'Main sirf AI aur Tech related sawalon ke jawab de sakta hoon. Chalo kuch naya build karte hain!'` }]
      // },

      system_instruction: {
      parts: [{ 
        text: `You are an AI Mentor. Your expertise is strictly limited to ${userProfile.skills}. 
        1. Only answer technical questions related to these topics.
        2. Use a professional yet supportive tone.
        3. If the user asks about non-tech topics (e.g., life advice, food, history), strictly refuse with: 'Main sirf AI aur Tech related sawalon ke jawab de sakta hoon. Chalo kuch naya build karte hain!'
        4. Provide code snippets only in Javascript/React/TypeScript/Next.js context when applicable.` 
      }]
    },
      contents: messages.map((m) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.parts[0].text }],
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // Debugging: Terminal mein poora error dikhega agar Gemini fail hua
    if (result.error) {
      console.error("GEMINI_2.5_ERROR_DETAIL:", JSON.stringify(result.error, null, 2));
      throw new Error(result.error.message || "Gemini API rejection");
    }

    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiResponse) {
      // 4. AI ka jawab Save Karo
      await db.collection("Message").insertOne({
        chatId: new ObjectId(currentChatId),
        role: "model",
        content: aiResponse,
        createdAt: new Date(),
      });

      // 5. Chat ka 'updatedAt' update karo
      await db.collection("Chat").updateOne(
        { _id: new ObjectId(currentChatId) },
        { $set: { updatedAt: new Date() } }
      );

      return NextResponse.json({ text: aiResponse, chatId: currentChatId });
    } else {
      throw new Error("AI ne koi jawab nahi diya - Candidate array empty hai");
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Error";
    console.error("ROUTE_ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

