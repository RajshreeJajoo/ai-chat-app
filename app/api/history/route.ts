import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { getVisitorId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const visitorId = await getVisitorId();
    const client = await clientPromise;
    const db = client.db("ai-chat-db");

    const chats = await db
      .collection("Chat")
      .find({ visitorId })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json(chats);
  } catch (error: unknown) {
    console.error("HISTORY_API_ERROR:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred";

    return NextResponse.json(
      {
        error: "Failed to load chat history",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
