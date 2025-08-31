import { ASTParser } from './astParser';
import { GitHubFileFetcher } from './githubFileFetcher';
import { LocalStorage } from './localStorage';
import { chunkAll, SimpleChunk } from './simpleChunker';

export interface AnalysisProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  errors: string[];
}

export interface FileAnalysis {
  file: string;
  ast_summary: any;
}

export interface RepositorySummary {
  totalFiles: number;
  totalFunctions: number;
  totalClasses: number;
  totalImports: number;
  totalExports: number;
  totalVariables: number;
  fileTypes: string[];
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
}

export class ASTAnalysisService {
  private astParser: ASTParser;
  private fileFetcher: GitHubFileFetcher;
  private localStorage: LocalStorage;

  constructor(githubToken?: string, storageConfig?: any) {
    this.astParser = new ASTParser();
    this.fileFetcher = new GitHubFileFetcher(githubToken);
    this.localStorage = new LocalStorage(storageConfig);
  }

  async analyzeRepository(
    repoUrl: string, 
    progressCallback?: (progress: AnalysisProgress) => void,
    enableChunking: boolean = true,
    enableEmbedding: boolean = false
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
          this.logChunkStatistics(chunks);
        } catch (error: any) {
          const errorMsg = `Chunking failed: ${error.message}`;
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
        chunks
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
      throw new Error(`Failed to load stored analyses: ${error.message}`);
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
}
