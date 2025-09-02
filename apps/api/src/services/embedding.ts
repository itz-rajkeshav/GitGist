import { SimpleChunk } from "./simpleChunker";
import { EmbeddingService, ChunkDetail } from "./embeddingService";
import { ConnectDB } from "../db/connectDB";

export class EmbeddingProcess {
    private embeddingModel: EmbeddingService;
    private vectorDB: ConnectDB;
    
    constructor(collectionName: string = 'repo_chunks') {
        this.embeddingModel = new EmbeddingService();
        this.vectorDB = new ConnectDB(collectionName);
    }
    
    async processEmbedd(chunks: SimpleChunk[], instruction?: string): Promise<void> {
        try {
            // Initialize the vector database
            await this.vectorDB.initialize();
            
            // Generate embeddings for all chunks
            const embeddings = await this.embeddingModel.generateEmbeddings(chunks, instruction);
            
            // Create chunk details for storage
            const chunkDetails: ChunkDetail[] = chunks.map(chunk => ({
                chunk: chunk,
                embedding: undefined // Will be populated by the embedding service
            }));
            
            // Store embeddings in the vector database
            await this.vectorDB.storeEmbedding(embeddings, chunkDetails);
            
            console.log(`Successfully processed ${chunks.length} chunks and stored embeddings`);
        } catch (error: any) {
            console.error(`Failed to process embeddings: ${error.message}`);
            throw error;
        }
    }
}