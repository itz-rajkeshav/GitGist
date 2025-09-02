let QdrantClient: any;

// Initialize QdrantClient dynamically
async function getQdrantClient() {
    if (!QdrantClient) {
        const module = await import('@qdrant/qdrant-js');
        QdrantClient = module.QdrantClient;
    }
    return QdrantClient;
}

import dotenv from 'dotenv';
import { ChunkDetail, EmbeddingResult } from '../services/embeddingService';

dotenv.config();

export class ConnectDB {
    private client: any;
    private collectionName: string;
    
    constructor(collectionName: string = "repo_chunks") {
        this.collectionName = collectionName;
        this.client = null;
    }
    
    async initialize(): Promise<void> {
        try {
            const QdrantClientClass = await getQdrantClient();
            this.client = new QdrantClientClass({
                url: process.env.QDRANT_URL,
                apiKey: process.env.QDRANT_API_KEY
            });
            
            const collectionExists = await this.client.collectionExists(this.collectionName);
            if (!collectionExists) {
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: 768,
                        distance: "Cosine"
                    }
                });
                console.log(`Collection ${this.collectionName} created`);
            }
        } catch (error: any) {
            console.error(`Failed to connect to Qdrant: ${error.message}`);
        }
    }
    
    async storeEmbedding(embedding: EmbeddingResult[], chunks: ChunkDetail[]): Promise<void> {
        try {
            if (!this.client) {
                await this.initialize();
            }
            const points = embedding.map((embedding, index) => ({
                id: embedding.chunk_id,
                vector: embedding.vector,
                payload: {
                    text: chunks[index]?.chunk?.text || '',
                    type: embedding.type,
                    chunk_id: embedding.chunk_id,
                    file: chunks[index]?.chunk?.file || '',
                    name: chunks[index]?.chunk?.name || ''
                }
            }));
            
            await this.client.upsert(this.collectionName, {
                points: points
            });
            
            console.log(`Stored ${points.length} embeddings in collection ${this.collectionName}`);
        } catch (error: any) {
            console.error(`Failed to store embedding: ${error.message}`);
            throw error;
        }
    }
}
