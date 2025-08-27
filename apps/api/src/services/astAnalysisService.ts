import { ASTParser, FileAnalysis } from './astParser';
import { GitHubFileFetcher, GitHubFile } from './githubFileFetcher';
import { LocalStorage } from './localStorage';
import { chunkAll, SimpleChunk } from './simpleChunker';
import { EmbeddingService, EmbeddingResult } from './embeddingService';

export interface AnalysisProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  errors: string[];
}

export interface AnalysisResult {
  repository: string;
  totalFiles: number;
  processedFiles: number;
  analyses: FileAnalysis[];
  summary: any;
  storagePath: string;
  errors: string[];
  duration: number;
  chunks?: SimpleChunk[];
  embeddingResult?: EmbeddingResult;
}

export class ASTAnalysisService {
  private astParser: ASTParser;
  private fileFetcher: GitHubFileFetcher;
  private localStorage: LocalStorage;
  private embeddingService: EmbeddingService;

  constructor(githubToken?: string, storageConfig?: any) {
    this.astParser = new ASTParser();
    this.fileFetcher = new GitHubFileFetcher(githubToken);
    this.localStorage = new LocalStorage(storageConfig);
    this.embeddingService = new EmbeddingService();
  }

  async analyzeRepository(
    repoUrl: string, 
    progressCallback?: (progress: AnalysisProgress) => void,
    enableChunking: boolean = true,
    enableEmbedding: boolean = true
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      console.log(`Starting analysis of repository: ${repoUrl}`);
      
      // Fetch all supported files from the repository
      const files = await this.fileFetcher.getAllSupportedFilesWithContent(repoUrl);
      console.log(`Found ${files.length} supported files to analyze`);
      
      const analyses: FileAnalysis[] = [];
      let processedFiles = 0;
      
      // Process each file
      for (const file of files) {
        try {
          if (progressCallback) {
            progressCallback({
              totalFiles: files.length,
              processedFiles,
              currentFile: file.path,
              errors
            });
          }
          
          console.log(`Analyzing file: ${file.path}`);
          
          // Parse the file content
          const astSummary = this.astParser.parseCode(file.content, file.path);
          
          // Create file analysis
          const analysis: FileAnalysis = {
            file: file.path,
            ast_summary: astSummary
          };
          
          analyses.push(analysis);
          processedFiles++;
          
          // Log the analysis for this file
          console.log(`✓ ${file.path}:`, {
            functions: astSummary.functions.length,
            imports: astSummary.imports.length,
            exports: astSummary.exports.length,
            classes: astSummary.classes.length,
            variables: astSummary.variables.length
          });
          
        } catch (error: any) {
          const errorMsg = `Error analyzing ${file.path}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      // Save all analyses to local storage
      console.log(`Saving ${analyses.length} analyses to local storage...`);
      const { savedFiles, summary } = await this.localStorage.saveMultipleFileAnalyses(repoUrl, analyses);
      
      // Generate chunks if enabled
      let chunks: SimpleChunk[] | undefined;
      if (enableChunking) {
        try {
          console.log(`\n🔪 Starting chunking process...`);
          chunks = chunkAll(analyses, { maxSize: 500, combine: true });
          console.log(`✅ Generated ${chunks.length} chunks`);
          
          // Log detailed chunk information
          this.logChunks(chunks);
          
          // Log chunk statistics by type
          this.logChunkStatistics(chunks);
        } catch (error: any) {
          const errorMsg = `Chunking failed: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      // Generate embeddings if enabled
      let embeddingResult: EmbeddingResult | undefined;
      if (enableEmbedding && chunks) {
        try {
          console.log(`\n🚀 Starting FREE embedding process...`);
          console.log(`📊 Preparing to embed ${chunks.length} chunks...`);
          
          embeddingResult = await this.embeddingService.embedRepository(chunks, repoUrl);
          
          // Log detailed embedding results
          this.logEmbeddingResults(embeddingResult);
        } catch (error: any) {
          const errorMsg = `Embedding failed: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      const duration = Date.now() - startTime;
      
      const result: AnalysisResult = {
        repository: repoUrl,
        totalFiles: files.length,
        processedFiles,
        analyses,
        summary,
        storagePath: savedFiles[savedFiles.length - 1], // Index file path
        errors,
        duration,
        chunks,
        embeddingResult
      };
      
      console.log(`Analysis completed in ${duration}ms`);
      console.log(`Summary:`, summary);
      
      return result;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      throw new Error(`Repository analysis failed after ${duration}ms: ${error.message}`);
    }
  }

  /**
   * Log chunk details in a simple format
   */
  private logChunks(chunks: SimpleChunk[]): void {
    console.log('\n📝 Chunk Summary:');
    console.log('─'.repeat(60));
    
    chunks.forEach((chunk, index) => {
      console.log(`${index + 1}. ${chunk.type.toUpperCase()}: ${chunk.name || chunk.file}`);
      console.log(`   File: ${chunk.file}`);
      console.log(`   Size: ${chunk.text.length} chars`);
      console.log(`   Preview: ${chunk.text.substring(0, 80)}${chunk.text.length > 80 ? '...' : ''}`);
      console.log('   ' + '─'.repeat(40));
    });
  }

  /**
   * Log chunk statistics by type
   */
  private logChunkStatistics(chunks: SimpleChunk[]): void {
    const stats = {
      function: 0,
      class: 0,
      import: 0,
      export: 0,
      variable: 0,
      summary: 0
    };
    
    chunks.forEach(chunk => {
      stats[chunk.type]++;
    });
    
    console.log('\n📊 Chunk Statistics by Type:');
    console.log('─'.repeat(40));
    Object.entries(stats).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`   ${type.toUpperCase()}: ${count} chunks`);
      }
    });
    console.log(`   TOTAL: ${chunks.length} chunks`);
    console.log('─'.repeat(40));
  }

  /**
   * Log detailed embedding results
   */
  private logEmbeddingResults(embeddingResult: EmbeddingResult): void {
    console.log('\n🎉 Embedding Results:');
    console.log('─'.repeat(50));
    console.log(`   Total chunks: ${embeddingResult.totalChunks}`);
    console.log(`   Successfully embedded: ${embeddingResult.embeddedChunks}`);
    console.log(`   Failed chunks: ${embeddingResult.failedChunks}`);
    console.log(`   Errors: ${embeddingResult.errors.length}`);
    
    if (embeddingResult.errors.length > 0) {
      console.log('\n❌ Embedding Errors:');
      embeddingResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Log sample embedded chunks
    console.log('\n🔍 Sample Embedded Chunks:');
    const sampleChunks = embeddingResult.chunkDetails.slice(0, 3);
    sampleChunks.forEach((chunkDetail, index) => {
      if (chunkDetail.embedding) {
        console.log(`   ${index + 1}. ${chunkDetail.chunk.name || chunkDetail.chunk.file} (${chunkDetail.chunk.type})`);
        console.log(`      File: ${chunkDetail.chunk.file}`);
        console.log(`      Embedding dimensions: ${chunkDetail.embedding.length}`);
        console.log(`      First 5 values: [${chunkDetail.embedding.slice(0, 5).join(', ')}...]`);
      }
    });
    console.log('─'.repeat(50));
  }

  /**
   * Get analysis for a specific file
   */
  async analyzeFile(repoUrl: string, filePath: string): Promise<FileAnalysis> {
    try {
      const repoInfo = this.fileFetcher.parseRepoUrl(repoUrl);
      const file = await this.fileFetcher.getFileContent(repoInfo, filePath);
      
      if (!this.astParser.isSupportedFile(file.path)) {
        throw new Error(`File type not supported: ${file.path}`);
      }
      
      const astSummary = this.astParser.parseCode(file.content, file.path);
      
      return {
        file: file.path,
        ast_summary: astSummary
      };
    } catch (error: any) {
      throw new Error(`Failed to analyze file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Load stored analyses for a repository
   */
  async loadStoredAnalyses(repoUrl: string): Promise<FileAnalysis[]> {
    try {
      return await this.localStorage.loadRepoAnalyses(repoUrl);
    } catch (error: any) {
      throw new Error(`Failed to load stored analyses: ${error.message}`);
    }
  }

  /**
   * Embed existing chunks without re-analyzing
   */
  async embedExistingChunks(chunks: SimpleChunk[], repoUrl: string): Promise<EmbeddingResult> {
    try {
      console.log(`🚀 Starting embedding for ${chunks.length} existing chunks...`);
      const result = await this.embeddingService.embedRepository(chunks, repoUrl);
      console.log(`✅ Embedding completed: ${result.embeddedChunks} chunks embedded`);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to embed existing chunks: ${error.message}`);
    }
  }

  /**
   * Get repository statistics without full analysis
   */
  async getRepositoryStats(repoUrl: string): Promise<any> {
    try {
      const repoInfo = this.fileFetcher.parseRepoUrl(repoUrl);
      return await this.fileFetcher.getRepoStats(repoInfo);
    } catch (error: any) {
      throw new Error(`Failed to get repository stats: ${error.message}`);
    }
  }

  /**
   * Load previously stored analysis
   */
  async loadStoredAnalysis(repoUrl: string): Promise<FileAnalysis[]> {
    try {
      return await this.localStorage.loadRepoAnalyses(repoUrl);
    } catch (error: any) {
      throw new Error(`Failed to load stored analysis: ${error.message}`);
    }
  }

  /**
   * List all stored repository analyses
   */
  async listStoredAnalyses(): Promise<string[]> {
    try {
      return await this.localStorage.listStoredRepositories();
    } catch (error: any) {
      throw new Error(`Failed to list stored analyses: ${error.message}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<any> {
    try {
      return await this.localStorage.getStorageStats();
    } catch (error: any) {
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }

  /**
   * Clean up old analyses
   */
  async cleanupOldAnalyses(daysOld: number = 30): Promise<number> {
    try {
      return await this.localStorage.cleanupOldAnalyses(daysOld);
    } catch (error: any) {
      throw new Error(`Failed to cleanup old analyses: ${error.message}`);
    }
  }

  /**
   * Search for similar code chunks
   */
  async searchCode(query: string, repository?: string, topK: number = 10): Promise<any[]> {
    try {
      return await this.embeddingService.searchSimilar(query, repository, topK);
    } catch (error: any) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}
