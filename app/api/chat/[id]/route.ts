import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params; 
    const client = await clientPromise;
    const db = client.db("ai-chat-db");

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await db.collection("Chat").deleteOne({ 
      _id: new ObjectId(id) 
    });

    await db.collection("Message").deleteMany({ 
      chatId: new ObjectId(id) 
    });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: "Deleted" });
    } else {
      return NextResponse.json({ error: "Chat not found in DB" }, { status: 404 });
    }
  } catch (error) {
    console.error("DELETE_API_ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}