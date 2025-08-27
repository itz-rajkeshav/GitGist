import pc from '../db/connectDB';
import { SimpleChunk } from './simpleChunker';

export interface EmbeddingResult {
  totalChunks: number;
  embeddedChunks: number;
  failedChunks: number;
  errors: string[];
  chunkDetails: ChunkDetail[];
}

export interface ChunkDetail {
  chunk: SimpleChunk;
  embedding?: number[];
  error?: string;
}

export class EmbeddingService {
  private indexName: string;
  private embedder: any;
  private isInitialized: boolean = false;

  constructor() {
    this.indexName = 'gitgist-384';
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const transformers = await import('@xenova/transformers');
      const pipeline = transformers.pipeline;
      const env = transformers.env;
      env.useBrowserCache = false;
      env.allowLocalModels = true;
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.isInitialized = true;
    } catch (error: any) {
      console.error('Failed to load embedding model:', error.message);
      throw error;
    }
  }

  async embedRepository(chunks: SimpleChunk[], repository: string): Promise<EmbeddingResult> {
    await this.ensureInitialized();
    const result: EmbeddingResult = {
      totalChunks: chunks.length,
      embeddedChunks: 0,
      failedChunks: 0,
      errors: [],
      chunkDetails: []
    };

    const index = pc.index(this.indexName);
    const batchSize = 50;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch, index, repository);
      result.embeddedChunks += batchResults.embeddedChunks;
      result.failedChunks += batchResults.failedChunks;
      result.errors.push(...batchResults.errors);
      result.chunkDetails.push(...batchResults.chunkDetails);
    }

    return result;
  }

  private async processBatch(
    chunks: SimpleChunk[],
    index: any,
    repository: string
  ): Promise<{ embeddedChunks: number; failedChunks: number; errors: string[]; chunkDetails: ChunkDetail[] }> {
    const results = { embeddedChunks: 0, failedChunks: 0, errors: [] as string[], chunkDetails: [] as ChunkDetail[] };

    let vectors: any[] = [];

    const embeddings = await this.generateFreeEmbeddings(chunks);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      if (embedding) {
        vectors.push({ id: chunk.id, values: embedding, metadata: { content: chunk.text, file: chunk.file, type: chunk.type, name: chunk.name || '', repository, chunkType: 'ast' } });
        results.embeddedChunks++;
        results.chunkDetails.push({ chunk, embedding });
      } else {
        results.failedChunks++;
        const error = `Failed to generate embedding for chunk ${chunk.id}`;
        results.errors.push(error);
        results.chunkDetails.push({ chunk, error });
      }
    }

    if (vectors.length > 0) {
      try {
        await index.upsert(vectors);
      } catch (error: any) {
        const errorMsg = `Failed to upsert to Pinecone: ${error.message}`;
        results.errors.push(errorMsg);
      }
    }

    return results;
  }

  private async generateFreeEmbeddings(chunks: SimpleChunk[]): Promise<(number[] | null)[]> {
    try {
      const texts = chunks.map(c => c.text);
      const embeddings: (number[] | null)[] = [];
      for (let i = 0; i < texts.length; i++) {
        try {
          const output = await this.embedder(texts[i], { pooling: 'mean', normalize: true });
          embeddings.push(Array.from(output.data) as number[]);
        } catch (error: any) {
          console.error(`Failed to embed chunk ${i}: ${error.message}`);
          embeddings.push(null);
        }
      }
      return embeddings;
    } catch (error: any) {
      console.error(`Embedding generation failed: ${error.message}`);
      return chunks.map(() => null);
    }
  }

  async searchSimilar(query: string, repository?: string, topK: number = 10): Promise<any[]> {
    await this.ensureInitialized();
    try {
      const queryEmbedding = Array.from((await this.embedder(query, { pooling: 'mean', normalize: true })).data) as number[];
      const index = pc.index(this.indexName);
      const resp = await index.query({ vector: queryEmbedding, topK, includeMetadata: true, filter: repository ? { repository } : undefined });
      return resp.matches || [];
    } catch (error: any) {
      console.error(`Search error: ${error.message}`);
      return [];
    }
  }

  getModelInfo(): string {
    return this.isInitialized ? 'Xenova/all-MiniLM-L6-v2 (384 dimensions)' : 'Not initialized';
  }
}


