# AST Chunking and Embedding Setup

## Overview
This service automatically chunks AST (Abstract Syntax Tree) data from code analysis and embeds it into Pinecone for semantic search.

## Environment Variables Required

Create a `.env` file in the `apps/api/` directory with:

```bash
# OpenAI API Key for embeddings
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone API Key
PINECONE_API_KEY=your_pinecone_api_key_here
```

## How It Works

### 1. AST Chunking
- Parses code files into AST summaries
- Creates semantic chunks from functions, imports, exports, classes, and variables
- Each chunk contains structured information about code elements

### 2. Embedding Process
- Converts text chunks to 1536-dimensional vectors using OpenAI's `text-embedding-3-small`
- Stores vectors in Pinecone with metadata for search
- Processes chunks in batches of 100 for efficiency

### 3. Search Capability
- Query code semantically (e.g., "find authentication functions")
- Filter by repository or file type
- Returns relevant code chunks with similarity scores

## Usage Examples

### Basic Chunking (No API Keys Required)
```typescript
import { buildChunksFromAST } from './services/astChunker';
import { ASTParser } from './services/astParser';

const parser = new ASTParser();
const astSummary = parser.parseCode(code, 'file.ts');
const chunks = buildChunksFromAST({ file: 'file.ts', ast_summary: astSummary });

console.log(`Generated ${chunks.length} chunks`);
chunks.forEach(chunk => {
  console.log(`- ${chunk.meta.kind}: ${chunk.content.substring(0, 100)}...`);
});
```

### Full Analysis with Embedding
```typescript
import { ASTAnalysisService } from './services/astAnalysisService';

const service = new ASTAnalysisService(
  'github_token',  // optional
  {},              // storage config
  'openai_key'     // optional, will use env var
);

const result = await service.analyzeRepository(
  'https://github.com/user/repo',
  undefined,       // progress callback
  true             // enable embedding
);

console.log(`Embedded ${result.embeddingResult?.embeddedChunks} chunks`);
```

### Semantic Search
```typescript
import { EmbeddingService } from './services/embeddingService';

const embeddingService = new EmbeddingService();
const results = await embeddingService.searchSimilar(
  "find authentication functions",
  "repo-name",     // optional filter
  10               // top K results
);

results.forEach(match => {
  console.log(`Score: ${match.score}`);
  console.log(`File: ${match.metadata.file}`);
  console.log(`Content: ${match.metadata.content}`);
});
```

## Chunk Types Generated

1. **Function Chunks**: Individual functions with params, calls, and flags
2. **Import Chunks**: Module imports grouped by source
3. **Export Chunks**: Exported functions, variables, and classes
4. **Class Chunks**: Class definitions
5. **Variable Chunks**: Variable declarations
6. **Summary Chunks**: Fallback for files with minimal content

## Configuration Options

```typescript
interface ChunkOptions {
  maxCharactersPerChunk?: number;  // default: 1200
  minCharactersPerChunk?: number;  // default: 300
}
```

## Testing

Run the test script to see chunking in action:
```bash
cd apps/api
node -r esbuild-register src/testChunking.ts
```

This will show:
- AST parsing results
- Generated chunks with content previews
- Embedding results (if API keys are set)
