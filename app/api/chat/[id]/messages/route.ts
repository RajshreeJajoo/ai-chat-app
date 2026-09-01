import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getVisitorId } from "@/lib/session";
import { getOwnedChat } from "@/lib/chatAccess";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const visitorId = await getVisitorId();
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    const chat = await getOwnedChat(id, visitorId);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db("ai-chat-db");

    const messages = await db
      .collection("Message")
      .find({ chatId: new ObjectId(id) })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
