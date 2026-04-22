import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}
export async function updateChatSummary(chatId: string, messages: ChatMessage[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  const client = await clientPromise;
  const db = client.db("ai-chat-db");

  // Sirf pichle 20-30 messages ka text lo summary banane ke liye
  const historyText = messages.slice(-30).map((m : ChatMessage)=> `${m.role}: ${m.parts[0].text}`).join("\n");

  const prompt = `Summarize the following technical conversation in 3 concise sentences. Focus on the core technical problems solved and the technologies discussed: \n\n${historyText}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  });

  const result = await response.json();
  const newSummary = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (newSummary) {
    await db.collection("Chat").updateOne(
      { _id: new ObjectId(chatId) },
      { $set: { summary: newSummary } }
    );
  }
}