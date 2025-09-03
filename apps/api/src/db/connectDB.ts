export class ConnectDB {
    private client: any;
    private collectionName: string;
    
    constructor(collectionName: string = "repo_chunks") {
        this.collectionName = collectionName;
        this.client = undefined;
    }
    
    async initialize(): Promise<void> {
        try {
            if (!this.client) {
                const { QdrantClient } = await import('@qdrant/js-client-rest');
                this.client = new QdrantClient({
                    url: process.env.QDRANT_URL || 'http://localhost:6333',
                    apiKey: process.env.QDRANT_API_KEY
                });
            }
            const collections = await this.client.getCollections();
            const exists = collections.collections.some((c: any) => c.name === this.collectionName);
            
            if (!exists) {
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: 768,
                        distance: 'Cosine'
                    }
                });
            }
        } catch (error: any) {
            console.error(`Failed to initialize Qdrant: ${error.message}`);
            throw error;
        }
    }
    
}