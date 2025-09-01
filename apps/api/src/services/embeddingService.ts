import axios from 'axios';
import { SimpleChunk } from './simpleChunker';
import dotenv from 'dotenv';
dotenv.config();

export interface EmbeddingResult {
    vector: number[];
    chunk_id: string;
    type: string;
}

export interface ChunkDetail {
    chunk: SimpleChunk;
    embedding?: number[];
    error?: string;
}

export class EmbeddingService {
    private apiUrl: string;
    
    constructor(modelName: string = 'hkunlp/instructor-large') {
        this.apiUrl = process.env.INSTRUCTOR_API_URL || 'http://localhost:8000';
    }
    
    async generateEmbedding(chunk: SimpleChunk, instruction?: string): Promise<EmbeddingResult> {
        try {
            const payload = {
                model: 'hkunlp/instructor-large',
                input: [
                    {
                        instruction: instruction || 'Represent the document for retrieval:',
                        text: chunk.text
                    }
                ]
            }
            const response = await axios.post(`${this.apiUrl}/embeddings`, payload);
            if (response.data && response.data.embedding && response.data.embedding.length > 0) {
                return {
                    vector: response.data.embedding,
                    chunk_id: chunk.id,
                    type: chunk.type
                }
            } else {
                throw new Error('Failed to generate embedding');
            }
        } catch (error: any) {
            throw new Error(`Failed to generate embedding: ${error.message}`);
        }
    }
    
    async generateEmbeddings(chunks: SimpleChunk[], instruction?: string): Promise<EmbeddingResult[]> {
        try {
            const embeddings: EmbeddingResult[] = [];
            for (const chunk of chunks) {
                const embedding = await this.generateEmbedding(chunk, instruction);
                embeddings.push(embedding);
            }
            return embeddings;
        } catch (error: any) {
            throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
    }
}