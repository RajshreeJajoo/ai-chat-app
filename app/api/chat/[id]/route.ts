import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getVisitorId } from "@/lib/session";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const visitorId = await getVisitorId();
    const { id } = await context.params;
    const client = await clientPromise;
    const db = client.db("ai-chat-db");

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await db.collection("Chat").deleteOne({
      _id: new ObjectId(id),
      visitorId,
    });

    if (result.deletedCount !== 1) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    await db.collection("Message").deleteMany({
      chatId: new ObjectId(id),
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE_API_ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
