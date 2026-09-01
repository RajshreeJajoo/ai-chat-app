import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getVisitorId } from "@/lib/session";
import { getOwnedChat } from "@/lib/chatAccess";

export async function POST(req: Request) {
  const visitorId = await getVisitorId();
  const { chatId, content } = await req.json();

  if (!ObjectId.isValid(chatId)) {
    return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
  }

  const chat = await getOwnedChat(chatId, visitorId);

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const db = (await clientPromise).db("ai-chat-db");

  await db.collection("Message").insertOne({
    chatId: new ObjectId(chatId),
    role: "model",
    content: content,
    createdAt: new Date(),
  });

  await db.collection("Chat").updateOne(
    { _id: new ObjectId(chatId), visitorId },
    { $set: { updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
