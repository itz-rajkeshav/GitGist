import { LocalStorage } from './localStorage';
import { EmbeddingService } from './embeddingService';
import { SimpleChunk } from './simpleChunker';

export class ASTDataEmbedder {
  private localStorage: LocalStorage;
  private embeddingService: EmbeddingService;

  constructor() {
    this.localStorage = new LocalStorage();
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Main method to embed AST parser data from localStorage
   */
  async embedASTData(): Promise<void> {
    try {
      console.log('🚀 Starting AST data embedding process...');
      
      // Discover stored repositories
      const repositories = await this.localStorage.listStoredRepositories();
      console.log(`📁 Repositories found: ${repositories.length}`, repositories);
      
      if (repositories.length === 0) {
        console.log('ℹ️ No stored repositories found. Please run AST analysis first.');
        return;
      }
      
      // Use most recent repository
      const latestRepo = repositories[repositories.length - 1];
      console.log(`🎯 Repository: ${latestRepo}`);
      
      // Load analyses
      const analyses = await this.localStorage.loadRepoAnalyses(latestRepo);
      console.log(`📊 File analyses loaded: ${analyses.length}`);
      
      // Convert analyses to chunks
      const chunks = this.convertAnalysesToChunks(analyses);
      console.log(`\n🎯 Chunks created: ${chunks.length}`);
      
      // Embed chunks
      const embeddingResult = await this.embeddingService.embedRepository(chunks, latestRepo);
      
      // Report
      this.logEmbeddingResults(embeddingResult);
      
    } catch (error: any) {
      console.error('❌ Error during AST data embedding:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Convert AST analyses to chunks for embedding
   */
  private convertAnalysesToChunks(analyses: any[]): SimpleChunk[] {
    const chunks: SimpleChunk[] = [];
    let id = 1;
    
    analyses.forEach((analysis, idx) => {
      console.log(`\n📄 File ${idx + 1}/${analyses.length}: ${analysis.file}`);
      const { ast_summary } = analysis;

      // Functions
      for (const func of ast_summary.functions) {
        chunks.push({
          id: `func_${id++}`,
          text: `Function: ${func.name} - Params: ${func.params.join(', ')} - Calls: ${func.calls.join(', ')} - Async: ${func.isAsync} - Exported: ${func.isExported}`,
          file: analysis.file,
          type: 'function',
          name: func.name
        });
        console.log(`   ✓ Function: ${func.name}`);
      }

      // Classes
      for (const className of ast_summary.classes) {
        chunks.push({ id: `class_${id++}`, text: `Class: ${className}`, file: analysis.file, type: 'class', name: className });
        console.log(`   ✓ Class: ${className}`);
      }

      // Imports
      for (const imp of ast_summary.imports) {
        chunks.push({ id: `import_${id++}`, text: `Import: ${imp.imports.join(', ')} from ${imp.source} - Default: ${imp.isDefault} - Namespace: ${imp.isNamespace}`, file: analysis.file, type: 'import', name: imp.source });
        console.log(`   ✓ Import: ${imp.source}`);
      }

      // Exports
      for (const exp of ast_summary.exports) {
        chunks.push({ id: `export_${id++}`, text: `Export: ${exp.name} - Type: ${exp.type} - Default: ${exp.isDefault}`, file: analysis.file, type: 'export', name: exp.name });
        console.log(`   ✓ Export: ${exp.name}`);
      }

      // Variables
      for (const variable of ast_summary.variables) {
        chunks.push({ id: `var_${id++}`, text: `Variable: ${variable}`, file: analysis.file, type: 'variable', name: variable });
        console.log(`   ✓ Variable: ${variable}`);
      }
    });
    
    return chunks;
  }

  /**
   * Log the embedding results
   */
  private logEmbeddingResults(embeddingResult: any): void {
    console.log('\n🎉 AST Data Embedding Complete!');
    console.log('📊 Final Results:');
    console.log(`   Total chunks: ${embeddingResult.totalChunks}`);
    console.log(`   Successfully embedded: ${embeddingResult.embeddedChunks}`);
    console.log(`   Failed chunks: ${embeddingResult.failedChunks}`);
    console.log(`   Errors: ${embeddingResult.errors.length}`);
    
    if (embeddingResult.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      embeddingResult.errors.forEach((err: string, i: number) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }
    
    // Sample embedded chunks
    console.log('\n🔍 Sample embedded chunks:');
    const sample = embeddingResult.chunkDetails.slice(0, 5);
    sample.forEach((detail: any, i: number) => {
      if (detail.embedding) {
        console.log(`   ${i + 1}. ${detail.chunk.name} (${detail.chunk.type})`);
        console.log(`      File: ${detail.chunk.file}`);
        console.log(`      Embedding dimensions: ${detail.embedding.length}`);
        console.log(`      First 5 values: [${detail.embedding.slice(0, 5).join(', ')}...]`);
      }
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<void> {
    try {
      const stats = await this.localStorage.getStorageStats();
      console.log('\n📈 Storage Statistics:');
      console.log(`   Total repositories: ${stats.totalRepositories}`);
      console.log(`   Total size: ${(stats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
      if (stats.oldestAnalysis) {
        console.log(`   Oldest analysis: ${stats.oldestAnalysis.toISOString()}`);
      }
      if (stats.newestAnalysis) {
        console.log(`   Newest analysis: ${stats.newestAnalysis.toISOString()}`);
      }
    } catch (error: any) {
      console.error('❌ Error getting storage stats:', error.message);
    }
  }
}

// Export a function to easily run the embedding process
export async function runASTDataEmbedding(): Promise<void> {
  const embedder = new ASTDataEmbedder();
  await embedder.embedASTData();
}

// Export a function to get storage stats
export async function getASTStorageStats(): Promise<void> {
  const embedder = new ASTDataEmbedder();
  await embedder.getStorageStats();
}
