import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
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
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}