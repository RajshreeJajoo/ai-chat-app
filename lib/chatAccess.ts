import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";

export async function getOwnedChat(
  chatId: string,
  visitorId: string
) {
  if (!ObjectId.isValid(chatId)) {
    return null;
  }

  const client = await clientPromise;
  const db = client.db("ai-chat-db");

  return db.collection("Chat").findOne({
    _id: new ObjectId(chatId),
    visitorId,
  });
}
