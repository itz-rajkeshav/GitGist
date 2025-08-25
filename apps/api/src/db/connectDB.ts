import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

async function ensureIndex() {
  try {
    await pc.createIndex({
      name: "gitgist",
      dimension: 1536,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1"
        }
      }
    });
    console.log("Pinecone index 'gitgist' created successfully");
  } catch (error: any) {
    if (error.message?.includes('ALREADY_EXISTS')) {
      console.log("ℹPinecone index 'gitgist' already exists");
    } else {
      console.error("Error creating Pinecone index:", error.message);
    }
  }
}
ensureIndex();
export default pc;