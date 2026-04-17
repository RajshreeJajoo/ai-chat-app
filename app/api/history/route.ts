import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

export const dynamic = 'force-dynamic'; 

export async function GET() {    
    try {
        const client = await clientPromise;
        const db = client.db("ai-chat-db"); 

        const chats = await db.collection("Chat") 
            .find({})
            .sort({ updatedAt: -1 }) 
            .toArray();
        
        return NextResponse.json(chats);
    } catch (error: unknown) {
        console.error("HISTORY_API_ERROR:", error);

        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

        return NextResponse.json(
            { 
                error: "Database se chats nahi mil rahi", 
                details: errorMessage 
            }, 
            { status: 500 }
        );
    }
}