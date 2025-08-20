import { ASTParser, FileAnalysis } from './astParser';
import { GitHubFileFetcher, GitHubFile } from './githubFileFetcher';
import { LocalStorage } from './localStorage';

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
    progressCallback?: (progress: AnalysisProgress) => void
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
      
      const duration = Date.now() - startTime;
      
      const result: AnalysisResult = {
        repository: repoUrl,
        totalFiles: files.length,
        processedFiles,
        analyses,
        summary,
        storagePath: savedFiles[savedFiles.length - 1], // Index file path
        errors,
        duration
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
   * Get repository statistics without full analysis
   */
  async getRepositoryStats(repoUrl: string): Promise<any> {
    try {
      return await this.fileFetcher.getRepoStats(repoUrl);
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
   * Analyze repository with real-time console output
   */
  async analyzeRepositoryWithConsoleOutput(repoUrl: string): Promise<AnalysisResult> {
    console.log('🚀 Starting AST Analysis for repository:', repoUrl);
    console.log('=' .repeat(60));
    
    const result = await this.analyzeRepository(repoUrl, (progress) => {
      const percentage = Math.round((progress.processedFiles / progress.totalFiles) * 100);
      console.log(`📊 Progress: ${percentage}% (${progress.processedFiles}/${progress.totalFiles})`);
      console.log(`📄 Current file: ${progress.currentFile}`);
      
      if (progress.errors.length > 0) {
        console.log(`⚠️  Errors so far: ${progress.errors.length}`);
      }
      console.log('-'.repeat(40));
    });
    
    console.log('✅ Analysis Complete!');
    console.log('=' .repeat(60));
    console.log('📈 Final Summary:');
    console.log(`   Total Files: ${result.totalFiles}`);
    console.log(`   Processed: ${result.processedFiles}`);
    console.log(`   Functions: ${result.summary.totalFunctions}`);
    console.log(`   Imports: ${result.summary.totalImports}`);
    console.log(`   Exports: ${result.summary.totalExports}`);
    console.log(`   Classes: ${result.summary.totalClasses}`);
    console.log(`   Variables: ${result.summary.totalVariables}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log(`   Storage: ${result.storagePath}`);
    
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('=' .repeat(60));
    
    return result;
  }
}
