import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  const { chatId, content } = await req.json();
  const db = (await clientPromise).db("ai-chat-db");
  
  await db.collection("Message").insertOne({
    chatId: new ObjectId(chatId),
    role: "model",
    content: content,
    createdAt: new Date(),
  });
  
  await db.collection("Chat").updateOne(
    { _id: new ObjectId(chatId) },
    { $set: { updatedAt: new Date() } }
  );
  
  return NextResponse.json({ success: true });
}