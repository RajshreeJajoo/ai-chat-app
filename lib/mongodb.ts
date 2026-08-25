import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (uri) {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = Promise.reject(
    new Error("DATABASE_URL is missing from environment")
  );
}

export default clientPromise;
